/**
 * A single packet's Pixi.js visual representation.
 * Uses Pixi v8 Graphics API.
 * Stored in world-space coordinates — the parent Container's transform
 * (synced by PixiBridge) handles the viewport conversion automatically.
 */
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Packet } from "@/types";

const RADIUS = 5;
const TRAIL_LENGTH = 6;
const TRAIL_ALPHA_START = 0.15;

export class PacketSprite {
  readonly container: Container;
  private readonly circle: Graphics;
  private readonly trail: Graphics;
  private readonly label: Text;

  constructor(packet: Packet) {
    this.container = new Container();

    // Trail (drawn BEHIND the main circle)
    this.trail = new Graphics();
    this.container.addChild(this.trail);

    // Main packet circle
    this.circle = new Graphics();
    this.circle.circle(0, 0, RADIUS).fill({ color: packet.color, alpha: 0.92 });
    this.container.addChild(this.circle);

    // Protocol label (very small, above the circle)
    const style = new TextStyle({
      fontSize: 8,
      fill: 0xffffff,
      fontFamily: "monospace",
    });
    this.label = new Text({ text: packet.protocol.slice(0, 4), style });
    this.label.anchor.set(0.5, 1.5);
    this.label.visible = false; // Show only on hover in the future
    this.container.addChild(this.label);
  }

  /**
   * Called every tick by PacketManager.
   * @param worldX   World-space X (PixiBridge transforms to screen)
   * @param worldY   World-space Y
   * @param prevX    Previous world X (for trail direction)
   * @param prevY    Previous world Y
   * @param alpha    0–1 fade (for arrival/drop animation)
   */
  update(
    worldX: number,
    worldY: number,
    prevX: number,
    prevY: number,
    alpha = 1
  ): void {
    this.container.x = worldX;
    this.container.y = worldY;
    this.container.alpha = alpha;

    this.drawTrail(worldX - prevX, worldY - prevY);
  }

  private drawTrail(dx: number, dy: number): void {
    this.trail.clear();
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) return;

    // Draw a faded line in the direction of travel
    const nx = (-dx / len) * TRAIL_LENGTH;
    const ny = (-dy / len) * TRAIL_LENGTH;

    this.trail
      .moveTo(0, 0)
      .lineTo(nx, ny)
      .stroke({
        color: 0xffffff,
        alpha: TRAIL_ALPHA_START,
        width: RADIUS * 1.2,
        cap: "round",
      });
  }

  /**
   * Play a brief scale-up pop when the packet arrives at its destination.
   * Pixi v8 doesn't ship with a tween lib, so we do it in the ticker caller.
   */
  playArrivalPop(): void {
    this.container.scale.set(1.8);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}