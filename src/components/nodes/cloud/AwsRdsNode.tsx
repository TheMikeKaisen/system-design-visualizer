import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsRdsIcon } from "../icons/CloudIcons";
export const AwsRdsNode = memo(function AwsRdsNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsRdsIcon />}
      subtitle={`${data.metadata.engine ?? "postgres"} · ${data.metadata.instanceClass ?? "db.t3.medium"}`} />
  );
});
