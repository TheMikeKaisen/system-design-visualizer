import { SystemNodeData } from "@/types";
import { EducationalNodeBase } from "../EducationalNodeBase";
import { Handle, Position } from "@xyflow/react";

interface JavaClassLoaderNodeProps {
  id: string;
  data: SystemNodeData;
  selected?: boolean;
}

export function JavaClassLoaderNode({ id, data, selected }: JavaClassLoaderNodeProps) {
  return (
    <EducationalNodeBase
      id={id}
      data={data}
      selected={selected}
      colorClass="bg-purple-600 shadow-[0_2px_10px_rgba(147,51,234,0.3)]"
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
          <polyline points="7.5 19.79 7.5 14.6 3 12"/>
          <polyline points="21 12 16.5 14.6 16.5 19.79"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      }
      hideDefaultHandles={true}
    >
      {/* Top handles */}
      {(id === 'node-application' || id === 'node-platform') && (
        <>
          <Handle type="target" position={Position.Top} id="top-target" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
          <Handle type="source" position={Position.Top} id="top-source" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
        </>
      )}

      {/* Bottom handles */}
      {(id === 'node-platform' || id === 'node-bootstrap') && (
        <>
          <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
          <Handle type="source" position={Position.Bottom} id="bottom-source" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" />
        </>
      )}

      {/* Side handles for receiving files and sending to JVM */}
      {id === 'node-application' && (
        <>
          <Handle type="target" position={Position.Left} id="left-target" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" style={{ top: 28 }} />
          <Handle type="source" position={Position.Right} id="right-source" className="w-2 h-2 rounded-full border-2 border-background bg-muted-foreground" style={{ top: 28 }} />
        </>
      )}
    </EducationalNodeBase>
  );
}
