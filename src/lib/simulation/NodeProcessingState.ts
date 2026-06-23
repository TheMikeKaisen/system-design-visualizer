import type { NodeCapacity, NodeMetrics } from "@/types";

// ─────────────────────────────────────────────
// NodeProcessingState
// Manages per-node queue, active processing slots,
// and completion timing for realistic server simulation.
// ─────────────────────────────────────────────

export class NodeProcessingState {
  readonly nodeId: string;
  capacity: NodeCapacity;

  /** Map<packetId, slotsUsed: number> */
  private activeSlots = new Map<string, { slotsUsed: number }>();
  private currentActiveSlots = 0;
  
  /** FIFO queue of { id, enqueuedAtMs } waiting to be processed */
  private waitQueue: { id: string; enqueuedAt: number }[] = [];
  private currentQueueCount = 0;

  /** Map<packetId, { startTime: number, timeNeeded: number }> */
  private processingTimers = new Map<string, { startTime: number; timeNeeded: number }>();
  
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
    const currentMemory = this.currentActiveSlots * this.capacity.memoryPerRequestMB;
    return currentMemory > this.capacity.memoryMB;
  }

  // ─── Admission ───────────────────────────────────────────────

  /** Can this node accept a new request into an active processing slot? */
  canAccept(): boolean {
    if (this.isCrashed) return false;
    // Only constrain by maxConcurrent. Memory exhaustion will cause a crash instead.
    return this.currentActiveSlots < this.capacity.maxConcurrent;
  }

  /** Can this node queue a new request? */
  canQueue(): boolean {
    return this.currentQueueCount < this.capacity.queueLimit;
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
      this._dropCount += 1;
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
      this.currentQueueCount += 1;
      return "queued";
    }
    this._dropCount += 1;
    return "dropped";
  }
  
  /** Crash the node, dropping all active and queued packets */
  private crash(nowMs: number): void {
    this.isCrashed = true;
    this.crashRecoveryTimeMs = nowMs + 10000; // 10 seconds downtime
    
    // Increment drop count for everything we are about to destroy
    let droppedInCrash = 0;
    for (const slotData of this.activeSlots.values()) {
      droppedInCrash += 1;
    }
    this._dropCount += droppedInCrash + this.currentQueueCount;
    
    this.activeSlots.clear();
    this.currentActiveSlots = 0;
    this.waitQueue.length = 0;
    this.currentQueueCount = 0;
    this.processingTimers.clear();
  }

  // ─── Processing ──────────────────────────────────────────────

  private startProcessing(packetId: string, nowMs: number): void {
    const slotsUsed = 1;
    
    this.activeSlots.set(packetId, { slotsUsed });
    this.currentActiveSlots += slotsUsed;
    
    const passesNeeded = 1;
    const timeNeeded = passesNeeded * this.effectiveProcessingTimeMs;
    
    this.processingTimers.set(packetId, { startTime: nowMs, timeNeeded });
  }

  /**
   * Returns IDs of packets that have finished processing.
   * Does NOT remove them — caller must call `completePacket()`.
   */
  getCompletedPackets(nowMs: number): string[] {
    const completed: string[] = [];

    for (const [packetId, { startTime, timeNeeded }] of this.processingTimers) {
      if (nowMs - startTime >= timeNeeded) {
        completed.push(packetId);
      }
    }
    return completed;
  }

  /** Remove a completed packet from active slots and promote from queue */
  completePacket(packetId: string, nowMs: number): void {
    const slotData = this.activeSlots.get(packetId);
    if (slotData) {
      this.currentActiveSlots -= slotData.slotsUsed;
      this._completedInWindow += 1;
    }
    
    this.activeSlots.delete(packetId);
    this.processingTimers.delete(packetId);

    // Promote from wait queue if possible
    this.promoteFromQueue(nowMs);
  }

  /** Promote queued packets into active slots */
  private promoteFromQueue(nowMs: number): void {
    while (this.waitQueue.length > 0 && this.canAccept()) {
      const next = this.waitQueue.shift()!;
      this.currentQueueCount -= 1;
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
        this._dropCount += 1; // Timeouts count as drops
        this.currentQueueCount -= 1;
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
      this.currentQueueCount -= 1;
      this.waitQueue.splice(idx, 1);
      return true;
    }
    return false;
  }

  /** Force-remove a packet regardless of state (for reset/cleanup) */
  removePacket(packetId: string): void {
    const slotData = this.activeSlots.get(packetId);
    if (slotData) {
      this.currentActiveSlots -= slotData.slotsUsed;
    }
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
    // To ensure UI accuracy, activeCount represents total requests processing.
    let activeTotal = 0;
    for (const slotData of this.activeSlots.values()) {
      activeTotal += 1;
    }

    return {
      activeCount:        activeTotal,
      queueLength:        this.currentQueueCount,
      cpuUtilization:     effectiveMax > 0 ? this.currentActiveSlots / effectiveMax : 0,
      memoryUtilization:  this.capacity.memoryMB > 0
        ? (this.currentActiveSlots * this.capacity.memoryPerRequestMB) / this.capacity.memoryMB
        : 0,
      dropCount:          this._dropCount,
      throughputPerSec:   this._throughputPerSec,
      isCrashed:          this.isCrashed,
    };
  }

  // ─── Lifecycle ───────────────────────────────────────────────

  reset(): void {
    this.activeSlots.clear();
    this.currentActiveSlots = 0;
    this.waitQueue.length = 0;
    this.currentQueueCount = 0;
    this.processingTimers.clear();
    this._dropCount = 0;
    this._completedInWindow = 0;
    this._windowStartMs = performance.now();
    this._throughputPerSec = 0;
  }

  /** Returns all packet IDs currently managed by this node (active + queued) */
  getAllPacketIds(): string[] {
    return [...Array.from(this.activeSlots.keys()), ...this.waitQueue.map(p => p.id)];
  }
}
