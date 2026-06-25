"use client";

import { useState, useCallback } from "react";
import type { SystemNode } from "@/types";
import { getCloudProvider } from "@/types";

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
      <div className="px-4 pt-4 pb-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          {node.data.kind}
        </p>
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => e.key === "Enter" && commitLabel()}
          className="w-full text-sm font-medium bg-transparent border-0 border-b pb-1
                     text-foreground focus:outline-none transition-colors"
          style={{
            borderColor:       accentColor ?? "var(--color-border-tertiary)",
            "--tw-border-opacity": 1,
          } as React.CSSProperties}
        />
      </div>
      <CloudMetadataPanel node={node} />
    </div>
  );
}