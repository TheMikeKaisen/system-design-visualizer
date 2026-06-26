"use client";

import { useState, useCallback } from "react";
import type { SystemNode } from "@/types";
import { getCloudProvider } from "@/types";
import { Cpu } from "lucide-react";

import { CloudMetadataPanel } from "./CloudMetadataPanel";

import { commandInvoker } from "@/lib/store/useHistoryStore";
import { UpdateNodeDataCommand } from "@/lib/patterns/commands/UpdateNodeDataCommand";

export function NodeInspector({ node }: { node: SystemNode }) {
  const [labelDraft, setLabelDraft] = useState(node.data.label);
  const provider = getCloudProvider(node.data.kind);

  const commitLabel = useCallback(() => {
    const trimmed = labelDraft.trim();
    if (!trimmed) { setLabelDraft(node.data.label); return; }
    if (trimmed !== node.data.label) {
      commandInvoker.execute(
        new UpdateNodeDataCommand(node.id, { label: node.data.label }, { label: trimmed })
      );
    }
  }, [labelDraft, node.data.label, node.id]);

  const loadPct   = Math.round(node.data.load * 100);
  const loadColor =
    loadPct < 50 ? "text-green-600 dark:text-green-400"
    : loadPct < 80 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  // Provider accent color for the label underline
  const accentColor =
    provider === "aws"   ? "#FF9900"
    : provider === "gcp" ? "#4285F4"
    : provider === "azure"? "#0078D4"
    : undefined;

  return (
    <div className="flex flex-col">
      {/* Identity */}
      <div className="px-4 pt-5 pb-4 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {node.data.kind}
          </p>
        </div>
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === "Enter" && commitLabel()}
          className="w-full text-lg font-semibold bg-transparent border-0 border-b-2 pb-1
                     text-foreground focus:outline-none transition-colors hover:border-white/20 focus:border-white/40"
          style={{
            borderColor: accentColor ?? "rgba(255, 255, 255, 0.1)",
          }}
        />
      </div>
      <CloudMetadataPanel node={node} />
    </div>
  );
}