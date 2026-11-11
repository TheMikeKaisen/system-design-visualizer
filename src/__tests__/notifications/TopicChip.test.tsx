import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicChip, SubjectChannel } from "@/components/notifications/TopicChip";

describe("TopicChip Component", () => {
  it("TC-CHIP-01: renders discipline title and subtitle badge correctly", () => {
    const onToggle = vi.fn();
    render(
      <TopicChip
        subject={SubjectChannel.COMPUTER_NETWORKS}
        selected={false}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText("Computer Networks")).toBeInTheDocument();
    expect(screen.getByText("Protocols & Wire")).toBeInTheDocument();
  });

  it("TC-CHIP-02: enforces minimum >= 44px x 44px touch target on mobile with touch-manipulation", () => {
    const onToggle = vi.fn();
    render(
      <TopicChip
        subject={SubjectChannel.JAVASCRIPT}
        selected={false}
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("checkbox");
    expect(button.className).toContain("min-h-[44px]");
    expect(button.className).toContain("min-w-[44px]");
    expect(button.className).toContain("touch-manipulation");
  });

  it("TC-CHIP-03: emits accessible WAI-ARIA role='checkbox' and matches aria-checked={selected}", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TopicChip
        subject={SubjectChannel.OPERATING_SYSTEMS}
        selected={false}
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("checkbox");
    expect(button).toHaveAttribute("aria-checked", "false");

    rerender(
      <TopicChip
        subject={SubjectChannel.OPERATING_SYSTEMS}
        selected={true}
        onToggle={onToggle}
      />
    );

    expect(button).toHaveAttribute("aria-checked", "true");
  });

  it("TC-CHIP-04: supports keyboard navigation and toggles on click / Enter / Space", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <TopicChip
        subject={SubjectChannel.JAVA}
        selected={false}
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("checkbox");
    await user.click(button);
    expect(onToggle).toHaveBeenCalledWith(SubjectChannel.JAVA);

    // Native button responds to Space and Enter
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    // In React testing-library, clicking or keypress can trigger onClick
    await user.keyboard("{Enter}");
    expect(onToggle).toHaveBeenCalledTimes(2);

    await user.keyboard(" ");
    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it("TC-CHIP-05: applies tokenized subject accent classes matching discipline palettes", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TopicChip
        subject={SubjectChannel.BACKEND}
        selected={true}
        onToggle={onToggle}
      />
    );

    const button = screen.getByRole("checkbox");
    // BACKEND uses blue-500 palette
    expect(button.className).toContain("border-blue-500");

    rerender(
      <TopicChip
        subject={SubjectChannel.FRONTEND}
        selected={true}
        onToggle={onToggle}
      />
    );
    // FRONTEND uses violet-500 palette
    expect(button.className).toContain("border-violet-500");
  });

  it("TC-CHIP-06: handles 'ALL' channel with special master styling", () => {
    const onToggle = vi.fn();
    render(
      <TopicChip
        subject={SubjectChannel.ALL}
        selected={true}
        onToggle={onToggle}
        isFullWidth
      />
    );

    const button = screen.getByRole("checkbox");
    expect(screen.getByText("All Disciplines")).toBeInTheDocument();
    expect(screen.getByText("Complete Curriculum")).toBeInTheDocument();
    expect(button.className).toContain("border-indigo-500");
  });

  it("TC-CHIP-07: disabled state disables button, prevents toggling, and reflects aria-disabled='true'", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <TopicChip
        subject={SubjectChannel.JAVASCRIPT}
        selected={false}
        onToggle={onToggle}
        disabled={true}
      />
    );

    const button = screen.getByRole("checkbox");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("TC-CHIP-08: renders checkmark icon when selected, hides when unselected", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TopicChip
        subject={SubjectChannel.JAVA}
        selected={false}
        onToggle={onToggle}
      />
    );

    expect(screen.queryByTestId("chip-check-icon")).not.toBeInTheDocument();

    rerender(
      <TopicChip
        subject={SubjectChannel.JAVA}
        selected={true}
        onToggle={onToggle}
      />
    );

    expect(screen.getByTestId("chip-check-icon")).toBeInTheDocument();
  });
});
