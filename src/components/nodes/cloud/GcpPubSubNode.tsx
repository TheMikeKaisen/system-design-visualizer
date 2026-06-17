import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpPubSubIcon } from "../icons/CloudIcons";
export const GcpPubSubNode = memo(function GcpPubSubNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpPubSubIcon />}
      subtitle={`${data.metadata.subscriptions ?? 0} subscriptions`} />
  );
});
