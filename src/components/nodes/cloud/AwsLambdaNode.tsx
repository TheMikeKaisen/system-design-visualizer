import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsLambdaIcon } from "../icons/CloudIcons";
export const AwsLambdaNode = memo(function AwsLambdaNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsLambdaIcon />}
      subtitle={`${data.metadata.runtime ?? "node20.x"} · ${data.metadata.memoryMb ?? 512}MB`} />
  );
});
