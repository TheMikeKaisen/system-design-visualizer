import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeroRuntimeSandbox, highlightCodeTokens } from "../HeroRuntimeSandbox";

describe("HeroRuntimeSandbox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders default JavaScript tab with initial Call Stack state", () => {
    render(<HeroRuntimeSandbox />);

    expect(screen.getByRole("region", { name: /Interactive Multi-Discipline System Simulator Sandbox/i })).toBeDefined();
    expect(screen.getByText("counter.js")).toBeDefined();
    expect(screen.getAllByText(/Call Stack/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Engine idle — Stack is empty/i)).toBeDefined();
  });

  it("switches to Operating Systems tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const osTab = screen.getByRole("tab", { name: /Operating Systems/i });
    fireEvent.click(osTab);

    expect(screen.getByText("scheduler.c")).toBeDefined();
    expect(screen.getByText(/CPU Core/i)).toBeDefined();
    expect(screen.getByText(/Ready Queue/i)).toBeDefined();
    expect(screen.getByText("P1")).toBeDefined();
  });

  it("switches to Java & JVM tab when clicked", () => {
    render(<HeroRuntimeSandbox />);

    const javaTab = screen.getByRole("tab", { name: /Java & JVM/i });
    fireEvent.click(javaTab);

    expect(screen.getByText("Main.java")).toBeDefined();
    expect(screen.getByText(/JVM Thread Stack/i)).toBeDefined();
    expect(screen.getByText(/Eden Generation/i)).toBeDefined();
  });

  it("advances and steps back through scenario steps manually", () => {
    render(<HeroRuntimeSandbox />);

    const nextBtn = screen.getByTitle("Next step");
    const prevBtn = screen.getByTitle("Previous step");

    expect(prevBtn).toHaveProperty("disabled", true);

    fireEvent.click(nextBtn);
    expect(screen.getByText("Declaration")).toBeDefined();
    expect(prevBtn).toHaveProperty("disabled", false);

    fireEvent.click(prevBtn);
    expect(screen.getByText("Engine Init")).toBeDefined();
    expect(prevBtn).toHaveProperty("disabled", true);
  });

  it("resets step index when reset button is clicked", () => {
    render(<HeroRuntimeSandbox />);

    const nextBtn = screen.getByTitle("Next step");
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);

    const resetBtn = screen.getByTitle("Reset simulation to step 1");
    fireEvent.click(resetBtn);

    expect(screen.getByText("Engine Init")).toBeDefined();
  });

  it("toggles pause and play mode", () => {
    render(<HeroRuntimeSandbox />);

    // Starts in auto-running mode, so button offers Pause
    const pauseBtn = screen.getByTitle("Pause simulation");
    fireEvent.click(pauseBtn);

    // Now paused, button offers Play
    const playBtn = screen.getByTitle("Play simulation");
    expect(playBtn).toBeDefined();

    fireEvent.click(playBtn);
    expect(screen.getByTitle("Pause simulation")).toBeDefined();
  });

  it("completes subject visualization then advances to next discipline", () => {
    render(<HeroRuntimeSandbox />);

    expect(screen.getByText("counter.js")).toBeDefined();

    // Step through the chained timer cycles to complete JS scenario and transition to OS
    for (let i = 0; i < 7; i++) {
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    }

    expect(screen.getByText("scheduler.c")).toBeDefined();

    // Step through OS scenario and transition to Java
    for (let i = 0; i < 7; i++) {
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    }

    expect(screen.getByText("Main.java")).toBeDefined();
  });

  it("beautifies code with syntax highlighting tokens and glowing active line styling", () => {
    const { container } = render(<HeroRuntimeSandbox />);

    // Verify keywords in purple
    const functionKeywords = screen.getAllByText("function");
    expect(functionKeywords.length).toBeGreaterThanOrEqual(1);
    expect(functionKeywords[0].className).toContain("text-purple-400");

    // Verify function name in sky/blue
    const functionNames = screen.getAllByText("makeCounter");
    expect(functionNames.length).toBeGreaterThanOrEqual(1);
    expect(functionNames[0].className).toContain("text-sky-300");

    // Verify comment in muted zinc italic
    const comment = screen.getByText("// -> returns 1");
    expect(comment.className).toContain("text-zinc-500");
    expect(comment.className).toContain("italic");

    // Verify number in amber
    const numberZero = screen.getByText("0");
    expect(numberZero.className).toContain("text-amber-400");

    // Advance to step 1 (declaration) where line 1 is active
    const nextBtn = screen.getByTitle("Next step");
    fireEvent.click(nextBtn);

    // Verify active line has glowing accent bar styling
    const activeLineContainer = container.querySelector(".border-amber-400");
    expect(activeLineContainer).not.toBeNull();
  });

  it("tokenizes across Operating Systems and Java tabs accurately", () => {
    render(<HeroRuntimeSandbox />);

    // Switch to Operating Systems
    const osTab = screen.getByRole("tab", { name: /Operating Systems/i });
    fireEvent.click(osTab);

    // Verify OS keywords and types
    const voidKeywords = screen.getAllByText("void");
    expect(voidKeywords[0].className).toContain("text-purple-400");
    const processTypes = screen.getAllByText("Process");
    expect(processTypes[0].className).toContain("text-teal-300");
    const scheduleFn = screen.getAllByText("schedule");
    expect(scheduleFn[0].className).toContain("text-sky-300");

    // Switch to Java
    const javaTab = screen.getByRole("tab", { name: /Java & JVM/i });
    fireEvent.click(javaTab);

    // Verify Java keywords, types, and string literal
    const classKeywords = screen.getAllByText("class");
    expect(classKeywords[0].className).toContain("text-purple-400");
    const userTypes = screen.getAllByText("User");
    expect(userTypes[0].className).toContain("text-teal-300");
    const stringLiteral = screen.getByText('"Alice"');
    expect(stringLiteral.className).toContain("text-emerald-400");
  });

  it("safely tokenizes strings with embedded slashes without breaking into comments", () => {
    const { container } = render(
      <div>{highlightCodeTokens('const api = "https://example.com/api";', "test-url")}</div>
    );

    const stringToken = screen.getByText('"https://example.com/api"');
    expect(stringToken.className).toContain("text-emerald-400");
    // Ensure no comment span was mistakenly created
    expect(container.querySelector(".text-zinc-500")).toBeNull();
  });

  it("tokenizes hexadecimal memory addresses and multi-character operators", () => {
    render(
      <div>{highlightCodeTokens("void* ptr = 0x0040; count += 1;", "test-hex")}</div>
    );

    const hexToken = screen.getByText("0x0040");
    expect(hexToken.className).toContain("text-amber-400");

    const opToken = screen.getByText("+=");
    expect(opToken.className).toContain("text-zinc-400");
  });
});

