import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpCloudRunIcon } from "../icons/CloudIcons";
export const GcpCloudRunNode = memo(function GcpCloudRunNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpCloudRunIcon />}
      subtitle={`${data.metadata.region ?? "us-central1"}`} />
  );
});
