import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { VerifyContent } from "@/app/verify/page";

describe("Verify Landing Page (/verify)", () => {
  const originalFetch = global.fetch;
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("TC-VER-01: renders canonical Logo and brand title", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Email verified successfully." }),
    });
    render(<VerifyContent forcedToken="valid-token-123" />);
    expect(screen.getByText("System Simulator")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("verify-success")).toBeInTheDocument();
    });
  });

  it("TC-VER-02: shows loading state while verification is in-flight", async () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<VerifyContent forcedToken="valid-token-123" />);

    expect(screen.getByTestId("verify-loading")).toBeInTheDocument();
    expect(screen.getByText("Verifying Subscription...")).toBeInTheDocument();
  });

  it("TC-VER-03: transitions to success state when API returns 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Email verified successfully." }),
    });

    render(<VerifyContent forcedToken="valid-token-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-success")).toBeInTheDocument();
    });
    expect(screen.getByText("Subscription Confirmed!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Learning Paths/i })).toHaveAttribute(
      "href",
      "/learning-paths"
    );
  });

  it("TC-VER-04: transitions immediately to success state when status=success is passed without network fetch", () => {
    render(<VerifyContent forcedStatus="success" />);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByTestId("verify-success")).toBeInTheDocument();
    expect(screen.getByText("Subscription Confirmed!")).toBeInTheDocument();
  });

  it("TC-VER-05: transitions to expired state when API returns 410", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({ error: "Verification token has expired. Please subscribe again." }),
    });

    render(<VerifyContent forcedToken="expired-token-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-expired")).toBeInTheDocument();
    });
    expect(screen.getByText("Verification Link Expired")).toBeInTheDocument();
  });

  it("TC-VER-06: expired state renders Request New Verification Link CTA", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({ error: "Verification token has expired. Please subscribe again." }),
    });

    render(<VerifyContent forcedToken="expired-token-123" />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Request New Verification Link/i })
      ).toHaveAttribute("href", "/learning-paths?subscribe=true");
    });
  });

  it("TC-VER-07: transitions to error state when API returns 400", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid verification token." }),
    });

    render(<VerifyContent forcedToken="invalid-token" />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
    });
    expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    expect(screen.getByText(/Invalid verification token/i)).toBeInTheDocument();
  });

  it("TC-VER-08: transitions to error state when network fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    render(<VerifyContent forcedToken="token-fail" />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error occurred/i)).toBeInTheDocument();
  });

  it("TC-VER-09: shows error state when rendered without token or status", () => {
    render(<VerifyContent />);

    expect(screen.getByTestId("verify-error")).toBeInTheDocument();
    expect(screen.getByText(/No verification token provided/i)).toBeInTheDocument();
  });

  it("TC-VER-10: enforces touch-manipulation and min-h-[44px] on all action CTAs", async () => {
    render(<VerifyContent forcedStatus="success" />);

    const link = screen.getByRole("link", { name: /Explore Learning Paths/i });
    expect(link.className).toContain("min-h-[44px]");
    expect(link.className).toContain("touch-manipulation");
  });
});
