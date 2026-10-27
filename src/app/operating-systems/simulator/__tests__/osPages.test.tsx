import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import OSProcessStatesSimulator from "../process-states/page";
import ProcessControlBlockSimulator from "../process-control-block/page";
import ProducerConsumerSimulator from "../producer-consumer/page";
import PrinterSpoolerSimulator from "../printer-spooler/page";
import LockVariablesSimulator from "../lock-variables/page";
import { useOSSimulationStore } from "@/store/useOSSimulationStore";

describe("Operating Systems Simulator Pages Integration Tests", () => {
  beforeEach(() => {
    useOSSimulationStore.getState().resetEpisode();
  });

  describe("Episode 1: Process States Simulator", () => {
    it("mounts safely with OSKernelShell and advances steps", () => {
      render(<OSProcessStatesSimulator />);
      expect(screen.getByText(/Process Lifecycle & I\/O/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Ready Queue" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Waiting" })).toBeInTheDocument();

      const nextButton = screen.getByTitle("Next Step");
      fireEvent.click(nextButton);
      expect(useOSSimulationStore.getState().currentStepIndex).toBe(1);
    });
  });

  describe("Episode 3: Process Control Block (PCB) Simulator", () => {
    it("mounts safely with OSKernelShell and renders PCB viewer", () => {
      render(<ProcessControlBlockSimulator />);
      expect(screen.getByText(/Process Control Blocks \(PCB\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Kernel Memory \(PCBs\)/i)).toBeInTheDocument();
      expect(screen.getByTitle("Next Step")).toBeInTheDocument();
    });
  });

  describe("Episode 5: Producer-Consumer Simulator", () => {
    it("mounts safely with OSConcurrencyShell and scenario switcher", () => {
      render(<ProducerConsumerSimulator />);
      expect(screen.getByText(/Shared Bounded Buffer/i)).toBeInTheDocument();
      expect(screen.getByText("Producer Thread")).toBeInTheDocument();
      expect(screen.getByText("Consumer Thread")).toBeInTheDocument();

      // Switch scenario tab
      const scenarioBTab = screen.getByRole("tab", { name: "Scenario B" });
      fireEvent.click(scenarioBTab);
      expect(scenarioBTab).toBeInTheDocument();
    });
  });

  describe("Episode 6: Printer Spooler Simulator", () => {
    it("mounts safely with OSConcurrencyShell and spooler slots", () => {
      render(<PrinterSpoolerSimulator />);
      expect(screen.getByText(/Printer Spooler Directory \(Shared Disk Slots\)/i)).toBeInTheDocument();
      expect(screen.getByText(/next_free_slot \(IN\) =/i)).toBeInTheDocument();
      expect(screen.getByText("Process A")).toBeInTheDocument();
      expect(screen.getByText("Process B")).toBeInTheDocument();
    });
  });

  describe("Episode 7: Lock Variables & Hardware TSL Simulator", () => {
    it("mounts safely with OSConcurrencyShell and lock widget", () => {
      render(<LockVariablesSimulator />);
      expect(screen.getByText(/Shared Memory Lock Variable/i)).toBeInTheDocument();
      expect(screen.getByText(/Process A/i)).toBeInTheDocument();
      expect(screen.getByText(/Process B/i)).toBeInTheDocument();

      // Switch to TSL Fix scenario tab
      const tslTab = screen.getByRole("tab", { name: "TSL Fix" });
      fireEvent.click(tslTab);
      expect(tslTab).toBeInTheDocument();
    });
  });
});
