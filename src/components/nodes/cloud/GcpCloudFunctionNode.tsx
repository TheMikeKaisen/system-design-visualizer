import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpCloudFunctionIcon } from "../icons/CloudIcons";
export const GcpCloudFunctionNode = memo(function GcpCloudFunctionNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpCloudFunctionIcon />}
      subtitle={`${data.metadata.runtime ?? "nodejs20"} · ${data.metadata.memoryMb ?? 256}MB`} />
  );
});
