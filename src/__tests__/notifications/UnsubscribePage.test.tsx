import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnsubscribeContent } from "@/app/unsubscribe/page";

describe("Unsubscribe Landing Page (/unsubscribe)", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("TC-UNS-01: renders canonical Logo and brand title", () => {
    render(<UnsubscribeContent forcedToken="test-unsub-token" />);
    expect(screen.getByText("System Simulator")).toBeInTheDocument();
  });

  it("TC-UNS-02: confirmation state shows specific topic label", () => {
    render(<UnsubscribeContent forcedToken="test-unsub-token" forcedTopic="COMPUTER_NETWORKS" />);

    expect(screen.getByTestId("unsubscribe-confirm")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm Unsubscribe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Unsubscribe" })).toBeInTheDocument();
    expect(screen.getByText("Computer Networks")).toBeInTheDocument();
  });

  it("TC-UNS-03: confirmation state shows All Disciplines when topic is ALL or omitted", () => {
    render(<UnsubscribeContent forcedToken="test-unsub-token" />);

    expect(screen.getByText("All Disciplines")).toBeInTheDocument();
  });

  it("TC-UNS-04: Keep My Subscription links to /learning-paths without mutating state", () => {
    render(<UnsubscribeContent forcedToken="test-unsub-token" />);

    const keepLink = screen.getByRole("link", { name: /Keep My Subscription/i });
    expect(keepLink).toHaveAttribute("href", "/learning-paths");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("TC-UNS-05: clicking Confirm Unsubscribe dispatches POST request with token and topic", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Unsubscribed successfully." }),
    });

    render(<UnsubscribeContent forcedToken="token-xyz" forcedTopic="JAVASCRIPT" />);

    const confirmBtn = screen.getByRole("button", { name: /Confirm Unsubscribe/i });
    await user.click(confirmBtn);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/notifications/unsubscribe");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ token: "token-xyz", topic: "JAVASCRIPT" });
  });

  it("TC-UNS-06: transitions to loading state during POST in-flight", async () => {
    const user = userEvent.setup();
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<UnsubscribeContent forcedToken="token-xyz" />);

    await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

    expect(screen.getByTestId("unsubscribe-loading")).toBeInTheDocument();
    expect(screen.getByText("Updating Preferences...")).toBeInTheDocument();
  });

  it("TC-UNS-07: transitions to success state upon 200 response", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Unsubscribed successfully." }),
    });

    render(<UnsubscribeContent forcedToken="token-xyz" />);

    await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

    await waitFor(() => {
      expect(screen.getByTestId("unsubscribe-success")).toBeInTheDocument();
    });
    expect(screen.getByText("Unsubscribed Successfully")).toBeInTheDocument();
  });

  it("TC-UNS-08: displays remaining active topic chips when returned by API", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Unsubscribed successfully.",
        remainingTopics: ["JAVASCRIPT", "OPERATING_SYSTEMS"],
      }),
    });

    render(<UnsubscribeContent forcedToken="token-xyz" forcedTopic="JAVA" />);

    await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

    await waitFor(() => {
      expect(screen.getByText("Active Subscriptions Remaining:")).toBeInTheDocument();
    });
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Operating Systems")).toBeInTheDocument();
  });

  it("TC-UNS-09: transitions to error state when POST returns 404", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Subscriber not found or invalid token." }),
    });

    render(<UnsubscribeContent forcedToken="invalid-token" />);

    await user.click(screen.getByRole("button", { name: /Confirm Unsubscribe/i }));

    await waitFor(() => {
      expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
    });
    expect(screen.getByText("Unable to Unsubscribe")).toBeInTheDocument();
  });

  it("TC-UNS-10: shows error state immediately when rendered without token", () => {
    render(<UnsubscribeContent />);

    expect(screen.getByTestId("unsubscribe-error")).toBeInTheDocument();
    expect(screen.getByText(/No unsubscription token provided/i)).toBeInTheDocument();
  });
});
