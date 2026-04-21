# What is happening inside the Zustand Store?
*(An explanation from 0 to 100, explained simply!)*

Imagine your web browser is a really busy kitchen. You have:
- **React Flow** (The Waiter): Taking orders, moving plates around (dragging nodes on the canvas).
- **PixiJS** (The Chef): Cooking the food and making it look spectacular at lightning speed (drawing 60 frames per second animations).
- **The Toolbar** (The Menu): Where users decide what they want to add to the kitchen.

If the Waiter, the Chef, and the Menu are constantly yelling at each other trying to figure out where a plate is, the kitchen will crash. It’s too chaotic!

To solve this, we hire a **Kitchen Manager** with a giant clipboard. Everyone reports to the manager, and everyone reads from the manager's clipboard. 

That Kitchen Manager with the giant clipboard? **That is Zustand.**

---

## 1. What is Zustand?
"Zustand" is a German word for "State". In coding, a "Store" is literally just a Javascript object that lives in memory. Instead of passing data between 50 different components (called "prop drilling"), you put your data in the Zustand Store. Any component that needs the data can just reach directly into the store and grab it.

*Why not just use React's built-in `useState`?*
Because `useState` stays locked inside the component where it was created. If React Flow has the data, PixiJS can't easily see it without massive performance issues. Zustand lives **outside** of the React components, so *anyone* can see it—even non-React code like our web workers or PixiJS ticker loops!

---

## 2. What is Immer?
Normally, in React and Zustand, you are not allowed to directly change your data. Instead of saying "change the plate to blue," you have to say "make a complete copy of the kitchen, but in the new kitchen, the plate is blue." This is called **immutability**. It prevents nasty bugs but is really annoying to write.

**Immer** is a helper library (middleware) that wraps around Zustand. 
It says: "Hey, go ahead and write your code like you are changing the data directly! I will secretly make the safe copies for you behind the scenes."

**Without Immer:**
```typescript
setNodePosition: (id, x, y) => set((state) => ({
    ...state,
    nodes: state.nodes.map(n => n.id === id ? { ...n, position: { x, y } } : n)
}))
```

**With Immer (How it looks in `useCanvasStore.ts`):**
```typescript
setNodePosition: (id, x, y) => set((state) => {
    const node = state.nodes.find(n => n.id === id);
    if (node) node.position = { x, y }; // We just change it directly! Immer does the math.
})
```

---

## 3. What is `subscribeWithSelector`?
Remember PixiJS (The Chef) who works really, really fast? He checks the clipboard 60 times a second to see where things have moved. 

If we use standard React rules, every time the Chef checks the clipboard, React might try to "re-render" the entire kitchen. That would freeze the website.

`subscribeWithSelector` is a special superpower we gave Zustand. It allows PixiJS to "subscribe" to a very specific piece of the clipboard (like just the `viewport`) **without triggering React**. PixiJS gets the data instantly, and React stays completely asleep. This is the secret to getting a smooth 60 Frames Per Second!

---

## 4. Let's look inside `useCanvasStore.ts`
The store is divided into three main sections:

### Part A: The State (The Clipboard itself)
These are the variables it remembers:
- `nodes`: Every load balancer, service, and database on the screen.
- `edges`: The connecting lines between them.
- `viewport`: The current X, Y, and Zoom level of the camera.
- `selectedNodeIds`: Which node the user is currently clicking on.

### Part B: The Actions (How to write on the clipboard)
These are the only approved ways to change the data:
- `onNodesChange` / `onEdgesChange`: React Flow calls these when you drag a node or attach a wire.
- Imperative mutations (`addNode`, `removeNode`, `updateNodeData`): These are for our custom buttons (like if you click a "Delete" button or use the Undo/Redo commands).
- `setViewport`: When the user scrolls their mouse wheel, React Flow tells PixiJS to update its camera so the animations don't drift away.

### Part C: The Selectors (How to read the clipboard safely)
At the very bottom of the file you see:
```typescript
export const selectViewport = (s: CanvasStore) => s.viewport;
```
If a component only cares about the viewport, it uses this selector. This ensures that if a **node** changes, the component looking at the **viewport** won't accidentally re-render.

---

## Why this is brilliant for the future of the project
1. **Real-time Collaboration:** When Phase 5 arrives, multiple users will be moving things around at the same time. Because all nodes and edges are kept neatly in one single Zustand store, we just connect this one store to our multi-player server (Yjs). We don't have to rewire the whole app!
2. **Undo/Redo:** Since all changes go through the "Actions", we can easily build a "history" of actions. If someone hits "Undo", we just tell the store to reverse the last action.
3. **No spaghetti code:** If PixiJS, React Flow, and your Menus all had their own separate memory, keeping them all in sync would be a nightmare. Thanks to Zustand, they all report to the same manager.
