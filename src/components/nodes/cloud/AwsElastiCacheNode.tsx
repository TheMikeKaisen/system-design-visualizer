import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsElastiCacheIcon } from "../icons/CloudIcons";
export const AwsElastiCacheNode = memo(function AwsElastiCacheNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsElastiCacheIcon />}
      subtitle={`${data.metadata.engine ?? "redis"} · ${data.metadata.nodeType ?? "cache.t3.micro"}`} />
  );
});
