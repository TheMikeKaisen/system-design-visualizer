import { EducationalNodeBase } from "../EducationalNodeBase";
import { SystemNodeData } from "@/types";

interface JavaMethodAreaNodeProps {
  id: string;
  data: SystemNodeData;
  selected?: boolean;
}

export function JavaMethodAreaNode({ id, data, selected }: JavaMethodAreaNodeProps) {
  return (
    <EducationalNodeBase
      id={id}
      data={data}
      selected={selected}
      colorClass="bg-purple-500"
      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
    >
      <div className="mt-3 p-3 bg-card border border-border/50 rounded-lg flex flex-col gap-3 min-w-[340px]">
        {data.experiment === 'ep5-method-area' ? (
          <>
            {/* 1. Loaded Classes */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Loaded Classes</div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Robot</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Factory</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Object</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> String</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> System</span>
              </div>
            </div>

            {/* Robot.class */}
            <div className="bg-muted/30 rounded p-2 border border-border/40 flex flex-col gap-2">
              <div className="text-xs font-bold text-purple-400 border-b border-white/10 pb-1">Robot.class</div>
              
              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Class Information</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="text-purple-400">Robot</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Superclass:</span> <span className="text-emerald-400">Object</span></div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Static Fields</div>
                <div className="bg-black/40 p-1.5 rounded border border-white/5">
                  robotCount = <span className="text-amber-400">0</span>;
                </div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Runtime Constant Pool</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                    <span className="text-muted-foreground">String Ref</span>
                    <span className="text-amber-400">"Hello"</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                    <span className="text-muted-foreground">Method Ref</span>
                    <span className="text-emerald-400">println()</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Methods</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">&lt;init&gt;()</span>
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">sayHello()</span>
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">chargeBattery()</span>
                </div>
              </div>
            </div>

            {/* Factory.class */}
            <div className="bg-muted/30 rounded p-2 border border-border/40 flex flex-col gap-2">
              <div className="text-xs font-bold text-purple-400 border-b border-white/10 pb-1">Factory.class</div>
              
              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Class Information</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="text-purple-400">Factory</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Superclass:</span> <span className="text-emerald-400">Object</span></div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Static Fields</div>
                <div className="bg-black/40 p-1.5 rounded border border-white/5">
                  factoryName -&gt; <span className="text-amber-400">"TechCorp"</span>
                </div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Runtime Constant Pool</div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                    <span className="text-muted-foreground">String Ref</span>
                    <span className="text-amber-400">"TechCorp"</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                    <span className="text-muted-foreground">String Ref</span>
                    <span className="text-amber-400">"Factory shutdown"</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                    <span className="text-muted-foreground">Method Ref</span>
                    <span className="text-emerald-400">println()</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono">
                <div className="text-muted-foreground mb-1 font-bold">Methods</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">&lt;init&gt;()</span>
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">createRobot()</span>
                  <span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-blue-400">shutdown()</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 1. Loaded Classes */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Loaded Classes</div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Robot</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Object</span>
                <span className="flex items-center gap-1"><span className="text-green-500">✓</span> String</span>
              </div>
            </div>

            {/* 2. Class Information */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Class Information</div>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-mono text-purple-400 font-bold">Robot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modifier:</span>
                  <span className="font-mono text-blue-400">public</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Superclass:</span>
                  <span className="font-mono text-emerald-400">Object</span>
                </div>
              </div>
            </div>

            {/* 3. Field Metadata */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Field Metadata</div>
              <div className="flex flex-col gap-1 text-[10px] font-mono text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">private</span> <span className="text-emerald-400">String</span> name;
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">private</span> <span className="text-emerald-400">int</span> batteryLevel;
                </div>
              </div>
            </div>

            {/* 4. Static Fields */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Static Fields (Allocated)</div>
              <div className="font-mono text-xs bg-black/40 p-1.5 rounded border border-white/5 flex flex-wrap">
                robotCount = <span className="text-amber-400 ml-1">0</span>;
              </div>
              <div className="font-mono text-xs bg-black/40 p-1.5 rounded border border-white/5 flex flex-wrap">
                BRAND ---&gt; <span className="text-amber-400 ml-1">[HEAP] StringPool("TechCorp")</span>;
              </div>
                          
            </div>

            {/* 4. Runtime Constant Pool */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Runtime Constant Pool</div>
              <div className="flex flex-col gap-1.5 text-[10px] font-mono">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                  <span className="text-muted-foreground min-w-[80px]">String Ref</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-amber-400">"Hello!"</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                  <span className="text-muted-foreground min-w-[80px]">String Ref</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-amber-400">"TechCorp"</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                  <span className="text-muted-foreground min-w-[80px]">Method Ref</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-emerald-400">println()</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5">
                  <span className="text-muted-foreground min-w-[80px]">Class Ref</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-purple-400">Object</span>
                </div>
              </div>
            </div>

            {/* 6. Bytecode (Method Metadata) */}
            <div className="bg-muted/30 rounded p-2 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Bytecode Methods</div>
              
              <div className="flex gap-2">
                <div className="font-mono text-[10px] bg-black/40 p-2 rounded border border-white/5">
                  <div className="text-blue-400 font-bold mb-1">&lt;init&gt;()</div>
                  
                </div>

                <div className="font-mono text-[10px] bg-black/40 p-2 rounded border border-white/5">
                  <div className="text-blue-400 font-bold mb-1">sayHello()</div>
                  
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </EducationalNodeBase>
  );
}
