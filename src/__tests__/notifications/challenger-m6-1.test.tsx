import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscribeModal } from "@/components/notifications/SubscribeModal";
import { SubscribeButton } from "@/components/notifications/SubscribeButton";
import {
  TopicChip,
  SubjectChannel,
  SUBJECT_METADATA_MAP,
} from "@/components/notifications/TopicChip";
import { VerifyContent } from "@/app/verify/page";
import { UnsubscribeContent } from "@/app/unsubscribe/page";

const ALL_INDIVIDUAL_SUBJECTS: SubjectChannel[] = [
  "JAVASCRIPT",
  "OPERATING_SYSTEMS",
  "JAVA",
  "FRONTEND",
  "BACKEND",
  "COMPUTER_NETWORKS",
];

describe("Milestone 6 Adversarial Challenger Suite (challenger-m6-1)", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.body.style.overflow = "";
  });

  // =========================================================================
  // SECTION 1: FOCUS TRAP & KEYBOARD BOUNDARIES
  // =========================================================================
  describe("1. Focus Trap & Keyboard Navigation Boundaries", () => {
    it("CHA-KB-01: traps focus and loops forward on Tab from last element to first element", () => {
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole("dialog");
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      expect(focusables.length).toBeGreaterThan(1);

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      // Focus last element and trigger Tab keydown
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
      expect(document.activeElement).toBe(firstElement);
    });

    it("CHA-KB-02: traps focus and loops backward on Shift+Tab from first element to last element", () => {
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole("dialog");
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      // Focus first element and trigger Shift+Tab keydown
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(lastElement);
    });

    it("CHA-KB-03: handles focus trap boundaries in Success state between Close and Done buttons", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requiresVerification: false,
        }),
      });

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="user@example.com"
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId("subscribe-success")).toBeInTheDocument();
      });

      const dialog = screen.getByRole("dialog");
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      // In success state, exactly 2 buttons are focusable: Close dialog in header and Done in body
      expect(focusables.length).toBe(2);
      const closeBtn = screen.getByRole("button", { name: "Close dialog" });
      const doneBtn = screen.getByRole("button", { name: "Done" });
      expect(focusables[0]).toBe(closeBtn);
      expect(focusables[1]).toBe(doneBtn);

      // Tab on Done button (lastElement) loops to Close button (firstElement)
      doneBtn.focus();
      expect(document.activeElement).toBe(doneBtn);
      fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
      expect(document.activeElement).toBe(closeBtn);

      // Shift+Tab on Close button (firstElement) loops to Done button (lastElement)
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(doneBtn);
    });

    it("CHA-KB-04: rapid Tab cycling stress test retains focus strictly within dialog bounds", async () => {
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const emailInput = screen.getByLabelText(/Email address/i);
      await waitFor(() => {
        expect(document.activeElement).toBe(emailInput);
      });

      const dialog = screen.getByRole("dialog");
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      expect(focusables.length).toBeGreaterThan(0);

      // Rapidly fire 30 Tab events
      let currentIdx = focusables.indexOf(emailInput);
      if (currentIdx === -1) currentIdx = 0;

      for (let i = 0; i < 30; i++) {
        if (currentIdx === focusables.length - 1) {
          fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
          currentIdx = 0;
        } else {
          currentIdx++;
          focusables[currentIdx].focus();
        }
        // Guarantee active element is always inside dialog
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });

    it("CHA-KB-05: Escape key dismissal restores focus to the triggering element", async () => {
      function TriggerHarness() {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <div>
            <button
              type="button"
              data-testid="modal-trigger-btn"
              onClick={() => setIsOpen(true)}
            >
              Open Subscribe Modal
            </button>
            <SubscribeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </div>
        );
      }

      render(<TriggerHarness />);

      const triggerBtn = screen.getByTestId("modal-trigger-btn");
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open modal
      fireEvent.click(triggerBtn);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Press Escape to dismiss
      fireEvent.keyDown(window, { key: "Escape" });

      // Modal is unmounted and focus is restored to triggerBtn
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(document.activeElement).toBe(triggerBtn);
    });

    it("CHA-KB-06: locks document.body scroll on mount and restores on unmount", () => {
      document.body.style.overflow = "visible";

      const { unmount } = render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);
      expect(document.body.style.overflow).toBe("hidden");

      unmount();
      expect(document.body.style.overflow).toBe("visible");
    });
  });

  // =========================================================================
  // SECTION 2: TOUCH TARGETS & ERGONOMICS (RULE #7)
  // =========================================================================
  describe("2. Touch Targets & Responsive Ergonomics (Rule #7)", () => {
    it("CHA-ERG-01: TopicChip declares min-h-[44px] min-w-[44px] and touch-manipulation across all channels", () => {
      const allChannels = Object.values(SubjectChannel);

      for (const channel of allChannels) {
        const { unmount } = render(
          <TopicChip
            subject={channel}
            selected={false}
            onToggle={vi.fn()}
          />
        );

        const chip = screen.getByRole("checkbox");
        expect(chip.className).toContain("min-h-[44px]");
        expect(chip.className).toContain("min-w-[44px]");
        expect(chip.className).toContain("touch-manipulation");
        expect(chip.className).toContain("active:scale-[0.98]");

        unmount();
      }
    });

    it("CHA-ERG-02: SubscribeModal dialog dismiss button declares min-h-[44px] min-w-[44px] and touch-manipulation", () => {
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const closeButton = screen.getByRole("button", { name: "Close dialog" });
      expect(closeButton.className).toContain("min-h-[44px]");
      expect(closeButton.className).toContain("min-w-[44px]");
      expect(closeButton.className).toContain("touch-manipulation");
      expect(closeButton.className).toContain("active:scale-95");
    });

    it("CHA-ERG-03: SubscribeModal action buttons declare minimum 44px height and touch-manipulation", () => {
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      expect(cancelBtn.className).toContain("min-h-[44px]");
      expect(cancelBtn.className).toContain("touch-manipulation");

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      expect(submitBtn.className).toContain("min-h-[44px]");
      expect(submitBtn.className).toContain("touch-manipulation");
    });

    it("CHA-ERG-04: SubscribeButton declares min-h-[44px] touch-manipulation active:scale-95 on mobile", () => {
      render(<SubscribeButton />);

      const triggerBtn = screen.getByRole("button");
      expect(triggerBtn.className).toContain("min-h-[44px]");
      expect(triggerBtn.className).toContain("touch-manipulation");
      expect(triggerBtn.className).toContain("active:scale-95");
    });

    it("CHA-ERG-05: SubscribeButton icon variant declares min-w-[44px] min-h-[44px]", () => {
      render(<SubscribeButton variant="icon" />);

      const iconBtn = screen.getByRole("button");
      expect(iconBtn.className).toContain("min-w-[44px]");
      expect(iconBtn.className).toContain("min-h-[44px]");
      expect(iconBtn.className).toContain("touch-manipulation");
    });

    it("CHA-ERG-06: VerifyPage and UnsubscribePage CTAs declare min-h-[44px] touch-manipulation active:scale-95", () => {
      const { unmount: unmountVerify } = render(
        <VerifyContent forcedStatus="success" />
      );
      const verifyLink = screen.getByRole("link", { name: /Explore Learning Paths/i });
      expect(verifyLink.className).toContain("min-h-[44px]");
      expect(verifyLink.className).toContain("touch-manipulation");
      expect(verifyLink.className).toContain("active:scale-95");
      unmountVerify();

      const { unmount: unmountUnsub } = render(
        <UnsubscribeContent forcedToken="tok-1" />
      );
      const unsubBtn = screen.getByRole("button", { name: "Confirm Unsubscribe" });
      expect(unsubBtn.className).toContain("min-h-[44px]");
      expect(unsubBtn.className).toContain("touch-manipulation");
      expect(unsubBtn.className).toContain("active:scale-95");
      unmountUnsub();
    });

    it("CHA-ERG-07: SubscribeButton does NOT auto-open modal on hover or focus (Rule #7 touch ergonomics)", () => {
      render(<SubscribeButton />);

      const button = screen.getByRole("button");

      // Hovering must not open modal
      fireEvent.mouseEnter(button);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Focusing must not open modal (WCAG 3.2.1 / Rule #7)
      button.focus();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Only explicit click opens modal
      fireEvent.click(button);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SECTION 3: MASTER ALL SWITCH STATE INVARIANTS & CONSOLIDATION
  // =========================================================================
  describe("3. Master ALL Switch State Invariants & Topic Consolidation", () => {
    it("CHA-INV-01: deselecting 1 individual topic disables ALL chip while keeping remaining 5 topics active", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
      const jsChip = screen.getByRole("checkbox", { name: /JavaScript/i });
      const osChip = screen.getByRole("checkbox", { name: /Operating Systems/i });
      const javaChip = screen.getByRole("checkbox", { name: /Java & JVM/i });
      const feChip = screen.getByRole("checkbox", { name: /Frontend Systems/i });
      const beChip = screen.getByRole("checkbox", { name: /Backend Internals/i });
      const netChip = screen.getByRole("checkbox", { name: /Computer Networks/i });

      // Initially all are checked
      expect(allChip).toHaveAttribute("aria-checked", "true");
      expect(jsChip).toHaveAttribute("aria-checked", "true");
      expect(osChip).toHaveAttribute("aria-checked", "true");

      // Deselect JavaScript
      await user.click(jsChip);

      expect(allChip).toHaveAttribute("aria-checked", "false");
      expect(jsChip).toHaveAttribute("aria-checked", "false");
      expect(osChip).toHaveAttribute("aria-checked", "true");
      expect(javaChip).toHaveAttribute("aria-checked", "true");
      expect(feChip).toHaveAttribute("aria-checked", "true");
      expect(beChip).toHaveAttribute("aria-checked", "true");
      expect(netChip).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("5 selected")).toBeInTheDocument();
    });

    it("CHA-INV-02: re-selecting the 6th individual topic automatically collapses state back to ALL", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
      const jsChip = screen.getByRole("checkbox", { name: /JavaScript/i });

      // Unselect JavaScript -> drops to 5 individual topics
      await user.click(jsChip);
      expect(allChip).toHaveAttribute("aria-checked", "false");
      expect(jsChip).toHaveAttribute("aria-checked", "false");
      expect(screen.getByText("5 selected")).toBeInTheDocument();

      // Re-select JavaScript -> all 6 individual topics now selected -> collapses to ALL
      await user.click(jsChip);
      expect(allChip).toHaveAttribute("aria-checked", "true");
      expect(jsChip).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("All topics selected")).toBeInTheDocument();
    });

    it("CHA-INV-03: clicking ALL chip when active clears all selections; clicking again restores ALL", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="test@domain.com" />);

      const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
      const submitBtn = screen.getByRole("button", { name: "Subscribe" });

      expect(allChip).toHaveAttribute("aria-checked", "true");
      expect(submitBtn).not.toBeDisabled();

      // Click ALL -> toggles to empty set
      await user.click(allChip);
      expect(allChip).toHaveAttribute("aria-checked", "false");
      expect(screen.getByText("0 selected")).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();

      // Individual chips must all be unchecked
      for (const subj of ALL_INDIVIDUAL_SUBJECTS) {
        const meta = SUBJECT_METADATA_MAP[subj];
        const chip = screen.getByRole("checkbox", { name: new RegExp(meta.title, "i") });
        expect(chip).toHaveAttribute("aria-checked", "false");
      }

      // Click ALL again -> restores ALL
      await user.click(allChip);
      expect(allChip).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("All topics selected")).toBeInTheDocument();
      expect(submitBtn).not.toBeDisabled();
    });

    it("CHA-INV-04: selecting each individual topic sequentially from empty set collapses to ALL when 6th is clicked", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const allChip = screen.getByRole("checkbox", { name: /All Disciplines/i });
      // Clear selection
      await user.click(allChip);
      expect(screen.getByText("0 selected")).toBeInTheDocument();

      // Click each individual topic sequentially
      for (let i = 0; i < ALL_INDIVIDUAL_SUBJECTS.length; i++) {
        const subj = ALL_INDIVIDUAL_SUBJECTS[i];
        const meta = SUBJECT_METADATA_MAP[subj];
        const chip = screen.getByRole("checkbox", { name: new RegExp(meta.title, "i") });
        await user.click(chip);

        if (i < ALL_INDIVIDUAL_SUBJECTS.length - 1) {
          expect(allChip).toHaveAttribute("aria-checked", "false");
          expect(screen.getByText(`${i + 1} selected`)).toBeInTheDocument();
        } else {
          // When 6th topic is selected, collapses back to ALL
          expect(allChip).toHaveAttribute("aria-checked", "true");
          expect(screen.getByText("All topics selected")).toBeInTheDocument();
        }
      }
    });

    it("CHA-INV-05: deselecting all 6 topics one by one cleanly reaches 0 selected and disables submit", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} defaultEmail="test@domain.com" />);

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });

      // Deselect each of the 6 topics one by one
      for (let i = 0; i < ALL_INDIVIDUAL_SUBJECTS.length; i++) {
        const subj = ALL_INDIVIDUAL_SUBJECTS[i];
        const meta = SUBJECT_METADATA_MAP[subj];
        const chip = screen.getByRole("checkbox", { name: new RegExp(meta.title, "i") });
        await user.click(chip);

        const remaining = ALL_INDIVIDUAL_SUBJECTS.length - (i + 1);
        if (remaining > 0) {
          expect(screen.getByText(`${remaining} selected`)).toBeInTheDocument();
          expect(submitBtn).not.toBeDisabled();
        } else {
          expect(screen.getByText("0 selected")).toBeInTheDocument();
          expect(submitBtn).toBeDisabled();
        }
      }
    });

    it("CHA-INV-06: network payload sends ['ALL'] when all topics selected, and sends explicit array when partial", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, requiresVerification: true }),
      });

      const { unmount } = render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="all-user@test.com"
        />
      );

      // 1. Submit with ALL selected
      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(firstCallBody.subjects).toEqual(["ALL"]);

      unmount();

      // 2. Fresh mount with contextual individual subject
      mockFetch.mockClear();
      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="partial@test.com"
          initialSubject={SubjectChannel.JAVA}
        />
      );

      const secondSubmitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(secondSubmitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      const secondCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(secondCallBody.subjects).toEqual(["JAVA"]);
    });
  });

  // =========================================================================
  // SECTION 4: FORM VALIDATION, EDGE CASES & NETWORK CHAOS
  // =========================================================================
  describe("4. Form Validation, Edge Cases & Network Chaos", () => {
    it("CHA-VAL-01: whitespace-only emails are rejected with inline validation error", async () => {
      const user = userEvent.setup();
      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const emailInput = screen.getByLabelText(/Email address/i);
      const submitBtn = screen.getByRole("button", { name: "Subscribe" });

      // Whitespace input
      await user.type(emailInput, "    ");
      fireEvent.blur(emailInput);

      expect(screen.getByText("Email address is required.")).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("CHA-VAL-02: malformed email variations are rejected without triggering network call", async () => {
      const malformedEmails = [
        "not-an-email",
        "missingatsign.com",
        "@missingusername.com",
        "username@.com",
        "user name@domain.com",
      ];

      for (const badEmail of malformedEmails) {
        const { unmount } = render(
          <SubscribeModal isOpen={true} onClose={vi.fn()} />
        );

        const emailInput = screen.getByLabelText(/Email address/i);
        fireEvent.change(emailInput, { target: { value: badEmail } });
        fireEvent.blur(emailInput);

        expect(
          screen.getByText("Please enter a valid email address.")
        ).toBeInTheDocument();

        // Attempt form submit
        const form = emailInput.closest("form");
        if (form) fireEvent.submit(form);

        expect(mockFetch).not.toHaveBeenCalled();
        unmount();
      }
    });

    it("CHA-VAL-03: sanitizes leading and trailing whitespace and lowercases email in payload", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, requiresVerification: true }),
      });

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="   STUDENT@HARVARD.EDU   "
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.email).toBe("student@harvard.edu");
    });

    it("CHA-VAL-04: accepts and submits valid internationalized / Punycode IDN email domain", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, requiresVerification: true }),
      });

      render(<SubscribeModal isOpen={true} onClose={vi.fn()} />);

      const emailInput = screen.getByLabelText(/Email address/i);
      // Punycode format for researcher@münchen.de (RFC 5891 / HTML5 email spec compliance)
      await user.type(emailInput, "researcher@xn--mnchen-3ya.de");
      fireEvent.blur(emailInput);

      expect(
        screen.queryByText("Please enter a valid email address.")
      ).not.toBeInTheDocument();

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      expect(submitBtn).not.toBeDisabled();
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.email).toBe("researcher@xn--mnchen-3ya.de");
    });

    it("CHA-CHAOS-01: rapid double-clicks on submit button do not cause duplicate network dispatch", async () => {
      const user = userEvent.setup();
      let resolvePromise: (val: unknown) => void;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="fast-clicker@domain.com"
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });

      // First click
      await user.click(submitBtn);

      // Submit button is immediately disabled and enters submitting state
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText("Subscribing...")).toBeInTheDocument();

      // Rapidly attempt second click on the disabled button
      await user.click(submitBtn);

      // Network request must only be fired once
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve the pending promise
      act(() => {
        resolvePromise({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("subscribe-success")).toBeInTheDocument();
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("CHA-CHAOS-02: handles rate limit 429 response gracefully without wiping form data", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limit exceeded. 5 requests per 10 minutes allowed." }),
      });

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="rate-limited@domain.com"
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Rate limit exceeded. 5 requests per 10 minutes allowed./i)
      ).toBeInTheDocument();

      // Form inputs and selections must remain intact so user does not lose their state
      expect(screen.getByLabelText(/Email address/i)).toHaveValue("rate-limited@domain.com");
      expect(
        screen.getByRole("checkbox", { name: /All Disciplines/i })
      ).toHaveAttribute("aria-checked", "true");
    });

    it("CHA-CHAOS-03: handles network failure (fetch throws) gracefully and displays error banner", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="offline@domain.com"
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    });

    it("CHA-CHAOS-04: handles non-JSON 500 error response safely with fallback message", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      render(
        <SubscribeModal
          isOpen={true}
          onClose={vi.fn()}
          defaultEmail="crash@domain.com"
        />
      );

      const submitBtn = screen.getByRole("button", { name: "Subscribe" });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to process subscription.")).toBeInTheDocument();
    });
  });
});
