import React from "react";
import { BookOpen } from "lucide-react";

interface Props {
  term?: string;
}

const GLOSSARY: Record<string, string> = {
  "Program": "A file sitting on disk. Instructions that aren't currently running. (e.g. server.js)",
  "Process": "A live, running instance of a program. It has its own private memory space allocated by the OS.",
  "Thread": "A sequence of instructions being executed. Has its own call stack. Workers inside a Process share the same memory.",
  "Thread Pool": "Background threads (usually 4) ready to handle heavy I/O tasks without freezing the Main Thread.",
  "Engine": "Software that parses and executes JS code. V8 implements the ECMAScript spec faithfully.",
  "libuv": "A C++ library that gives Node its async superpowers: the Event Loop, Thread Pool, and non-blocking I/O.",
  "Runtime": "The complete environment (Node) combining V8, libuv, and APIs like fs, http, allowing JS to run on servers."
};

export function GlossaryCard({ term }: Props) {
  if (!term || !GLOSSARY[term]) return null;

  return (
    <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-emerald-500" />
        <h4 className="text-sm font-bold tracking-widest text-emerald-400 uppercase">{term}</h4>
      </div>
      <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
        {GLOSSARY[term]}
      </p>
    </div>
  );
}
