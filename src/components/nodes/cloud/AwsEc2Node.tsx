"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import type { SystemNode } from "@/types";
import { CloudNodeBase } from "./CloudNodeBase";
import { AwsEc2Icon } from "../icons/CloudIcons";

export const AwsEc2Node = memo(function AwsEc2Node({ data, selected }: NodeProps<SystemNode>) {
  return (
    <CloudNodeBase data={data} selected={selected} provider="aws" icon={<AwsEc2Icon />}
      subtitle={data.metadata.instanceType as string ?? "t3.medium"} />
  );
});
