import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OperatingSystemsPathPage from "../operating-systems/page";
import FrontendPathPage from "../frontend/page";
import BackendPathPage from "../backend/page";
import JavaPathPage from "../java/page";
import JavascriptPathPage from "../javascript/page";

describe("Subject Path Pages (Design System Consistency)", () => {
  describe("Operating Systems Path Page", () => {
    it("renders all 7 operating systems episodes with their correct titles and links", () => {
      render(<OperatingSystemsPathPage />);

      expect(screen.getByRole("heading", { level: 1, name: /Operating Systems/i })).toBeDefined();

      // Check all 7 episode titles
      expect(screen.getByText("Process Lifecycle & Scheduling")).toBeDefined();
      expect(screen.getByText("CPU Scheduling Deep-Dive")).toBeDefined();
      expect(screen.getByText("Process Control Blocks (PCB)")).toBeDefined();
      expect(screen.getByText("CPU Schedulers")).toBeDefined();
      expect(screen.getByText("Producer-Consumer Problem")).toBeDefined();
      expect(screen.getByText("Printer Spooler Problem")).toBeDefined();
      expect(screen.getByText("Lock Variables")).toBeDefined();

      // Check episode links
      expect(screen.getByRole("link", { name: /Process Lifecycle & Scheduling/i })).toHaveAttribute(
        "href",
        "/operating-systems/simulator/process-states"
      );
      expect(screen.getByRole("link", { name: /CPU Scheduling Deep-Dive/i })).toHaveAttribute(
        "href",
        "/operating-systems/simulator/cpu-scheduling-deep-dive"
      );
      expect(screen.getByRole("link", { name: /CPU Schedulers/i })).toHaveAttribute(
        "href",
        "/operating-systems/simulator/cpu-scheduling"
      );
      expect(screen.getByRole("link", { name: /Lock Variables/i })).toHaveAttribute(
        "href",
        "/operating-systems/simulator/lock-variables"
      );
    });
  });

  describe("Frontend Architecture Path Page", () => {
    it("renders all 7 frontend architecture episodes with their correct titles and links", () => {
      render(<FrontendPathPage />);

      expect(screen.getByRole("heading", { level: 1, name: /Frontend Architecture/i })).toBeDefined();

      // Check titles
      expect(screen.getByText("JSX & Virtual DOM")).toBeDefined();
      expect(screen.getByText("Props & State")).toBeDefined();
      expect(screen.getByText("useState Batching")).toBeDefined();
      expect(screen.getByText("useEffect Pipeline")).toBeDefined();
      expect(screen.getByText("Cleanup & Race Conditions")).toBeDefined();
      expect(screen.getByText("useLayoutEffect")).toBeDefined();
      expect(screen.getByText("useRef & The DOM")).toBeDefined();

      // Check links
      expect(screen.getByRole("link", { name: /JSX & Virtual DOM/i })).toHaveAttribute(
        "href",
        "/frontend/episodes/1"
      );
      expect(screen.getByRole("link", { name: /useRef & The DOM/i })).toHaveAttribute(
        "href",
        "/frontend/episodes/7"
      );
    });
  });

  describe("Backend Internals Path Page", () => {
    it("renders all 3 backend episodes with their correct titles and links", () => {
      render(<BackendPathPage />);

      expect(screen.getByRole("heading", { level: 1, name: /Backend internals/i })).toBeDefined();

      // Check titles
      expect(screen.getByText("Node Architecture")).toBeDefined();
      expect(screen.getByText("Blocking vs Non-Blocking")).toBeDefined();
      expect(screen.getByText("Event Loop Phases")).toBeDefined();

      // Check links
      expect(screen.getByRole("link", { name: /Node Architecture/i })).toHaveAttribute(
        "href",
        "/backend/episodes/1"
      );
      expect(screen.getByRole("link", { name: /Event Loop Phases/i })).toHaveAttribute(
        "href",
        "/backend/episodes/3"
      );
    });
  });

  describe("JavaScript Path Page", () => {
    it("renders all 7 JavaScript episodes with standardized AppNavbar and EpisodeCard", () => {
      render(<JavascriptPathPage />);

      expect(screen.getByRole("heading", { level: 1, name: /JavaScript/i })).toBeDefined();
      expect(screen.getByText("Execution Contexts & Call Stack")).toBeDefined();
      expect(screen.getByText("The Event Loop & Web APIs")).toBeDefined();
      expect(screen.getByRole("link", { name: /Execution Contexts & Call Stack/i })).toHaveAttribute(
        "href",
        "/javascript/simulator/call-stack"
      );
    });
  });

  describe("Java & JVM Architecture Path Page", () => {
    it("renders all 8 Java episodes with standardized AppNavbar and EpisodeCard", () => {
      render(<JavaPathPage />);

      expect(screen.getByRole("heading", { level: 1, name: /Java & JVM Architecture/i })).toBeDefined();
      expect(screen.getByText("Java Code Execution")).toBeDefined();
      expect(screen.getByText("Primitive Typecasting")).toBeDefined();
      expect(screen.getByRole("link", { name: /Java Code Execution/i })).toHaveAttribute(
        "href",
        "/java/canvas/flow-of-execution"
      );
      expect(screen.getByRole("link", { name: /Primitive Typecasting/i })).toHaveAttribute(
        "href",
        "/java/simulator/typecasting"
      );
    });
  });
});
