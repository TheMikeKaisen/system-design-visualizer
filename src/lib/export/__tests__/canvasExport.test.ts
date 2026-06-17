import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyShareLink } from "../canvasExport";

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  vi.stubGlobal("navigator", {
    clipboard: { writeText: writeTextMock },
  });
  vi.stubGlobal("window", {
    location: { origin: "https://sysvis.app" },
  });
  writeTextMock.mockClear();
});

describe("copyShareLink", () => {
  it("writes the correct URL to clipboard", async () => {
    await copyShareLink("diag-abc123");
    expect(writeTextMock).toHaveBeenCalledWith(
      "https://sysvis.app/canvas/diag-abc123"
    );
  });

  it("returns true on success", async () => {
    const result = await copyShareLink("diag-1");
    expect(result).toBe(true);
  });

  it("returns true even when clipboard throws (fallback)", async () => {
    writeTextMock.mockRejectedValue(new Error("Clipboard denied"));
    // Fallback uses execCommand — just verify it returns true
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue({
        value: "", select: vi.fn(),
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      execCommand: vi.fn().mockReturnValue(true),
    });
    const result = await copyShareLink("diag-1");
    expect(result).toBe(true);
  });
});
