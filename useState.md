- Props Vs State
    
    ## TOPIC 3: Props vs State (and why "one-way data flow" actually matters)
    
    ### PHASE A — LEARN REACT
    
    #### STEP 1: Intuition First
    
    Think of a component like a **restaurant order form**.
    
    - Some information comes **from outside** — the customer's table number, handed to the waiter by the host. The waiter (component) didn't create this information and can't change it — they just use it to do their job. This is like a component receiving **props**.
    - Some information the waiter tracks **themselves**, internally, as they work — like "how many items have I written down on this order so far." This number belongs to the waiter, changes as they work, and the waiter is the only one who updates it. This is like a component's own **state**.
    
    The critical rule: **the waiter (component) can look at the table number but never change it** — only the host (parent) can hand out a different one. But the waiter's own internal tally (state)? Only the waiter can update that, and updating it can make the waiter behave differently (e.g., decide to call for a bigger notepad).
    
    This maps directly to React's two core ideas:
    
    - **Props** = data passed **into** a component from its **parent**. Read-only from the component's own perspective.
    - **State** = data a component manages **for itself**, internally, that can change over time and causes that component to re-render when it changes.
    
    #### STEP 2: Build From Scratch
    
    **Term 1: Parent and Child components**
    
    When one component renders another component inside it, the outer one is the **parent**, the inner one is the **child**.
    
    jsx
    
    ```jsx
    function App() {                    // App is the PARENT
      return <Greeting name="Rohan" />;  // Greeting is the CHILD
    }
    
    function Greeting(props) {
      return <h1>Hello, {props.name}</h1>;
    }
    ```
    
    **Term 2: Props ("properties")**
    
    In the example above, `name="Rohan"` is a **prop** — a piece of data the parent (`App`) is handing down to the child (`Greeting`). Inside `Greeting`, this arrives as a single object called `props`: `{ name: 'Rohan' }`.
    
    **The rule that matters most: a component must NEVER modify its own props.** Props are handed down, read-only, from parent to child. If `Greeting` tried to do `props.name = 'Someone else'`, that's a bug — React explicitly does not support this and it will not work as expected.
    
    **Term 3: "One-way data flow"**
    
    This is just a name for the rule above: data only flows in **one direction** — from parent down to child, never child back up to parent directly.
    
    ```
       App (parent)
         │
         │  passes props down
         ▼
      Greeting (child)
    ```
    
    If a child needs to affect something in the parent, it can't just "reach up" and change the parent's data. Instead — and this is important — **the parent passes a function down as a prop**, and the child calls that function. The actual change still happens up in the parent; the child is just triggering it, not doing it directly. (We'll build a full example of this in Step 4.)
    
    **Term 4: State**
    
    State is data that a component owns and manages **itself**, using the `useState` we briefly used in Topics 1 and 2:
    
    jsx
    
    ```jsx
    function Counter() {
      const [count, setCount] = useState(0);
    // count = the current value (data)
    // setCount = the ONLY way to change it
      ...
    }
    ```
    
    **The rule for state: only the component that owns it can change it (using its own setter function), and changing it causes that component to re-render** (remember Topic 1 — the function runs again top to bottom).
    
    ---
    
    #### STEP 3: Visual Explanation
    
    **One-way data flow, with a child triggering a parent's state change:**
    
    ```
    ┌─────────────────────────────────────────────┐
    │  App (PARENT)                                 │
    │  const [count, setCount] = useState(0)         │
    │                                                 │
    │  passes DOWN as props:                         │
    │    - count            (data, read-only)        │
    │    - onIncrement={() => setCount(count+1)}     │ ← a FUNCTION, passed as a prop
    └───────────────────┬───────────────────────────┘
                         │  props flow DOWN only
                         ▼
    ┌─────────────────────────────────────────────┐
    │  Counter (CHILD)                               │
    │  receives props: { count, onIncrement }        │
    │                                                 │
    │  displays: count                                │
    │  button onClick={onIncrement}                   │
    │    → CALLS the function the parent gave it      │
    │    → does NOT change count directly itself      │
    └─────────────────────────────────────────────┘
    
    When button clicked:
      Child calls onIncrement()
            │
            │ (this function was DEFINED in the parent,
            │  child is just triggering it — like a
            │  waiter pressing a call-bell, not personally
            │  going and changing the host's table chart)
            ▼
      Parent's setCount() actually runs
            │
            ▼
      Parent re-renders (App function runs again)
            │
            ▼
      Parent passes DOWN a new `count` value as a prop
            │
            ▼
      Child re-renders too, showing the new count
    ```
    
    Notice: the **child never touched `count` directly**. It only ever called a function the parent handed it. The actual state change happened entirely inside the parent. Data still only ever flows **down**.
    
    ---
    
    #### STEP 4: Simple Code Example, Line by Line
    
    jsx
    
    ```jsx
    function App() {
      const [count, setCount] = useState(0);
    
      const handleIncrement = () => {
        setCount(count + 1);
      };
    
      return <Counter count={count} onIncrement={handleIncrement} />;
    }
    
    function Counter(props) {
      return (
        <div>
          <p>Count is: {props.count}</p>
          <button onClick={props.onIncrement}>Add One</button>
        </div>
      );
    }
    ```
    
    - `App` owns the state (`count`, `setCount`). This is the **only** place this state can be changed.
    - `handleIncrement` — a function defined in `App` that knows how to update `count`.
    - `<Counter count={count} onIncrement={handleIncrement} />` — App passes two props down: the current value, and a function the child can call.
    - Inside `Counter`, `props.count` is just read and displayed — never modified.
    - `props.onIncrement` is attached to the button's `onClick`. When clicked, it calls the function that lives in the parent.
    
    **What happens internally when the button is clicked** — trace it with our Topic-1 vocabulary:
    
    1. User clicks button → `props.onIncrement` (which IS `handleIncrement` from `App`) runs.
    2. `handleIncrement` calls `setCount(count + 1)`.
    3. React schedules a re-render — but of **`App`**, because that's where the state lives, not `Counter`.
    4. `App` re-renders — its function runs top to bottom again, producing a new React Element tree, which includes a `<Counter>` element with a new `count` prop value.
    5. Because `Counter` is being rendered again by its parent with new props, `Counter` also re-renders, now receiving the new `count` value.
    6. Diffing happens (Topic 1), only the changed text in the real DOM gets updated.
    
    ---
    
    #### STEP 6: Common Misconceptions
    
    **❌ "A child component can directly change a prop it receives."**
    
    Wrong — and if you try (`props.count = 5`), it simply won't do what you expect, because React doesn't re-render based on you mutating a props object; it re-renders based on `setState` calls. Even if it *appeared* to change momentarily, the parent's next re-render would overwrite it with the real state value again.
    
    **❌ "State and props are basically the same thing, just named differently."**
    
    Wrong. **Props come from outside (the parent), state is owned internally (by the component itself).** A component can have zero props and lots of state, or lots of props and zero state, or both. They're independent concepts. A good way to distinguish: props answer "what was I given?", state answers "what do I remember myself?"
    
    **❌ "Passing a function down as a prop means the child controls the parent."**
    
    Wrong — subtle but important. The child is just **triggering** a function; the actual logic and the actual state still live entirely in the parent. This pattern even has a common name in real codebases: **"lifting state up"** — meaning when two sibling components need to share/sync data, you move (lift) the state to their common parent, and pass both the data and updater-functions down as props to whichever children need them. We'll cover "lifting state up" properly as part of the State Management section later.
    
    **❌ "State changes are applied instantly, synchronously, the moment you call setState."**
    
    Wrong, and this is a real interview trap — React often **batches** state updates, meaning if you call `setCount` multiple times in a row, React doesn't necessarily re-render after each call — it groups them and re-renders once, for performance. We'll cover this precisely (with the "stale closure" trap) when we get to `useState` in depth — flagging it now so you know it's coming, not skipping it silently.
    
    ---
    
    #### STEP 9: Real Project Connection
    
    **E-commerce:** A `ProductCard` component receives `product` data as **props** from a parent `ProductList` (the parent fetched the data, the card just displays it — read-only). But the card might have its own **state** for something local and private to it, like "is the image zoomed in right now" — that has nothing to do with the parent and shouldn't be passed as a prop.
    
    **Forms (e.g., a checkout form):** The parent `CheckoutPage` might hold the state for "selected payment method" because multiple children (an `OrderSummary` component and a `PaymentSelector` component) both need to know it — this is "lifting state up" in action: the state lives in the common parent, and gets passed down as props to whichever children need to read or trigger changes to it.
    
    ---
    
    ### STEP 10: Mini Assignment
    
    Spot everything wrong with this component (there's more than one issue) and rewrite it correctly:
    
    jsx
    
    ```jsx
    function ProductCard(props) {
      props.price = props.price * 1.18; // adding tax
    
      return (
        <div>
          <h3>{props.name}</h3>
          <p>Price: {props.price}</p>
        </div>
      );
    }
    ```
    
    Tell me: what's wrong, why it's wrong using our vocabulary (props vs state, one-way data flow), and give me the corrected version.
    
- useState
    
    ---
    
    ## TOPIC 4: `useState` Deep Dive — Batching, Stale State, and Functional Updates
    
    This is where the "state changes aren't instant/synchronous" misconception from last topic gets fully unpacked — and it's a very common **live coding trap** interviewers use.
    
    ### PHASE A — LEARN REACT
    
    #### STEP 1: Intuition First
    
    Imagine you're a waiter again, but this time — you're mid-shift, holding a **single order pad page** for a table, actively writing on it. A customer says "add a coffee." Do you immediately run to the kitchen with just that one word "coffee" on a fresh page? No — a smart waiter **keeps writing on the current page**, collects a few more requests ("also add a dessert," "actually make it two coffees"), and only walks to the kitchen once, handing over the **final, complete page**.
    
    This is the intuition for **batching**: React doesn't necessarily act on every single `setState` call the instant it happens. It often **collects multiple state updates that happen close together and processes them together, re-rendering once** — instead of re-rendering after every single call, which would be wasteful.
    
    The tricky part (and the actual interview trap): **while you're still "writing on that page," if you look back at what you wrote a moment ago, it might not reflect the very latest change yet** — this is the root of the "stale state" problem we're about to build up carefully.
    
    ---
    
    #### STEP 2: Build From Scratch
    
    **Term 1: "Snapshot"**
    
    Every time a component function runs (renders), the values of its variables — including state read via `useState` — are like a **snapshot**, frozen for that entire run of the function. Even if `setCount` is called multiple times within the same function run (e.g., inside one click handler), the variable `count` **inside that specific run** does not magically update mid-way through — it stays exactly as it was for that whole render.
    
    **Term 2: "Stale" state**
    
    "Stale" means "old / outdated." If your code reads a state variable expecting it to already reflect a change you just requested, but it still shows the old value because the update hasn't been applied yet — that's reading **stale state**.
    
    **Term 3: Functional update**
    
    Instead of writing `setCount(count + 1)` — which uses the possibly-stale `count` from the current snapshot — React lets you pass a **function** to the setter instead: `setCount((prevCount) => prevCount + 1)`. React guarantees that `prevCount` here will always be the **most up-to-date value**, no matter how many updates are queued up, because React runs these updater functions in order, each one building on the true latest result — not on the stale snapshot from when the render happened.
    
    ---
    
    #### STEP 3: Visual Explanation — The Actual Trap
    
    jsx
    
    ```jsx
    function Counter() {
      const [count, setCount] = useState(0);
    
      const handleClick = () => {
        setCount(count + 1);
        setCount(count + 1);
        setCount(count + 1);
      };
    
      return <button onClick={handleClick}>{count}</button>;
    }
    ```
    
    **Question: after one click, does count become 3?** Let's trace it very carefully.
    
    ```
    Before click: count = 0  (this is the "snapshot" for THIS render)
    
    handleClick() runs — count is 0 for the ENTIRE duration of
    this function call, it never changes mid-function:
    
      setCount(count + 1)  →  setCount(0 + 1)  →  setCount(1)
      setCount(count + 1)  →  setCount(0 + 1)  →  setCount(1)   ← still using count=0!
      setCount(count + 1)  →  setCount(0 + 1)  →  setCount(1)   ← still using count=0!
    
    React receives three separate requests, but all three
    literally say "set count to 1" — because `count` never
    changed within this one function run. React doesn't "add
    them up" — it just sees three instructions to set the
    SAME final value: 1.
    
    RESULT: count becomes 1, NOT 3.
    ```
    
    **Now the fixed version, using functional updates:**
    
    jsx
    
    ```jsx
    const handleClick = () => {
      setCount((prev) => prev + 1);
      setCount((prev) => prev + 1);
      setCount((prev) => prev + 1);
    };
    ```
    
    ```
    Before click: count = 0
    
    React queues these THREE FUNCTIONS (not fixed values) to run
    in order, each one receiving the TRUE latest result of the
    previous one:
    
      1st function runs: prev = 0 (starting point) → returns 1
      2nd function runs: prev = 1 (result of the 1st) → returns 2
      3rd function runs: prev = 2 (result of the 2nd) → returns 3
    
    RESULT: count becomes 3. ✅ Correct this time.
    ```
    
    **This is the exact difference between passing a VALUE to setState vs. passing a FUNCTION to setState** — and it's a near-guaranteed live-coding or conceptual question at your experience level.
    
    ---
    
    #### STEP 5: Under the Hood — Why This Happens (Batching Explained Precisely)
    
    ```
    STEP 1: User clicks button → handleClick() begins executing.
    
    STEP 2: Inside handleClick, `count` is a plain JavaScript
            variable holding the value from THIS render's snapshot
            (0). It is a normal const — it cannot change value
            mid-function on its own; that's just how JavaScript works.
    
    STEP 3: setCount(count + 1) is called → React does NOT
            immediately re-render. Instead, it adds "set count to 1"
            to an internal queue of pending updates, and continues
            running the rest of the function.
    
    STEP 4: Same for the 2nd and 3rd setCount calls — each adds
            another instruction to the queue. Because `count` never
            changed (Step 2), all three instructions say the same
            thing: "set count to 1."
    
    STEP 5: handleClick() finishes running completely.
    
    STEP 6: ONLY NOW does React look at the queue and process it —
            this delayed, grouped processing is called "batching."
            React applies the final queued instruction(s) and
            decides count's new value is 1.
    
    STEP 7: React re-renders Counter ONCE (not three times) with
            count = 1.
    ```
    
    The functional-update version differs only at Steps 3–4: instead of queueing fixed values, React queues **functions**, and when it processes the queue in Step 6, it runs each function in sequence, feeding each one the output of the previous — giving the correct cumulative result of 3.
    
    ---
    
    #### STEP 6: Common Misconceptions
    
    **❌ "setCount updates the variable immediately, so I can read the new value on the very next line."**
    
    Wrong, provably so by the trace above. `count` inside a given render/function call is a frozen snapshot. You'll only see the updated value on the **next render** (i.e., next time the component function runs).
    
    **❌ "Calling setState 3 times always causes 3 re-renders."**
    
    Wrong — this is literally the misconception this whole topic corrects. React batches multiple state updates that happen within the same event handler (and since React 18, even in more places — promises, timeouts, etc., which used to NOT be batched in React 17) into a single re-render.
    
    **❌ "Functional updates are just a style preference — value-based and functional setState are interchangeable."**
    
    Wrong. They only behave identically when you're calling `setState` **once** per event. The moment you call the same setter multiple times based on its own previous value within one function, functional form becomes **necessary for correctness**, not stylistic.
    
    ---
    
    ### STEP 10: Mini Assignment
    
    Predict the output, then explain WHY using the exact vocabulary above (snapshot, stale, batching, functional update):
    
    jsx
    
    ```jsx
    function Score() {
      const [score, setScore] = useState(10);
    
      const handleWin = () => {
        setScore(score + 5);
        console.log(score);
        setScore((prev) => prev + 5);
      };
    
      return <button onClick={handleWin}>{score}</button>;
    }
    ```
    
    Questions:
    
    1. What does `console.log(score)` print, and why?
    2. After one click, what is the final value of `score` shown on the button?
- UseState-2
    
    # **Grading Your Answer**
    
    **The final numerical answers are both correct:** console.log prints **10**, and the final score is **20**. Good — that means your core understanding of snapshot + batching + functional updates is genuinely there. But there’s **one sequencing error** in your explanation that an interviewer would immediately catch, so let’s fix it precisely.
    
    **The Error**
    
    You said: *“When the button is clicked, score function will be re-rendered — the first task that happens is that it calls the handleWin function.”*
    
    This has the order backwards. Here’s the correct sequence:
    
    1. Button clicked
    
    2. handleWin() runs — this is the EVENT HANDLER, not a re-render
    
    3. Inside handleWin, setState calls happen (queued, not applied yet)
    
    4. handleWin() finishes running completely
    
    5. ONLY NOW does React process the queue and decide the final value
    
    6. ONLY NOW does React re-render Score (run the Score function again)
    
    **Re-render is the LAST step, not the first.** The event handler (handleWin) runs entirely to completion first — that’s what causes the queueing to happen — and re-rendering (the component function running again) is what happens *after*, as a consequence of the queue being processed. You had the causality reversed: it’s not “component re-renders, and as part of that, it happens to call handleWin” — it’s “handleWin runs fully (as a normal JS function, triggered by the click), and once it’s done, THAT’S what causes a re-render to be scheduled.”
    
    **One more phrasing fix**
    
    You said: *“now event loop checks the queue.”* Careful here — the **JavaScript event loop** is a real, separate concept (we’ll cover it properly and deeply in the Node.js section, since it’s a 🔴 must-master topic there). What you’re describing here is **not** the JS event loop — it’s React’s own **internal update queue**, a mechanism React itself manages, unrelated to the browser/JS engine’s event loop. Don’t merge these two concepts — an interviewer who’s tested you on both will immediately notice if you conflate them. For now, just say “React processes its internal batch of queued updates” — we’ll connect this properly to the *actual* event loop once we reach that topic.
    
    **Your queue-processing trace itself — correct**
    
    setScore(score + 5) → queues fixed instruction “15” (since score was 10 for this whole render, that’s the snapshot). Then setScore(prev => prev + 5) queues a function. When processed: first instruction sets to 15, second function takes prev = 15, returns 20. Final = 20. This part was airtight.
    
    **Score: 8/10** — right answers, right mechanism understanding, wrong sequencing of *when* the handler runs vs. *when* the re-render happens, and one terminology bleed (event loop vs. React’s queue) to keep separate.
    
    # **Quick Phase B — Interview Delivery (for Topic 4, since it’s the trickiest so far)**
    
    **Why interviewers ask this:** It’s the #1 way to catch someone who copy-pasted useState examples without understanding closures or React’s rendering model. It also quietly checks if you know React 18 changed batching behavior (pre-18, batching only happened inside React event handlers; React 18+ batches almost everywhere, including promises/timeouts).
    
    **How to answer if asked “does calling setState 3 times cause 3 re-renders?”:**
    
    “No — React batches state updates that happen within the same event handler into a single re-render for performance. But there’s a subtlety: if I call setCount(count + 1) multiple times using the state variable directly, all three calls use the same snapshot value from that render, so they overwrite each other instead of accumulating. To correctly accumulate multiple updates in one handler, I’d use the functional form — setCount(prev => prev + 1) — which guarantees each update builds on the true latest value, since React runs these functions in sequence against the actual queued result, not the stale render snapshot.”
    
    That’s a complete, senior-sounding answer in one breath — definition, the trap, and the fix, unprompted.
    
    Want me to also do quick Phase B rounds for Topics 2 (Keys) and 3 (Props/State) before we move to **useEffect** (dependency arrays, cleanup, the classic memory-leak/stale-closure interview questions)? Or move straight ahead?