import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CloudPathPage from "../page";
import { CLOUD_EPISODES } from "../episodes";

describe("CloudPathPage (/cloud)", () => {
  it("renders subject title, description, and episode cards", () => {
    render(<CloudPathPage />);

    expect(screen.getByRole("heading", { name: "Cloud Engineering", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Look under the hood of cloud infrastructure/i)).toBeInTheDocument();
    expect(screen.getByText(`${CLOUD_EPISODES.length} Curated Episodes`)).toBeInTheDocument();
    expect(screen.getByText("Subscribe to Cloud Engineering")).toBeInTheDocument();
    expect(screen.getByText(/AWS IAM: Who Gets Access to What\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon EC2: The Invisible Handshake/i)).toBeInTheDocument();
  });
});
