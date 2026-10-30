import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InteractiveExplanationBar } from "../InteractiveExplanationBar";

describe("InteractiveExplanationBar Tokenization & Highlight Boundaries", () => {
  it("does not match acronyms like ACK inside words like Packet or acknowledge", () => {
    const { container } = render(
      <InteractiveExplanationBar
        safeIndex={0}
        totalSteps={3}
        title="Testing Word Boundaries"
        badge="Test Badge"
        explanation="The Packet arrived safely. We acknowledge receipt. The server sent an ACK to finalize."
        customTermPatterns={["ACK"]}
        customGlossary={{
          ACK: {
            term: "ACK",
            category: "TCP Control",
            title: "TCP ACK Flag",
            explanation: "Acknowledgment flag confirming receipt of bytes.",
          },
        }}
      />
    );

    // Only the standalone "ACK" should become an interactive button
    const buttons = screen.getAllByRole("button");
    // Filter only buttons that are term highlights (aria-haspopup="dialog")
    const termButtons = buttons.filter((b) =>
      b.getAttribute("aria-label")?.includes("Inspect definition")
    );

    expect(termButtons).toHaveLength(1);
    expect(termButtons[0].textContent).toBe("ACK");

    // "Packet" and "acknowledge" must remain intact as plain text without being broken up
    expect(container.textContent).toContain("The Packet arrived safely. We acknowledge receipt. The server sent an ACK to finalize.");
    expect(screen.queryByText(/^P$/)).toBeNull();
    expect(screen.queryByText(/^et$/)).toBeNull();
  });

  it("does not hijack notes titled 'Packet Structure' with 'ACK' definition", () => {
    render(
      <InteractiveExplanationBar
        safeIndex={0}
        totalSteps={3}
        title="Testing Note Matching"
        badge="Test Badge"
        explanation="Inspecting the Packet Structure on the wire."
        detailedNotes={[
          {
            title: "Packet Structure",
            body: "Detailed explanation of headers and payload framing.",
          },
        ]}
        customTermPatterns={["ACK", "Packet Structure"]}
        customGlossary={{
          ACK: {
            term: "ACK",
            category: "TCP Control",
            title: "TCP ACK Flag",
            explanation: "Acknowledgment flag confirming receipt of bytes.",
          },
        }}
      />
    );

    // Both inline term and concept chip for "Packet Structure" should exist
    const chips = screen.getAllByRole("button", { name: /Packet Structure/i });
    expect(chips.length).toBeGreaterThanOrEqual(1);

    // Click the concept chip to open the dialogue
    fireEvent.click(chips[0]);

    // Dialogue must NOT show "TCP ACK Flag" or "TCP Control", it must show "Packet Structure"
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.textContent).toContain("Packet Structure");
    expect(dialog.textContent).toContain("Detailed explanation of headers and payload framing.");
    expect(dialog.textContent).not.toContain("TCP ACK Flag");
    expect(dialog.textContent).not.toContain("TCP Control");
  });

  it("does not associate term 'Packet' with 'ACK' glossary definition in fallback matching", () => {
    render(
      <InteractiveExplanationBar
        safeIndex={0}
        totalSteps={3}
        title="Testing Term Boundaries"
        badge="Test Badge"
        explanation="The Packet arrived safely."
        customTermPatterns={["ACK", "Packet"]}
        customGlossary={{
          ACK: {
            term: "ACK",
            category: "TCP Control",
            title: "TCP ACK Flag",
            explanation: "Acknowledgment flag confirming receipt of bytes.",
          },
        }}
      />
    );

    // "Packet" has no glossary definition, so it must NOT match "ACK" via fallback substring
    const packetButtons = screen.queryAllByRole("button", { name: /Inspect definition for Packet/i });
    expect(packetButtons).toHaveLength(0);
    // Should render as plain text or non-button span
    expect(screen.getByText("Packet")).toBeDefined();
  });

  it("auto-dismisses concept popover when safeIndex changes (Rule #7.4)", () => {
    const { rerender } = render(
      <InteractiveExplanationBar
        safeIndex={0}
        totalSteps={3}
        title="Step 1"
        badge="Step 1"
        explanation="Testing ACK definition popup."
        customTermPatterns={["ACK"]}
        customGlossary={{
          ACK: {
            term: "ACK",
            category: "TCP Control",
            title: "TCP ACK Flag",
            explanation: "Acknowledgment flag confirming receipt of bytes.",
          },
        }}
      />
    );

    const ackBtn = screen.getByRole("button", { name: /Inspect definition for ACK/i });
    fireEvent.click(ackBtn);

    // Popover dialogue is visible
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/ACK \(Acknowledgment Flag\)|TCP ACK Flag/i)).toBeDefined();

    // Advance step: safeIndex becomes 1
    rerender(
      <InteractiveExplanationBar
        safeIndex={1}
        totalSteps={3}
        title="Step 2"
        badge="Step 2"
        explanation="Next step explanation."
        customTermPatterns={["ACK"]}
        customGlossary={{
          ACK: {
            term: "ACK",
            category: "TCP Control",
            title: "TCP ACK Flag",
            explanation: "Acknowledgment flag confirming receipt of bytes.",
          },
        }}
      />
    );

    // Popover dialogue must be auto-dismissed on step navigation
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
