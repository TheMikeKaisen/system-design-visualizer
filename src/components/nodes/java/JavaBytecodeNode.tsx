import { NodeProps } from "@xyflow/react";
import { SystemNode } from "@/types";
import { EducationalNodeBase } from "../EducationalNodeBase";

export function JavaBytecodeNode({ id, data, selected }: NodeProps<SystemNode>) {
  return (
    <EducationalNodeBase 
      id={id} 
      data={data} 
      selected={selected}
      colorClass="bg-green-500"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
      }
    />
  );
}
