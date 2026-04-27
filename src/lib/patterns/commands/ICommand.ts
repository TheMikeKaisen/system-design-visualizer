import type { SerializedCommand } from "@/types";

/**
 * Every command must:
 * 1. Be executable and undoable (local operation)
 * 2. Be serializable to a plain JSON object (collaboration requirement)
 * 3. Be reconstructible from that JSON object (peer replay requirement)
 */
export interface ICommand {
  execute(): void;
  undo(): void;
  getDescription(): string;
  /**
   * Serialize to a plain JSON-safe object.
   * RULE: payload must contain only primitives, plain objects, and arrays.
   * No class instances. No functions. No undefined values.
   */
  serialize(): SerializedCommand;
}

// ─────────────────────────────────────────────
// Command Registry
// ─────────────────────────────────────────────

/**
 * Registry of command constructors, keyed by SerializedCommand.type.
 * This is the "dictionary" that allows the application to turn plain data
 * back into executable logic (Rehydration).
 *
 * SIGNIFICANCE:
 * 1. Rehydration: Converts JSON/database records back into Command objects.
 * 2. Collaboration: Allows remote peers to "replay" actions received via Yjs.
 * 3. Undo/Redo: Enables storing a history of actions that can be re-executed.
 */
export type CommandConstructor = (
  payload: Record<string, unknown>
) => ICommand;

export const commandRegistry = new Map<string, CommandConstructor>();

/**
 * Registers a command constructor so it can be reconstructed from its serialized form.
 * Register new command types here as you add them.
 */
export function registerCommand(
  type: string,
  constructor: CommandConstructor
): void {
  if (commandRegistry.has(type)) {
    console.warn(`[CommandRegistry] Overwriting command type: ${type}`);
  }
  commandRegistry.set(type, constructor);
}