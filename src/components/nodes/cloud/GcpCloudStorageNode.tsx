import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpCloudStorageIcon } from "../icons/CloudIcons";
export const GcpCloudStorageNode = memo(function GcpCloudStorageNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpCloudStorageIcon />}
      subtitle={`${data.metadata.storageClass ?? "STANDARD"}`} />
  );
});
