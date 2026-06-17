import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureFunctionIcon } from "../icons/CloudIcons";
export const AzureFunctionNode = memo(function AzureFunctionNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureFunctionIcon />}
      subtitle={`${data.metadata.runtime ?? "node18"} · ${data.metadata.plan ?? "Consumption"}`} />
  );
});
