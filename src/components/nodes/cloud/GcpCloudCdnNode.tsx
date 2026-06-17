import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpCloudCdnIcon } from "../icons/CloudIcons";
export const GcpCloudCdnNode = memo(function GcpCloudCdnNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpCloudCdnIcon />}
      subtitle={`${data.metadata.cacheMode ?? "CACHE_ALL_STATIC"}`} />
  );
});
