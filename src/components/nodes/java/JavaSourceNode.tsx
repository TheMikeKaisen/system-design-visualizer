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
    />
  );
}
