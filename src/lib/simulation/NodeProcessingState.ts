import type { NodeCapacity, NodeMetrics } from "@/types";

// ─────────────────────────────────────────────
// NodeProcessingState
// Manages per-node queue, active processing slots,
// and completion timing for realistic server simulation.
// ─────────────────────────────────────────────

export class NodeProcessingState {
  readonly nodeId: string;
  capacity: NodeCapacity;

  /** Packet IDs currently being actively processed */
  private activeSlots = new Set<string>();
  /** FIFO queue of { id, enqueuedAtMs } waiting to be processed */
  private waitQueue: { id: string; enqueuedAt: number }[] = [];
  /** Map<packetId, processingStartTimeMs> — tracks when each packet started processing */
  private processingTimers = new Map<string, number>();
  /** Total packets dropped (queue overflow / timeout) since last reset */
  private _dropCount = 0;
  /** Rolling throughput tracker */
  private _completedInWindow = 0;
  private _windowStartMs = 0;
  private _throughputPerSec = 0;
  
  /** Whether the node has crashed due to memory exhaustion */
  public isCrashed = false;
  /** Cooldown timer for crash recovery */
  private crashRecoveryTimeMs = 0;

  constructor(nodeId: string, capacity: NodeCapacity) {
    this.nodeId = nodeId;
    this.capacity = capacity;
    this._windowStartMs = performance.now();
  }

  // ─── Derived limits ──────────────────────────────────────────

  /** Effective max concurrent = min(configured, memory-constrained) */
  get effectiveMaxConcurrent(): number {
    const memoryLimit = Math.floor(this.capacity.memoryMB / this.capacity.memoryPerRequestMB);
    return Math.min(this.capacity.maxConcurrent, memoryLimit);
  }

  get effectiveProcessingTimeMs(): number {
    return this.capacity.processingTimeMs / this.capacity.cpuCores;
  }
  
  /** Check if memory utilization has exceeded 100% */
  get isMemoryExhausted(): boolean {
    if (this.capacity.memoryMB === 0) return false;
    const currentMemory = this.activeSlots.size * this.capacity.memoryPerRequestMB;
    return currentMemory > this.capacity.memoryMB;
  }

  // ─── Admission ───────────────────────────────────────────────

  /** Can this node accept a new request into an active processing slot? */
  canAccept(): boolean {
    if (this.isCrashed) return false;
    // Only constrain by maxConcurrent. Memory exhaustion will cause a crash instead.
    return this.activeSlots.size < this.capacity.maxConcurrent;
  }

  /** Can this node queue a new request? */
  canQueue(): boolean {
    return this.waitQueue.length < this.capacity.queueLimit;
  }

  /**
   * Try to admit a packet. Returns the resulting status.
   * - "processing" → packet accepted into active slot
   * - "queued"     → packet added to wait queue
   * - "dropped"    → queue overflow, rejected
   */
  admit(packetId: string, nowMs: number): "processing" | "queued" | "dropped" {
    // Attempt crash recovery
    if (this.isCrashed && nowMs > this.crashRecoveryTimeMs) {
      this.isCrashed = false;
    }

    if (this.isCrashed) {
      this._dropCount++;
      return "dropped";
    }

    if (this.canAccept()) {
      this.startProcessing(packetId, nowMs);
      
      // Check for memory crash immediately after admission
      if (this.isMemoryExhausted) {
        this.crash(nowMs);
      }
      
      return "processing";
    }
    if (this.canQueue()) {
      this.waitQueue.push({ id: packetId, enqueuedAt: nowMs });
      return "queued";
    }
    this._dropCount++;
    return "dropped";
  }
  
  /** Crash the node, dropping all active and queued packets */
  private crash(nowMs: number): void {
    this.isCrashed = true;
    this.crashRecoveryTimeMs = nowMs + 10000; // 10 seconds downtime
    
    // Increment drop count for everything we are about to destroy
    this._dropCount += this.activeSlots.size + this.waitQueue.length;
    
    this.activeSlots.clear();
    this.waitQueue.length = 0;
    this.processingTimers.clear();
  }

  // ─── Processing ──────────────────────────────────────────────

