Edited CloneSchema.Quote.md-meta.xml
Edited provus_template_hierarchy.md
Edited QuoteCloneSupport.cls
Ran command: `git push origin main`
Ran command: `git push origin main`
Viewed SimulationEdge.tsx:90-112

This file (`SimulationEdge.tsx`) is a **custom Edge component** for React Flow. 

In a standard diagramming tool, edges are just dumb lines with arrows at the end. But because you are building a **System Design Visualizer** (and an active simulator), your edges need to represent actual *network connections* with physical properties.

Here is a breakdown of why this file is significant and how it powers your application:

### 1. Visualizing Network Protocols
Connections in the real world use different protocols, and this file makes that instantly obvious to the user. It looks at the edge's data (`data.protocol`) and colors the connection accordingly using the `PROTOCOL_COLORS` map. 
*   An `HTTP` request is blue.
*   A `TCP` connection to a database is green.
*   A `WebSocket` stream is orange.

### 2. Live Simulation Feedback (The Glow)
If you look at lines 40-48, this component subscribes to the `useSimulationStore` to check for active packets:
```javascript
const packets = useSimulationStore((s) => s.packets);
const hasActiveTraffic = Object.values(packets).some(...)
```
If there is a packet actively traveling across this exact edge, it renders a thick, semi-transparent path *behind* the main edge. This creates a pulsing **"glow" effect**, giving the user immediate visual feedback that data is actively flowing through this specific network pipe during a simulation.

### 3. Representing Network Degradation
If the user configures an edge to have a high error rate (to simulate a bad network), this component physically changes its appearance to represent that unreliability:
*   `opacity = errorRate > 0.3 ? 0.6 : 1`: If the error rate is high, the edge fades out slightly.
*   `strokeDasharray`: If the error rate is above 10%, it turns the solid line into a **dashed line**, indicating a broken or unstable connection.

### 4. The Edge Badge (Data Readout)
Using React Flow's `<EdgeLabelRenderer>`, it places a clean, glassmorphic badge exactly in the center of the bezier curve. 
This badge actively reads the configuration data and displays it to the user:
*   It prints the **Protocol** (`HTTP`).
*   If latency is configured, it adds it (`· 20ms`).
*   If an error rate is configured, it adds a red warning text (`· 15% err`).

### Summary
This file transforms a static diagram line into a **living network cable**. It allows your users to instantly understand the topology, health, and active traffic of their system design architecture just by glancing at the connections between their nodes.