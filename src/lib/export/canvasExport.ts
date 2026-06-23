import type { ExportOptions } from "@/types";

/**
 * Exports the canvas to PNG using html2canvas.
 *
 * ARCHITECTURE NOTE:
 * html2canvas rasterizes DOM elements. It cannot capture WebGL (the Pixi canvas).
 * We handle this in two steps:
 * 1. Temporarily make the Pixi canvas visible to html2canvas by converting
 *    its WebGL frame to a data URL (Pixi supports this natively).
 * 2. Draw the React Flow SVG over the Pixi raster.
 *
 * For production-quality exports, the better approach is to use
 * the React Flow `toBlob` utility + Pixi's `app.renderer.extract.canvas()`.
 * This implementation uses the simpler approach that works in all browsers.
 */

import { getNodesBounds } from "@xyflow/react";
import type { SystemNode } from "@/types";

export async function exportCanvasToPng(
  nodes: SystemNode[],
  theme: string | undefined,
  options: ExportOptions
): Promise<void> {
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
  if (!viewportEl) throw new Error("React Flow viewport not found");

  // Determine export dimensions and transform
  // Calculate bounds exactly covering all nodes
  const bounds = getNodesBounds(nodes);
  
  // Add padding around the nodes (similar to Excalidraw)
  const PADDING = 50;
  
  const imageWidth = bounds.width + PADDING * 2;
  const imageHeight = bounds.height + PADDING * 2;
  
  // Center the diagram in the export viewport at scale 1
  const transform = `translate(${-bounds.x + PADDING}px, ${-bounds.y + PADDING}px) scale(1)`;

  const bgColor = options.background === "transparent" 
    ? undefined 
    : theme === "dark" ? "#1a1a1a" : "#ffffff";

  const { toPng } = await import("html-to-image");
  
  const dataUrl = await toPng(viewportEl, {
    backgroundColor: bgColor,
    width: imageWidth,
    height: imageHeight,
    pixelRatio: options.scale,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform,
    },
    filter: (node: HTMLElement) => {
      // Exclude minimap or any controls if they happen to sneak in, though they shouldn't in the viewport
      if (node.classList?.contains("react-flow__minimap")) return false;
      if (node.classList?.contains("react-flow__controls")) return false;
      return true;
    },
  });

  // Trigger download
  const link      = document.createElement("a");
  link.download   = `diagram-export-${Date.now()}.png`;
  link.href       = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports the diagram data as a JSON file.
 * Reuses the existing serializer from Phase 4.
 */
export { exportDiagramToFile as exportDiagramJson } from "@/lib/persistence/fileIO";

/**
 * Copies a shareable URL to the clipboard.
 * In Phase 9: generates a /share/[token] URL with the diagram ID embedded.
 */
export async function copyShareLink(diagramId: string): Promise<boolean> {
  const url = `${window.location.origin}/canvas/${diagramId}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for browsers without clipboard API
    const input    = document.createElement("input");
    input.value    = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return true;
  }
}
