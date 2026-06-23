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
  /** FIFO queue of packet IDs waiting to be processed */
  private waitQueue: string[] = [];
  /** Map<packetId, processingStartTimeMs> — tracks when each packet started processing */
  private processingTimers = new Map<string, number>();
  /** Total packets dropped (queue overflow / timeout) since last reset */
  private _dropCount = 0;
  /** Rolling throughput tracker */
  private _completedInWindow = 0;
  private _windowStartMs = 0;
  private _throughputPerSec = 0;

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

  /** Effective processing time, scaled by CPU cores */
  get effectiveProcessingTimeMs(): number {
    return this.capacity.processingTimeMs / this.capacity.cpuCores;
  }

  // ─── Admission ───────────────────────────────────────────────

  /** Can this node accept a new request into an active processing slot? */
  canAccept(): boolean {
    return this.activeSlots.size < this.effectiveMaxConcurrent;
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
    if (this.canAccept()) {
      this.startProcessing(packetId, nowMs);
      return "processing";
    }
    if (this.canQueue()) {
      this.waitQueue.push(packetId);
      return "queued";
    }
    this._dropCount++;
    return "dropped";
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
      const nextId = this.waitQueue.shift()!;
      this.startProcessing(nextId, nowMs);
    }
  }

  /**
   * Check for timed-out packets in the queue.
   * Returns IDs of packets that exceeded timeoutMs while queued.
   */
  getTimedOutPackets(nowMs: number, timeoutMs: number): string[] {
    // For queued packets we don't have individual enqueue times tracked yet.
    // We'll add that if needed. For now, timeout applies to processing only.
    return [];
  }

  /** Remove a packet from the queue (e.g., if it timed out or was cancelled) */
  removeFromQueue(packetId: string): boolean {
    const idx = this.waitQueue.indexOf(packetId);
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
    const effectiveMax = this.effectiveMaxConcurrent;
    return {
      activeCount:        this.activeSlots.size,
      queueLength:        this.waitQueue.length,
      cpuUtilization:     effectiveMax > 0 ? this.activeSlots.size / effectiveMax : 0,
      memoryUtilization:  this.capacity.memoryMB > 0
        ? (this.activeSlots.size * this.capacity.memoryPerRequestMB) / this.capacity.memoryMB
        : 0,
      dropCount:          this._dropCount,
      throughputPerSec:   this._throughputPerSec,
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
    return [...this.activeSlots, ...this.waitQueue];
  }
}
