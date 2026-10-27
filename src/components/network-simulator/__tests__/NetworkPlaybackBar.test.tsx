import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NetworkPlaybackBar } from "../NetworkPlaybackBar";

describe("NetworkPlaybackBar", () => {
  it("renders core playback buttons (previous, play, next)", () => {
    const handlePlayPause = vi.fn();
    const handleNext = vi.fn();
    const handlePrev = vi.fn();
    const handleReset = vi.fn();
    const handleSpeedChange = vi.fn();

    render(
      <NetworkPlaybackBar
        currentStepIndex={0}
        totalSteps={6}
        isPlaying={false}
        playbackSpeed={1.0}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
      />
    );

    // Play, Next, Prev buttons exist
    const playBtn = screen.getByRole("button", { name: /Play simulation/i });
    const nextBtn = screen.getByRole("button", { name: /Next step/i });
    const prevBtn = screen.getByRole("button", { name: /Previous step/i });

    expect(playBtn).toBeDefined();
    expect(nextBtn).toBeDefined();
    expect(prevBtn).toBeDefined();

    // At step 0, prev is disabled
    expect(prevBtn).toBeDisabled();

    // Clicking next fires onNext
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalled();

    // Clicking play fires onPlayPause
    fireEvent.click(playBtn);
    expect(handlePlayPause).toHaveBeenCalled();
  });

  it("updates play button to pause when isPlaying is true", () => {
    const handlePlayPause = vi.fn();

    render(
      <NetworkPlaybackBar
        currentStepIndex={2}
        totalSteps={6}
        isPlaying={true}
        playbackSpeed={1.0}
        onPlayPause={handlePlayPause}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onReset={vi.fn()}
        onSpeedChange={vi.fn()}
      />
    );

    const pauseBtn = screen.getByRole("button", { name: /Pause simulation/i });
    expect(pauseBtn).toBeDefined();

    fireEvent.click(pauseBtn);
    expect(handlePlayPause).toHaveBeenCalled();
  });

  it("disables next button at the last step", () => {
    render(
      <NetworkPlaybackBar
        currentStepIndex={5}
        totalSteps={6}
        isPlaying={false}
        playbackSpeed={1.0}
        onPlayPause={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onReset={vi.fn()}
        onSpeedChange={vi.fn()}
      />
    );

    const nextBtn = screen.getByRole("button", { name: /Next step/i });
    expect(nextBtn).toBeDisabled();
  });
});
