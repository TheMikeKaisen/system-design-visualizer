"use client";

import React from "react";
import { QueuePanel } from "./QueuePanel";

export function CallbackQueuePanel({ className }: { className?: string } = {}) {
  return <QueuePanel variant="callback" className={className} />;
}
