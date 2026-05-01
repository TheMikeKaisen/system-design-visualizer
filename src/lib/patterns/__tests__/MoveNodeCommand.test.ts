import { describe, it, expect, vi, beforeEach } from "vitest";
import { MoveNodeCommand } from "../commands/MoveNodeCommand";
import { useCanvasStore } from "@/lib/store/useCanvasStore";

vi.mock("@/lib/store/useCanvasStore", () => ({
  useCanvasStore: { getState: vi.fn() },
}));

const mockSetPosition = vi.fn();
beforeEach(() => {
  vi.mocked(useCanvasStore.getState).mockReturnValue({
    setNodePosition: mockSetPosition,
  } as any);
  mockSetPosition.mockClear();
});

describe("MoveNodeCommand", () => {
  const from = { x: 100, y: 200 };
  const to   = { x: 400, y: 500 };

  it("execute moves to `to` position", () => {
    new MoveNodeCommand("svc-1", "Auth", from, to).execute();
    expect(mockSetPosition).toHaveBeenCalledWith("svc-1", 400, 500);
  });

  it("undo moves back to `from` position", () => {
    new MoveNodeCommand("svc-1", "Auth", from, to).undo();
    expect(mockSetPosition).toHaveBeenCalledWith("svc-1", 100, 200);
  });

  it("serialize round-trip preserves all fields", () => {
    const cmd = new MoveNodeCommand("svc-1", "Auth", from, to);
    const s = cmd.serialize();
    expect(s.type).toBe("MoveNode");
    expect(s.payload.nodeId).toBe("svc-1");
    expect(s.payload.fromX).toBe(100);
    expect(s.payload.toY).toBe(500);
  });

  it("getDescription mentions the node label", () => {
    expect(new MoveNodeCommand("x", "Auth Service", from, to).getDescription())
      .toContain("Auth Service");
  });
});