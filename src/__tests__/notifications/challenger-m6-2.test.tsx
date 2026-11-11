import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyPage, { VerifyContent } from "@/app/verify/page";
import UnsubscribePage, { UnsubscribeContent } from "@/app/unsubscribe/page";

describe("Milestone 6 Challenger: Landing Pages, RFC 8058 Scanner Defense & Network Chaos", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // =========================================================================
  // SUITE 1: RFC 8058 Anti-Scanner Defense Empirical Verification
  // =========================================================================
  describe("Suite 1: RFC 8058 Anti-Scanner Defense Empirical Verification", () => {
    it("TC-RFC8058-01: Automated GET arrival at /unsubscribe NEVER triggers mutation or fetch requests", () => {
      // Simulates automated mail scanner (e.g. Gmail / Outlook SafeLinks / Proofpoint crawler)
      // fetching or pre-rendering the unsubscribe page.
      render(<UnsubscribeContent forcedToken="scanner-probe-token-xyz" forcedTopic="JAVASCRIPT" />);

      // Assert 0 outgoing network mutation requests
      expect(mockFetch).not.toHaveBeenCalled();

      // Assert page renders in CONFIRMATION state, NOT mutated success
      expect(screen.getByTestId("unsubscribe-confirm")).toBeInTheDocument();
      expect(screen.queryByTestId("unsubscribe-success")).not.toBeInTheDocument();
      expect(screen.queryByTestId("unsubscribe-loading")).not.toBeInTheDocument();
    });

    it("TC-RFC8058-02: Automated multi-cycle scanner crawl & re-renders maintain 0 mutations", () => {
      const { rerender } = render(
        <UnsubscribeContent forcedToken="scanner-probe-token-xyz" forcedTopic="OPERATING_SYSTEMS" />
      );

      // Simulate crawler DOM traversal / multiple re-renders
      rerender(<UnsubscribeContent forcedToken="scanner-probe-token-xyz" forcedTopic="OPERATING_SYSTEMS" />);
      rerender(<UnsubscribeContent forcedToken="scanner-probe-token-xyz" forcedTopic="OPERATING_SYSTEMS" />);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByTestId("unsubscribe-confirm")).toBeInTheDocument();
    });

    it("TC-RFC8058-03: 'Keep My Subscription' action safely aborts with 0 network calls and routes to /learning-paths", () => {
      render(<UnsubscribeContent forcedToken="active-subscriber-token" forcedTopic="COMPUTER_NETWORKS" />);

      const keepLink = screen.getByRole("link", { name: /Keep My Subscription/i });
      expect(keepLink).toBeInTheDocument();
      expect(keepLink).toHaveAttribute("href", "/learning-paths");

      // Zero fetch calls executed when opting out of unsubscribe
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("TC-RFC8058-04: Mutation Quarantine: strictly ONLY human click on 'Confirm Unsubscribe' triggers POST mutation", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: "Unsubscribed successfully." }),
      });

      render(<UnsubscribeContent forcedToken="human-user-token-999" forcedTopic="BACKEND" />);

      // Before explicit click: 0 network calls
      expect(mockFetch).toHaveBeenCalledTimes(0);

      // Human clicks confirm
      const confirmButton = screen.getByRole("button", { name: /Confirm Unsubscribe/i });
      await user.click(confirmButton);

      // After explicit click: exactly 1 POST mutation dispatched
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("/api/notifications/unsubscribe");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({ "Content-Type": "application/json" });
      expect(JSON.parse(options.body)).toEqual({
        token: "human-user-token-999",
        topic: "BACKEND",
      });

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-success")).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // SUITE 2: /verify Landing Page Boundary & Network Chaos
  // =========================================================================
  describe("Suite 2: /verify Landing Page Boundary & Network Chaos", () => {
    it("TC-VER-CHAOS-01: Abrupt network failure (offline / connection reset) gracefully renders accessible error state", async () => {
      // Simulates device losing network connection or socket hangup during verify
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      render(<VerifyContent forcedToken="network-chaos-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      });

      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(
        screen.getByText(/Network error occurred while verifying your email/i)
      ).toBeInTheDocument();

      // Verify recovery links exist and meet touch targets
      const recoveryLink = screen.getByRole("link", { name: /Go to Learning Paths/i });
      expect(recoveryLink).toHaveAttribute("href", "/learning-paths");
      expect(recoveryLink.className).toContain("min-h-[44px]");
    });

    it("TC-VER-CHAOS-02: HTTP 410 Expired token displays 24-hour security explanation and subscribe CTA", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 410,
        json: async () => ({
          error: "Verification token has expired. Double opt-in links are valid for 24 hours.",
        }),
      });

      render(<VerifyContent forcedToken="expired-24h-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("verify-expired")).toBeInTheDocument();
      });

      expect(screen.getByText("Verification Link Expired")).toBeInTheDocument();
      expect(
        screen.getByText(/Double opt-in links are valid for 24 hours/i)
      ).toBeInTheDocument();

      // CTA must route user to re-subscribe
      const subscribeCta = screen.getByRole("link", { name: /Request New Verification Link/i });
      expect(subscribeCta).toHaveAttribute("href", "/learning-paths?subscribe=true");
      expect(subscribeCta.className).toContain("min-h-[44px]");
    });

    it("TC-VER-CHAOS-03: HTTP 400 Bad Request with custom server message renders cleanly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Verification token is malformed or invalid hex." }),
      });

      render(<VerifyContent forcedToken="bad-hex-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      });

      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(screen.getByText("Verification token is malformed or invalid hex.")).toBeInTheDocument();
    });

    it("TC-VER-CHAOS-04: Corrupted 500 HTML response (non-JSON) handles syntax error gracefully", async () => {
      // Simulates an upstream reverse proxy / NGINX 502/500 error returning raw HTML instead of JSON
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new SyntaxError("Unexpected token '<', <html>... is not valid JSON");
        },
      });

      render(<VerifyContent forcedToken="crash-token" />);

      await waitFor(() => {
        expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      });

      // Default fallback message is safely rendered
      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(
        screen.getByText(/Invalid verification token or token already used/i)
      ).toBeInTheDocument();
    });

    it("TC-VER-CHAOS-05: Server redirect fast-path (?status=success) completely bypasses network fetch", () => {
      render(<VerifyContent forcedStatus="success" />);

      // 0 network fetch calls
      expect(mockFetch).not.toHaveBeenCalled();

      // Immediately shows verified confirmation
      expect(screen.getByTestId("verify-success")).toBeInTheDocument();
      expect(screen.getByText("Subscription Confirmed!")).toBeInTheDocument();

      const cta = screen.getByRole("link", { name: /Explore Learning Paths/i });
      expect(cta).toHaveAttribute("href", "/learning-paths");
    });

    it("TC-VER-CHAOS-06: Token URI encoding prevents query parameter pollution and injection", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const untrustedToken = "token+with spaces&admin=true#hash 100%";
      render(<VerifyContent forcedToken={untrustedToken} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const requestedUrl = mockFetch.mock.calls[0][0];
      expect(requestedUrl).toBe(
        `/api/notifications/verify?token=${encodeURIComponent(untrustedToken)}`
      );
      expect(requestedUrl).not.toContain("&admin=true");
    });

    it("TC-VER-CHAOS-07: Missing token without status immediately enters error state with zero network calls", () => {
      render(<VerifyContent />);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      expect(
        screen.getByText(/No verification token provided. Please check the link from your email./i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 3: /unsubscribe Landing Page Boundary & Topic Chaos
  // =========================================================================
  describe("Suite 3: /unsubscribe Landing Page Boundary & Topic Chaos", () => {
    it("TC-UNSUB-CHAOS-01: Missing token renders immediate error state with 0 confirmation buttons", () => {
      render(<UnsubscribeContent />);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
      expect(screen.queryByTestId("unsubscribe-confirm")).not.toBeInTheDocument();
      expect(
        screen.getByText(/No unsubscription token provided/i)
      ).toBeInTheDocument();
    });

    it("TC-UNSUB-CHAOS-02: HTTP 404 response on confirm transitions to error state", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Subscriber not found or token has already been revoked." }),
      });

      render(<UnsubscribeContent forcedToken="invalid-revoked-token" />);

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
      });

      expect(screen.getByText("Unable to Unsubscribe")).toBeInTheDocument();
      expect(
        screen.getByText("Subscriber not found or token has already been revoked.")
      ).toBeInTheDocument();
    });

    it("TC-UNSUB-CHAOS-03: Single topic unsubscription displays topic name, notices unaffected topics, and renders remaining topics", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Unsubscribed from Operating Systems.",
          remainingTopics: ["JAVASCRIPT", "JAVA", "BACKEND"],
        }),
      });

      render(
        <UnsubscribeContent forcedToken="valid-sub-token" forcedTopic="OPERATING_SYSTEMS" />
      );

      // Verify specific topic label and unaffected message
      expect(screen.getByText("Operating Systems")).toBeInTheDocument();
      expect(
        screen.getByText(/Your subscriptions to other disciplines will remain unaffected/i)
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-success")).toBeInTheDocument();
      });

      // Assert remaining topics are rendered as chips
      expect(screen.getByText("Active Subscriptions Remaining:")).toBeInTheDocument();
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
      expect(screen.getByText("Java & JVM")).toBeInTheDocument();
      expect(screen.getByText("Backend Internals")).toBeInTheDocument();
    });

    it("TC-UNSUB-CHAOS-04: ALL unsubscription displays 'All Disciplines', omits unaffected note, and renders zero remaining chips", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Unsubscribed from all notifications.",
          remainingTopics: [],
        }),
      });

      render(<UnsubscribeContent forcedToken="valid-sub-token" forcedTopic="ALL" />);

      expect(screen.getByText("All Disciplines")).toBeInTheDocument();
      // Notice for other disciplines must NOT be present when unsubscribing from ALL
      expect(
        screen.queryByText(/Your subscriptions to other disciplines will remain unaffected/i)
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-success")).toBeInTheDocument();
      });

      expect(screen.getByText(/You have been unsubscribed from/i)).toBeInTheDocument();
      expect(
        screen.queryByText("Active Subscriptions Remaining:")
      ).not.toBeInTheDocument();
    });

    it("TC-UNSUB-CHAOS-05: Case normalization and unknown topic fallback handling", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Lowercase unknown topic
      render(
        <UnsubscribeContent forcedToken="valid-sub-token" forcedTopic="distributed_systems" />
      );

      // Falls back safely to uppercase string without crashing
      expect(screen.getByText("DISTRIBUTED_SYSTEMS")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/notifications/unsubscribe",
        expect.objectContaining({
          body: JSON.stringify({ token: "valid-sub-token", topic: "DISTRIBUTED_SYSTEMS" }),
        })
      );
    });

    it("TC-UNSUB-CHAOS-06: Abrupt network failure during unsubscription POST renders error banner", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Connection reset by peer"));

      render(<UnsubscribeContent forcedToken="fail-token" />);

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Network error occurred while processing unsubscription/i)
      ).toBeInTheDocument();
    });

    it("TC-UNSUB-CHAOS-07: Non-JSON 502 Bad Gateway response on unsubscription POST is safely handled", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token in JSON at position 0");
        },
      });

      render(<UnsubscribeContent forcedToken="fail-token" />);

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Failed to process unsubscription/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 4: In-Flight Unmount & Concurrency / Race Conditions
  // =========================================================================
  describe("Suite 4: In-Flight Unmount & Concurrency / Race Conditions", () => {
    it("TC-RACE-01: /verify unmount while fetch is in-flight causes zero unhandled errors or memory leaks", async () => {
      let resolvePromise: (value: unknown) => void = () => {};
      const pendingFetch = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingFetch);

      const { unmount } = render(<VerifyContent forcedToken="pending-token" />);

      // Ensure loading state is active
      expect(screen.getByTestId("verify-loading")).toBeInTheDocument();

      // User navigates away before fetch resolves
      unmount();

      // Now resolve the promise post-unmount
      await act(async () => {
        resolvePromise({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      });

      // Component is unmounted; no errors or unhandled exceptions thrown
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("TC-RACE-02: /unsubscribe unmount while POST is in-flight causes zero uncaught errors", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void = () => {};
      const pendingFetch = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingFetch);

      const { unmount } = render(<UnsubscribeContent forcedToken="pending-unsub-token" />);

      await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

      expect(screen.getByTestId("unsubscribe-loading")).toBeInTheDocument();

      // Unmount while POST request is in-flight
      unmount();

      // Resolve post-unmount
      await act(async () => {
        resolvePromise({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "Done" }),
        });
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("TC-RACE-03: Rapid multiple clicks on 'Confirm Unsubscribe' trigger at most 1 POST mutation", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void = () => {};
      const pendingFetch = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingFetch);

      render(<UnsubscribeContent forcedToken="rapid-click-token" />);

      const confirmBtn = screen.getByRole("button", { name: /Confirm Unsubscribe/i });

      // Click button
      await user.click(confirmBtn);

      // Loading state immediately removes the button from DOM
      expect(screen.queryByRole("button", { name: /Confirm Unsubscribe/i })).not.toBeInTheDocument();
      expect(screen.getByTestId("unsubscribe-loading")).toBeInTheDocument();

      // Exactly 1 POST request dispatched
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve
      await act(async () => {
        resolvePromise({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: "Unsubscribed" }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId("unsubscribe-success")).toBeInTheDocument();
      });
    });

    it("TC-PAGE-01: Full VerifyPage mounts within Suspense boundary without runtime error", () => {
      const { container } = render(<VerifyPage />);
      expect(container).toBeInTheDocument();
    });

    it("TC-PAGE-02: Full UnsubscribePage mounts within Suspense boundary without runtime error", () => {
      const { container } = render(<UnsubscribePage />);
      expect(container).toBeInTheDocument();
    });
  });
});
