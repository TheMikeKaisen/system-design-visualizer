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

export async function exportCanvasToPng(
  canvasContainerRef: React.RefObject<HTMLDivElement | null>,
  pixiApp: import("pixi.js").Application | null,
  options: ExportOptions
): Promise<void> {
  const container = canvasContainerRef.current;
  if (!container) throw new Error("Canvas container ref not attached");

  // Capture Pixi WebGL frame as a raster image
  let pixiDataUrl: string | null = null;
  if (pixiApp) {
    try {
      // Extract the current Pixi frame
      pixiApp.renderer.render(pixiApp.stage);
      const pixiCanvas = pixiApp.renderer.extract.canvas(pixiApp.stage);
      pixiDataUrl = (pixiCanvas as HTMLCanvasElement).toDataURL("image/png");
    } catch {
      // If extract fails (some mobile browsers), continue without Pixi layer
      console.warn("[export] Pixi frame extraction failed — exporting DOM only");
    }
  }

  // Rasterize the React Flow DOM using html-to-image (supports modern CSS like oklch/lab)
  const { toCanvas } = await import("html-to-image");
  const canvas = await toCanvas(container, {
    backgroundColor: options.background === "transparent" ? undefined : options.background,
    pixelRatio:      options.scale,
    filter:          (node: HTMLElement) => {
      // Return true to include, false to exclude
      // Skip the Pixi canvas (we'll composite it manually)
      if (node.tagName === "CANVAS" && node.classList?.contains("pixi-canvas")) return false;
      // Skip HUD elements if includeHud is false
      if (!options.includeHud && node.id === "simulation-hud") return false;
      return true;
    },
  });

  // Composite Pixi layer on top if we captured it
  if (pixiDataUrl) {
    const ctx = canvas.getContext("2d")!;
    await new Promise<void>((resolve) => {
      const img    = new Image();
      img.onload   = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
      img.onerror  = () => resolve(); // Fail gracefully
      img.src      = pixiDataUrl!;
    });
  }

  // Trigger download
  const link      = document.createElement("a");
  link.download   = `diagram-export-${Date.now()}.png`;
  link.href       = canvas.toDataURL("image/png");
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
