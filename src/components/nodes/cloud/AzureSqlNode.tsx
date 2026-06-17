import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AzureSqlIcon } from "../icons/CloudIcons";
export const AzureSqlNode = memo(function AzureSqlNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="azure" icon={<AzureSqlIcon />}
      subtitle={`${data.metadata.tier ?? "GeneralPurpose"}`} />
  );
});
