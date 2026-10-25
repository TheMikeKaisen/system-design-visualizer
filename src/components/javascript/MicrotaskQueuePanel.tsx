"use client";

import React from "react";
import { QueuePanel } from "./QueuePanel";

export function MicrotaskQueuePanel({ className }: { className?: string } = {}) {
  return <QueuePanel variant="microtask" className={className} />;
}
