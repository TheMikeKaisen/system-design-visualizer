import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsSqsIcon } from "../icons/CloudIcons";
export const AwsSqsNode = memo(function AwsSqsNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsSqsIcon />}
      subtitle={`${data.metadata.type ?? "Standard"} queue`} />
  );
});
