import { describe, it, expect } from "vitest";
import { createNode } from "../NodeFactory";

describe("NodeFactory — cloud nodes", () => {
  const cloudKinds = [
    "awsEc2", "awsRds", "awsElastiCache", "awsCloudFront", "awsLambda", "awsSqs",
    "gcpCloudRun", "gcpCloudSql", "gcpCloudStorage", "gcpPubSub", "gcpCloudCdn", "gcpCloudFunction",
    "azureVm", "azureSql", "azureBlobStorage", "azureServiceBus", "azureCdn", "azureFunction",
    "apiGateway",
  ] as const;

  cloudKinds.forEach((kind) => {
    it(`creates a valid ${kind} node`, () => {
      const node = createNode({ kind });
      expect(node.id).toMatch(/^[a-z0-9]+-\d+$/);
      expect(node.type).toBe(kind);
      expect(node.data.kind).toBe(kind);
      expect(node.data.label.length).toBeGreaterThan(0);
      expect(node.data.securityPolicies).toEqual([]);
    });
  });

  it("apiGateway node has empty middlewareChain by default", () => {
    const node = createNode({ kind: "apiGateway" });
    expect(node.data.metadata.middlewareChain).toBe("[]");
  });

  it("awsLambda node has runtime in metadata", () => {
    const node = createNode({ kind: "awsLambda" });
    expect(node.data.metadata.runtime).toBeDefined();
  });

  it("different providers get different ID prefixes", () => {
    const ec2  = createNode({ kind: "awsEc2" });
    const run  = createNode({ kind: "gcpCloudRun" });
    const vm   = createNode({ kind: "azureVm" });
    expect(ec2.id).toMatch(/^ec2-/);
    expect(run.id).toMatch(/^run-/);
    expect(vm.id).toMatch(/^avm-/);
  });
});
