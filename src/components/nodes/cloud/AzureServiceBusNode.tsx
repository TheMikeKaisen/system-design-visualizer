import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureServiceBusIcon } from "../icons/CloudIcons";
export const AzureServiceBusNode = memo(function AzureServiceBusNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureServiceBusIcon />}
      subtitle={`${data.metadata.tier ?? "Standard"}`} />
  );
});
