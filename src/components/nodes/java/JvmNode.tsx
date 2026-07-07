import { useState, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";
import { EducationalNodeBase } from "../EducationalNodeBase";
import { useScenarioStore } from "@/lib/store/useScenarioStore";

export function JvmNode({ id, data, selected }: NodeProps<SystemNode>) {
  const store = useScenarioStore();
  const status = store.nodeStatuses[id] || "idle";
  
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    if (status === "processing") {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 1000);
      const t2 = setTimeout(() => setPhase(2), 2300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setPhase(-1);
    }
  }, [status]);

  return (
    <EducationalNodeBase 
      id={id} 
      data={data} 
      selected={selected}
      colorClass="bg-purple-500"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
      }
    >
      {phase >= 0 && (
        <div className="mt-3 border-t border-border/40 pt-2 flex flex-col gap-1 w-full text-[10px] font-mono text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">
          <div className={`flex items-center gap-2 ${phase >= 0 ? "text-primary font-bold transition-colors duration-300" : "opacity-30"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            Loading...
          </div>
          <div className={`flex items-center gap-2 ${phase >= 1 ? "text-primary font-bold transition-colors duration-300" : "opacity-30"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            Verifying
          </div>
          <div className={`flex items-center gap-2 ${phase >= 2 ? "text-primary font-bold transition-colors duration-300" : "opacity-30"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            JIT Compile
          </div>
        </div>
      )}
    </EducationalNodeBase>
  );
}
