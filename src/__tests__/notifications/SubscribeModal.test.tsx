import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscribeModal } from "@/components/notifications/SubscribeModal";
import { SubjectChannel } from "@/components/notifications/TopicChip";

describe("SubscribeModal Component", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("TC-MOD-01: emits WAI-ARIA dialog attributes: role='dialog', aria-modal='true', aria-labelledby", () => {
    render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "subscribe-modal-title");
    expect(dialog).toHaveAttribute("aria-describedby", "subscribe-modal-description");
    expect(screen.getByText("Subscribe to Episode Releases")).toBeInTheDocument();
  });

  it("TC-MOD-02: traps keyboard focus inside dialog when open", async () => {
    render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusables.length).toBeGreaterThan(0);

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    // Simulate Tab on last element -> wraps to first
    lastElement.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(firstElement);

    // Simulate Shift+Tab on first element -> wraps to last
    firstElement.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastElement);
  });

  it("TC-MOD-03: dismisses modal when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<SubscribeModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("TC-MOD-04: dismisses modal when clicking backdrop overlay", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SubscribeModal isOpen={true} onClose={onClose} />);

    const backdrop = screen.getByTestId("modal-backdrop");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("TC-MOD-05: pre-selects contextual subject passed via initialSubject", () => {
    render(
      <SubscribeModal
        isOpen={true}
        onClose={vi.fn()}
        initialSubject={SubjectChannel.COMPUTER_NETWORKS}
      />
    );

    // Contextual subject should be checked
    const netChip = screen.getByRole("checkbox", { name: /Computer Networks/i });
    expect(netChip).toHaveAttribute("aria-checked", "true");

    // Master ALL chip should be unchecked
    const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
    expect(allChip).toHaveAttribute("aria-checked", "false");
  });

  it("TC-MOD-06: selecting ALL chip selects all topics, deselecting individual topic toggles off ALL", async () => {
    const user = userEvent.setup();
    render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

    const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
    const jsChip = screen.getByRole("checkbox", { name: /JavaScript/i });
    const osChip = screen.getByRole("checkbox", { name: /Operating Systems/i });

    // Initially ALL is checked
    expect(allChip).toHaveAttribute("aria-checked", "true");
    expect(jsChip).toHaveAttribute("aria-checked", "true");

    // Click JS chip -> unselects JS, expands ALL to remaining 5
    await user.click(jsChip);
    expect(allChip).toHaveAttribute("aria-checked", "false");
    expect(jsChip).toHaveAttribute("aria-checked", "false");
    expect(osChip).toHaveAttribute("aria-checked", "true");

    // Click ALL chip -> turns all back on
    await user.click(allChip);
    expect(allChip).toHaveAttribute("aria-checked", "true");
    expect(jsChip).toHaveAttribute("aria-checked", "true");
  });

  it("TC-MOD-07: clicking ALL chip when already selected deselects all topics", async () => {
    const user = userEvent.setup();
    render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

    const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
    expect(allChip).toHaveAttribute("aria-checked", "true");

    await user.click(allChip);
    expect(allChip).toHaveAttribute("aria-checked", "false");

    const submitBtn = screen.getByRole("button", { name: "Subscribe" });
    expect(submitBtn).toBeDisabled();
  });

  it("TC-MOD-08: validates email input format and shows inline error", async () => {
    const user = userEvent.setup();
    render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByLabelText(/Email address/i);
    await user.type(input, "not-an-email");
    fireEvent.blur(input);

    expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
  });

  it("TC-MOD-09: shows animated loading spinner and disables submit button during request", async () => {
    const user = userEvent.setup();
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="test@domain.com" />);

    const submitBtn = screen.getByRole("button", { name: "Subscribe" });
    await user.click(submitBtn);

    expect(screen.getByText("Subscribing...")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("TC-MOD-10: displays success state with verification message when requiresVerification is true", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Please check your inbox to verify your subscription.",
        requiresVerification: true,
      }),
    });

    render(
      <SubscribeModal
        isOpen={true}
        onClose={vi.fn()}
        defaultEmail="guest@domain.com"
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole("button", { name: "Subscribe" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("subscribe-success")).toBeInTheDocument();
    });
    expect(screen.getByText("Check your inbox to verify")).toBeInTheDocument();
    expect(screen.getByText(/within 24 hours/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith({
      requiresVerification: true,
      email: "guest@domain.com",
    });
  });

  it("TC-MOD-11: displays rate limit error message when API returns 429", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Too many requests. Please try again later." }),
    });

    render(<SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="guest@domain.com" />);

    const submitBtn = screen.getByRole("button", { name: "Subscribe" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
  });

  it("TC-MOD-12: resets form inputs and validation errors when reopened", () => {
    const { rerender } = render(
      <SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="initial@domain.com" />
    );

    expect(screen.getByLabelText(/Email address/i)).toHaveValue("initial@domain.com");

    rerender(<SubscribeModal isOpen={false} onClose={vi.fn()} />);
    rerender(
      <SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="second@domain.com" />
    );

    expect(screen.getByLabelText(/Email address/i)).toHaveValue("second@domain.com");
  });
});
