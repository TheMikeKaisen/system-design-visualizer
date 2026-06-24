"use client";

import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { useSimulationStore } from "@/lib/store/useSimulationStore";
import { commandInvoker } from "@/lib/store/useHistoryStore";
import { AddNodeCommand } from "@/lib/patterns/commands/AddNodeCommand";
import { ConnectEdgeCommand } from "@/lib/patterns/commands/ConnectEdgeCommand";
import { createNode } from "@/components/nodes/NodeFactory";
import { nanoid } from "nanoid";
import type { SystemEdge } from "@/types";

export function EmptyCanvasState() {
  const nodes = useCanvasStore((s) => s.nodes);
  const startSimulation = useSimulationStore((s) => s.start);

  if (nodes.length > 0) return null;

  const handleLoadExample = () => {
    // 1. Create nodes
    const client = createNode({ kind: "client", position: { x: 50, y: 200 } });
    const lb = createNode({ kind: "loadBalancer", position: { x: 300, y: 200 } });
    const service1 = createNode({ kind: "service", position: { x: 550, y: 100 } });
    const service2 = createNode({ kind: "service", position: { x: 550, y: 300 } });
    const db = createNode({ kind: "database", position: { x: 800, y: 200 } });

    // Rename for clarity
    service1.data.label = "Service A";
    service2.data.label = "Service B";

    commandInvoker.execute(new AddNodeCommand(client));
    commandInvoker.execute(new AddNodeCommand(lb));
    commandInvoker.execute(new AddNodeCommand(service1));
    commandInvoker.execute(new AddNodeCommand(service2));
    commandInvoker.execute(new AddNodeCommand(db));

    // 2. Create edges
    const createEdge = (source: string, target: string): SystemEdge => ({
      id: `edge-${nanoid(8)}`,
      source,
      target,
      type: "simulationEdge",
      data: {
        protocol: "HTTP",
        throughputLimit: null,
        latencyMs: 20,
        errorRate: 0,
        middleware: [],
      },
    });

    commandInvoker.execute(new ConnectEdgeCommand(createEdge(client.id, lb.id)));
    commandInvoker.execute(new ConnectEdgeCommand(createEdge(lb.id, service1.id)));
    commandInvoker.execute(new ConnectEdgeCommand(createEdge(lb.id, service2.id)));
    commandInvoker.execute(new ConnectEdgeCommand(createEdge(service1.id, db.id)));
    commandInvoker.execute(new ConnectEdgeCommand(createEdge(service2.id, db.id)));

    // 3. Set the client as the source of traffic and start simulation
    setTimeout(() => {
      useSimulationStore.getState().setConfig({ sourceNodeIds: [client.id] });
      startSimulation();
    }, 300);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-background/80 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-sm text-center max-w-sm pointer-events-auto">
        <div className="text-3xl mb-4">👆</div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Drag a component from the left panel
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          to get started building your architecture.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Or</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <button
          onClick={handleLoadExample}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          Load example diagram
        </button>
      </div>
    </div>
  );
}
