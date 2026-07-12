import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";
import { EducationalNodeBase } from "../EducationalNodeBase";

export function JavaSourceNode({ id, data, selected }: NodeProps<SystemNode>) {
  return (
    <EducationalNodeBase 
      id={id} 
      data={data} 
      selected={selected}
      colorClass="bg-blue-500"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
      }
    >
      {data.educational?.notes?.codePreview && (
        <div className="mt-3 bg-[#1e1e1e] rounded border border-border/50 p-3 overflow-x-auto shadow-inner text-xs font-mono min-w-[280px]">
          <div className="text-[10px] text-muted-foreground/60 mb-2 font-sans font-medium">{data.educational.notes.codeTitle || 'Source Code'}</div>
          <pre className="text-gray-300 m-0">
            <code>
              {/* Extremely simple pseudo-syntax highlighting for Java keywords */}
              {data.educational.notes.codePreview.split('\n').map((line, i) => {
                let highlightedLine = line.replace(/(".*?")/g, '___STR___$1___STR___');
                highlightedLine = highlightedLine
                  .replace(/\b(public|class|static|final|void)\b/g, '<span class="text-blue-400">$1</span>')
                  .replace(/\b(int|String)\b/g, '<span class="text-emerald-400">$1</span>')
                  .replace(/___STR___(.*?)___STR___/g, '<span class="text-amber-400">$1</span>');
                
                return (
                  <div key={i} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                );
              })}
            </code>
          </pre>
        </div>
      )}
    </EducationalNodeBase>
  );
}
