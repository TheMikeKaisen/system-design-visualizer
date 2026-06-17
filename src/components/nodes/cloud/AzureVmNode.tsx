import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureVmIcon } from "../icons/CloudIcons";
export const AzureVmNode = memo(function AzureVmNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureVmIcon />}
      subtitle={`${data.metadata.size ?? "Standard_B2s"}`} />
  );
});
