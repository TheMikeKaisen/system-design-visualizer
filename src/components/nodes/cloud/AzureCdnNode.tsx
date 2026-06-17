import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureCdnIcon } from "../icons/CloudIcons";
export const AzureCdnNode = memo(function AzureCdnNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureCdnIcon />}
      subtitle={`${data.metadata.sku ?? "Standard_Microsoft"}`} />
  );
});
