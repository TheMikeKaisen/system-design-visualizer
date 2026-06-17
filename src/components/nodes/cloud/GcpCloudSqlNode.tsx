import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { GcpCloudSqlIcon } from "../icons/CloudIcons";
export const GcpCloudSqlNode = memo(function GcpCloudSqlNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="gcp" icon={<GcpCloudSqlIcon />}
      subtitle={`${data.metadata.engine ?? "postgres14"} · ${data.metadata.tier ?? "db-f1-micro"}`} />
  );
});
