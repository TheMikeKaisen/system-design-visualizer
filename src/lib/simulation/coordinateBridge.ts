/**
 * Pure math
 * Handles two concerns:
 *   1. Converting world ↔ screen coordinates (used by PixiBridge, Phase 1)
 *   2. Interpolating a progress value [0,1] along a multi-waypoint path
 */
import type { WorldPoint } from "@/types";

// PATH LENGTH UTILITIES
// To move a packet at a constant speed, 
// the engine needs to know exactly how long 
// each segment of a path is. 
// This function allows the computePathMetrics 
// function to determine the totalLength of a path, 
// which is then used to map a 0.0 to 1.0 progress value 
// to a specific (x, y) coordinate on the screen.
function segmentLength(a: WorldPoint, b: WorldPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}


export interface PathMetrics {
  waypoints: WorldPoint[];
  segmentLengths: number[];
  totalLength: number;
}

/**
 * Pre-computes cumulative distances for a path so that `interpolatePath`
 * can map a [0,1] progress value to a world-space position in O(n) rather
 * than recomputing lengths every tick.
 */
export function computePathMetrics(waypoints: WorldPoint[]): PathMetrics {
  if (waypoints.length < 2) {
    return { waypoints, segmentLengths: [], totalLength: 0 };
  }

  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const len = segmentLength(waypoints[i], waypoints[i + 1]);
    segmentLengths.push(len);
    totalLength += len;
  }

  return { waypoints, segmentLengths, totalLength };
}

/**
 * Maps a normalised progress value [0,1] to a world-space point
 * along the multi-segment path described by `metrics`.
 *
 * @param metrics  Pre-computed from `computePathMetrics`
 * @param progress 0 = start, 1 = end
 */
export function interpolatePath(
  metrics: PathMetrics,
  progress: number
): WorldPoint {
  const { waypoints, segmentLengths, totalLength } = metrics;

  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1 || totalLength === 0) return waypoints[0];

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDist = clampedProgress * totalLength;

  let accumulated = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const segProgress = segLen === 0 ? 0 : (targetDist - accumulated) / segLen;
      const a = waypoints[i];
      const b = waypoints[i + 1];
      return {
        x: a.x + (b.x - a.x) * segProgress,
        y: a.y + (b.y - a.y) * segProgress,
      };
    }
    accumulated += segLen;
  }

  return waypoints[waypoints.length - 1];
}

/**
 * Computes the normalised delta-progress for a packet to travel
 * `speedPxPerSecond` pixels in `deltaMs` milliseconds along a path
 * of `totalLength` world-space pixels.
 */
export function deltaProgress(
  deltaMs: number,
  speedPxPerSecond: number,
  totalLength: number
): number {
  if (totalLength === 0) return 1;
  // calculates how many actual pixels the packet should move based on time elapsed(deltaMs) and its speed
  const pixelsTravelled = (deltaMs / 1000) * speedPxPerSecond;
  // Normalization: divide total pixels travelled by total length (get a percentage)
  // ex: If the packet moved 5 pixels and the path is 100 pixels long, it returns 0.05.
  return pixelsTravelled / totalLength;
}