  private startProcessing(packetId: string, nowMs: number): void {
    this.activeSlots.add(packetId);
    this.processingTimers.set(packetId, nowMs);
  }

  /**
   * Returns IDs of packets that have finished processing.
   * Does NOT remove them — caller must call `completePacket()`.
   */
  getCompletedPackets(nowMs: number): string[] {
    const completed: string[] = [];
    const threshold = this.effectiveProcessingTimeMs;

    for (const [packetId, startTime] of this.processingTimers) {
      if (nowMs - startTime >= threshold) {
        completed.push(packetId);
      }
    }
    return completed;
  }

  /** Remove a completed packet from active slots and promote from queue */
  completePacket(packetId: string, nowMs: number): void {
    this.activeSlots.delete(packetId);
    this.processingTimers.delete(packetId);
    this._completedInWindow++;

    // Promote from wait queue if possible
    this.promoteFromQueue(nowMs);
  }

  /** Promote queued packets into active slots */
  private promoteFromQueue(nowMs: number): void {
    while (this.waitQueue.length > 0 && this.canAccept()) {
      const next = this.waitQueue.shift()!;
      this.startProcessing(next.id, nowMs);
      if (this.isMemoryExhausted) {
        this.crash(nowMs);
        break; // Stop promoting if we just crashed
      }
    }
  }

  /**
   * Check for timed-out packets in the queue.
   * Returns IDs of packets that exceeded timeoutMs while queued.
   */
  getTimedOutPackets(nowMs: number, timeoutMs: number): string[] {
    const timedOut: string[] = [];
    const validQueue: { id: string; enqueuedAt: number }[] = [];
    
    for (const item of this.waitQueue) {
      if (nowMs - item.enqueuedAt >= timeoutMs) {
        timedOut.push(item.id);
        this._dropCount++; // Timeouts count as drops
      } else {
        validQueue.push(item);
      }
    }
    
    this.waitQueue = validQueue;
    return timedOut;
  }

  /** Remove a packet from the queue (e.g., if it timed out or was cancelled) */
  removeFromQueue(packetId: string): boolean {
    const idx = this.waitQueue.findIndex(p => p.id === packetId);
    if (idx >= 0) {
      this.waitQueue.splice(idx, 1);
      return true;
    }
    return false;
  }

  /** Force-remove a packet regardless of state (for reset/cleanup) */
  removePacket(packetId: string): void {
    this.activeSlots.delete(packetId);
    this.processingTimers.delete(packetId);
    this.removeFromQueue(packetId);
  }

  // ─── Metrics ─────────────────────────────────────────────────

  /** Update throughput calculation window */
  tickMetrics(nowMs: number): void {
    const elapsed = nowMs - this._windowStartMs;
    if (elapsed >= 1000) {
      this._throughputPerSec = (this._completedInWindow / elapsed) * 1000;
      this._completedInWindow = 0;
      this._windowStartMs = nowMs;
    }
  }

  getMetrics(): NodeMetrics {
    const effectiveMax = this.capacity.maxConcurrent;
    return {
      activeCount:        this.activeSlots.size,
      queueLength:        this.waitQueue.length,
      cpuUtilization:     effectiveMax > 0 ? this.activeSlots.size / effectiveMax : 0,
      memoryUtilization:  this.capacity.memoryMB > 0
        ? (this.activeSlots.size * this.capacity.memoryPerRequestMB) / this.capacity.memoryMB
        : 0,
      dropCount:          this._dropCount,
      throughputPerSec:   this._throughputPerSec,
      isCrashed:          this.isCrashed,
    };
  }

  // ─── Lifecycle ───────────────────────────────────────────────

  reset(): void {
    this.activeSlots.clear();
    this.waitQueue.length = 0;
    this.processingTimers.clear();
    this._dropCount = 0;
    this._completedInWindow = 0;
    this._windowStartMs = performance.now();
    this._throughputPerSec = 0;
  }

  /** Returns all packet IDs currently managed by this node (active + queued) */
  getAllPacketIds(): string[] {
    return [...this.activeSlots, ...this.waitQueue.map(p => p.id)];
  }
}
