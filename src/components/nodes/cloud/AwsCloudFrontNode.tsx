import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsCloudFrontIcon } from "../icons/CloudIcons";
export const AwsCloudFrontNode = memo(function AwsCloudFrontNode({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsCloudFrontIcon />}
      subtitle={`${data.metadata.priceClass ?? "PriceClass_100"}`} />
  );
});
