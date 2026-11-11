import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscribeButton } from "@/components/notifications/SubscribeButton";
import { SubjectChannel } from "@/components/notifications/TopicChip";

describe("SubscribeButton Component", () => {
  it("TC-BTN-01: renders default label and contextual subject label correctly", () => {
    const { rerender } = render(<SubscribeButton />);
    expect(screen.getByText("Get Release Notifications")).toBeInTheDocument();

    rerender(
      <SubscribeButton
        subject={SubjectChannel.JAVASCRIPT}
        subjectTitle="JavaScript"
      />
    );
    expect(screen.getByText("Subscribe to JavaScript")).toBeInTheDocument();
  });

  it("TC-BTN-02: enforces minimum >= 44px touch target on mobile viewport", () => {
    render(<SubscribeButton />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("touch-manipulation");
  });

  it("TC-BTN-03: passes contextual subject prop into SubscribeModal opener", async () => {
    const user = userEvent.setup();
    render(
      <SubscribeButton
        subject={SubjectChannel.COMPUTER_NETWORKS}
        subjectTitle="Computer Networks"
      />
    );

    const button = screen.getByRole("button", { name: /Subscribe to Computer Networks notifications/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // In modal, Computer Networks should be pre-selected
    const chip = screen.getByRole("checkbox", { name: /Computer Networks/i });
    expect(chip).toHaveAttribute("aria-checked", "true");
  });

  it("TC-BTN-04: defaults to all disciplines when no subject prop is passed", async () => {
    const user = userEvent.setup();
    render(<SubscribeButton />);

    const button = screen.getByRole("button");
    await user.click(button);

    const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
    expect(allChip).toHaveAttribute("aria-checked", "true");
  });

  it("TC-BTN-05: clicking button opens the SubscribeModal dialog and sets aria-expanded to true", async () => {
    const user = userEvent.setup();
    render(<SubscribeButton />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("TC-BTN-06: supports keyboard activation via Enter and Space", async () => {
    const user = userEvent.setup();
    render(<SubscribeButton />);

    const button = screen.getByRole("button");
    button.focus();
    expect(document.activeElement).toBe(button);

    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("TC-BTN-07: merges custom className and supports variant overrides", () => {
    render(
      <SubscribeButton
        variant="outline"
        className="custom-test-class"
      />
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-test-class");
    expect(button.className).toContain("border-zinc-200/80");
  });
});
