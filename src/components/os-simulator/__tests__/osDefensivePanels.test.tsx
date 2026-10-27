import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CPUBlock } from "../CPUBlock";
import { ZoneContainer } from "../ZoneContainer";
import { SchedulerBadge } from "../SchedulerBadge";
import { OSToast } from "../OSToast";
import { MemoryGauge } from "../MemoryGauge";
import { PCBViewer } from "../PCBViewer";
import type { OSProcess } from "@/lib/os-simulator/engine";

describe("OS Visualizer Panels Defensive Rendering", () => {
  const dummyProcess: OSProcess = {
    id: "p1",
    pid: "P1",
    name: "Chrome Browser",
    color: "#0ea5e9",
    state: "running",
    memoryMB: 512,
    cpuBurstMs: 25,
    pcb: {
      programCounter: "0x00400000",
      registers: { eax: "10", ebx: "20", ecx: "0" },
      memoryLimits: { base: "0x100000", limit: "0x1FFFFF" },
      openFiles: ["index.html", "data.json"],
      highlightFields: ["programCounter"],
    },
  };

  describe("CPUBlock", () => {
    it("renders idle state safely when process is null", () => {
      render(<CPUBlock process={null} />);
      expect(screen.getByText("IDLE")).toBeInTheDocument();
      expect(screen.getByText("Waiting for process...")).toBeInTheDocument();
    });

    it("renders running process with metrics and composite key dots", () => {
      render(<CPUBlock process={dummyProcess} />);
      expect(screen.getByText("Chrome Browser")).toBeInTheDocument();
      expect(screen.getByText(/P1 · 512 MB · Burst: 25ms/i)).toBeInTheDocument();
    });
  });

  describe("ZoneContainer", () => {
    it("renders empty state cleanly with dashed styling", () => {
      render(<ZoneContainer title="Ready Queue" processes={[]} />);
      expect(screen.getByText(/Ready Queue/i)).toBeInTheDocument();
      expect(screen.getByText(/No processes/i)).toBeInTheDocument();
    });

    it("renders list of processes and count badge", () => {
      render(<ZoneContainer title="Ready Queue" processes={[dummyProcess]} />);
      expect(screen.getByText("Chrome Browser")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("SchedulerBadge", () => {
    it("renders inactive scheduler badge safely", () => {
      render(<SchedulerBadge label="Short-Term Scheduler" />);
      expect(screen.getByText("Short-Term Scheduler")).toBeInTheDocument();
    });

    it("renders active scheduler badge with action text", () => {
      render(
        <SchedulerBadge
          label="Short-Term Scheduler"
          event={{
            type: "short_term",
            action: "Dispatched to CPU",
            isActive: true,
          }}
        />
      );
      expect(screen.getByText("Dispatched to CPU")).toBeInTheDocument();
    });
  });

  describe("OSToast", () => {
    it("renders nothing when message is null", () => {
      const { container } = render(<OSToast message={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders active toast message with canonical styling", () => {
      render(<OSToast message="Process P1 dispatched to CPU" />);
      expect(screen.getByText("Process P1 dispatched to CPU")).toBeInTheDocument();
    });

    it("renders timer interrupt toast with clock icon", () => {
      render(<OSToast message="Timer Interrupt occurred: Quantum expired" />);
      expect(screen.getByText("Timer Interrupt occurred: Quantum expired")).toBeInTheDocument();
      expect(screen.getByText("⏰")).toBeInTheDocument();
    });
  });

  describe("MemoryGauge", () => {
    it("renders memory usage percentage and MB breakdown", () => {
      render(
        <MemoryGauge
          memory={{ totalMB: 1024, usedMB: 512, usedPct: 50 }}
          processes={[
            { name: "Chrome", color: "#0ea5e9", memoryMB: 512, state: "running" },
          ]}
        />
      );
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("512 / 1024 MB")).toBeInTheDocument();
      expect(screen.getByText("Chrome")).toBeInTheDocument();
    });
  });

  describe("PCBViewer", () => {
    it("handles process without PCB gracefully", () => {
      const bareProcess: OSProcess = {
        id: "bare",
        pid: "P99",
        name: "Bare Process",
        color: "#64748b",
        state: "ready",
        memoryMB: 64,
      };
      render(<PCBViewer process={bareProcess} />);
      expect(
        screen.getByText(/No Process Control Block allocated/i)
      ).toBeInTheDocument();
    });

    it("renders full stacked PCB diagram with sky styling", () => {
      render(<PCBViewer process={dummyProcess} />);
      expect(screen.getByText("Chrome Browser PCB")).toBeInTheDocument();
      expect(screen.getByText("Program Counter")).toBeInTheDocument();
      expect(screen.getByText("0x00400000")).toBeInTheDocument();
      expect(screen.getByText(/EAX: 10/i)).toBeInTheDocument();
      expect(screen.getByText(/index.html, data.json/i)).toBeInTheDocument();
    });
  });
});
