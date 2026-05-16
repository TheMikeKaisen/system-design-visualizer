import type { SerializedDiagram } from "@/types";
import { diagramToJSON, jsonToDiagram, type DeserializeResult } from "./diagramSerializer";

// ─────────────────────────────────────────────
// Export — triggers a browser download
// ─────────────────────────────────────────────

export function exportDiagramToFile(diagram: SerializedDiagram): void {
  const json = diagramToJSON(diagram);
  const blob = new Blob([json], { type: "application/json" });
  const url  = URL.createObjectURL(blob);

  // Sanitize filename: remove unsafe characters
  const safeName = diagram.meta.name
    .replace(/[^a-z0-9\s-_]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "diagram";

  const a = document.createElement("a");
  a.href     = url;
  a.download = `${safeName}.sysvis.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// Import — opens a file picker, reads and validates
// ─────────────────────────────────────────────

export function importDiagramFromFile(): Promise<DeserializeResult> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type   = "file";
    input.accept = ".json,.sysvis.json";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ ok: false, error: "No file selected." });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(jsonToDiagram(text));
      };
      reader.onerror = () => {
        resolve({ ok: false, error: "Failed to read file." });
      };
      reader.readAsText(file);
    };

    // Handle cancel — resolve after a short delay if no change fired
    input.oncancel = () => resolve({ ok: false, error: "Cancelled." });
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
