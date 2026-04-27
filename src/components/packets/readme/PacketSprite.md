# PacketSprite Overview

Let's break down `PacketSprite.ts`. This file is the pure visual layer for a single packet traveling through your system design graph. 

---

## Why does PacketSprite exist?

In software architecture, you want to separate *state* from *presentation*. 
- The **Zustand store** knows a packet exists and what its progress is.
- The **SimulationEngine** calculates how fast it moves.
- The **PacketManager** orchestrates the loop.
- **PacketSprite** is the only thing that actually knows how to draw pixels on the screen.

By isolating this into a class, `PacketManager` can just say `sprite.update(x, y)` without needing to know if the packet is drawn as a circle, a square, an image, or whether it has a motion trail. This makes it incredibly easy to change the visual design of packets later without touching the complex simulation logic.

---

## The Core PixiJS Concepts

If you are new to PixiJS, there are a few important concepts used in this file:

```typescript
import { Container, Graphics, Text, TextStyle } from "pixi.js";
```

1. **`Container`**: Think of this like a `<div style="position: absolute">`. It's an invisible box that groups other visual elements together. When you move the Container (`x` and `y`), scale it, or fade it (`alpha`), all its children move, scale, and fade together.
2. **`Graphics`**: This is Pixi's API for drawing primitive vector shapes (circles, rectangles, lines) very fast using WebGL. 
3. **`Text`**: Renders actual font text to the WebGL canvas.

---

## The Hierarchy (Z-Index)

Inside the `constructor`, we build the visual structure. The order in which you call `this.container.addChild()` dictates the z-index (draw order).

1. `this.container.addChild(this.trail)` goes first, so it's drawn at the bottom (behind the circle).
2. `this.container.addChild(this.circle)` goes second, drawn on top of the trail.
3. `this.container.addChild(this.label)` goes last, drawn on the very top.

The circle's color is derived directly from the packet's protocol (`packet.color`), providing an immediate visual cue (e.g., blue for HTTP, orange for UDP).

---

## The Functions

### `update(worldX, worldY, prevX, prevY, alpha)`
This is called 60 times a second by the `PacketManager`.
It does two simple things:
1. Moves the entire container to the new `worldX, worldY` coordinates. (Note: These are absolute world coordinates. PixiBridge handles translating these to screen coordinates based on your zoom/pan level automatically).
2. Calls `drawTrail` passing the difference between the current position and the position from a fraction of a second ago (`prevX`, `prevY`).

### `drawTrail(dx, dy)`
This is where the magic of the motion trail happens.
A motion trail needs to point *away* from the direction of travel. 

1. `this.trail.clear()`: Wipes out the line drawn in the previous frame.
2. `const len = Math.sqrt(...)`: Calculates the total distance traveled since the "previous" frame using the Pythagorean theorem.
3. `const nx = (-dx / len) * TRAIL_LENGTH`: This is vector normalization. It figures out the exact angle the packet is moving, reverses it (the minus sign), and multiplies it by `TRAIL_LENGTH` so the trail is always exactly 6 pixels long, regardless of how fast the packet is moving.
4. `this.trail.moveTo(0, 0).lineTo(nx, ny).stroke(...)`: Draws a rounded, slightly transparent white line extending backward from the center of the packet.

### `playArrivalPop()`
When a packet hits 100% progress, it can play a little animation. PixiJS doesn't have a built-in animation library (like CSS transitions), so animations require manual scale adjustments frame-by-frame. Right now, this just instantly snaps the scale to 1.8.

### `destroy()`
Crucial for memory management. When a packet arrives, `PacketManager` deletes it. If we didn't call `this.container.destroy({ children: true })`, the WebGL textures and objects would stay in your GPU memory forever, eventually crashing the browser. This safely deletes the container, the graphics, and the text.
