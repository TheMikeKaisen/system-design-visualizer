import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureBlobIcon } from "../icons/CloudIcons";
export const AzureBlobStorageNode = memo(function AzureBlobStorageNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureBlobIcon />}
      subtitle={`${data.metadata.accessTier ?? "Hot"} tier`} />
  );
});
