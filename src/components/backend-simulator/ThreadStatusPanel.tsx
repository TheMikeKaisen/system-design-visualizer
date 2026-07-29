import React from "react";
import { Activity } from "lucide-react";

interface Props {
  status?: "free" | "frozen" | "working";
}

export function ThreadStatusPanel({ status = "free" }: Props) {
  
  const getConfig = () => {
    switch(status) {
      case "frozen":
        return {
          bg: "bg-rose-950/40",
          border: "border-rose-900",
          text: "text-rose-400",
          iconBg: "bg-rose-900/50",
          iconColor: "text-rose-400",
          label: "FROZEN ❌",
          desc: "Blocked by I/O. Cannot process new requests."
        };
      case "working":
        return {
          bg: "bg-blue-950/40",
          border: "border-blue-900",
          text: "text-blue-400",
          iconBg: "bg-blue-900/50",
          iconColor: "text-blue-400",
          label: "WORKING 🔄",
          desc: "Executing JS code on the Call Stack."
        };
      case "free":
      default:
        return {
          bg: "bg-emerald-950/40",
          border: "border-emerald-900",
          text: "text-emerald-400",
          iconBg: "bg-emerald-900/50",
          iconColor: "text-emerald-400",
          label: "FREE ✅",
          desc: "Idle. Ready to handle the next request instantly."
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`rounded-xl border p-4 shadow-lg transition-colors duration-500 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.iconBg}`}>
          <Activity className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Main Thread Status</div>
          <div className={`text-lg font-bold tracking-tight ${config.text}`}>{config.label}</div>
        </div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed mt-3">
        {config.desc}
      </p>
    </div>
  );
}
