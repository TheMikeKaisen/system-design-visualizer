import { useScenarioStore } from "@/lib/store/useScenarioStore";

interface ScenarioExperimentPanelProps {
  onClose: () => void;
}

export function ScenarioExperimentPanel({ onClose }: ScenarioExperimentPanelProps) {
  const store = useScenarioStore();

  const experiments = [
    { id: "syntax-error", label: "Introduce Syntax Error", description: "See what happens when the compiler catches invalid code." },
    { id: "disable-jit", label: "Disable JIT Compiler", description: "Force the JVM to interpret bytecode line-by-line without optimization." }
  ];

  return (
    <div className="w-80 bg-background border border-border/60 shadow-2xl rounded-xl overflow-hidden flex flex-col pointer-events-auto">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-muted/20">
        <h3 className="font-semibold text-sm">Experiments</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="p-2">
        {experiments.map(exp => (
          <label 
            key={exp.id} 
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <input 
              type="checkbox" 
              checked={store.activeExperiments.includes(exp.id)}
              onChange={() => store.toggleExperiment(exp.id)}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-foreground">{exp.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{exp.description}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="px-4 py-3 bg-primary/5 border-t border-border/40 text-[11px] text-muted-foreground">
        Enabling an experiment will restart the simulation.
      </div>
    </div>
  );
}
