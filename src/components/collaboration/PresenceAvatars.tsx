"use client";

import { createPortal } from "react-dom";
import { useState, memo, useEffect } from "react";
import { useCollabContext } from "./CollabProvider";
import { getUserIdentity, setUserName } from "@/lib/collaboration/userIdentity";

export const PresenceAvatars = memo(function PresenceAvatars() {
  const { status } = useCollabContext();
  const [portal, setPortal] = useState<Element | null>(null);

  useEffect(() => {
    setPortal(document.getElementById("collab-hud-portal"));
  }, []);

  if (!portal) return null;

  return createPortal(<AvatarStack status={status} />, portal);
});

function AvatarStack({ status }: { status: ReturnType<typeof useCollabContext>["status"] }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(getUserIdentity().name);

  if (!status.isSynced && status.peerCount === 0) {
    // Not connected — show nothing (offline mode)
    return null;
  }

  const allUsers = [
    // Local user first
    {
      clientId: status.localClientId,
      name:     status.localUser.name,
      color:    status.localUser.color,
      isLocal:  true,
    },
    // Remote peers
    ...Array.from(status.peers.values()).map((p) => ({
      clientId: p.user.clientId,
      name:     p.user.name,
      color:    p.user.color,
      isLocal:  false,
    })),
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {status.peerCount > 0
            ? `${status.peerCount + 1} editing`
            : "live"}
        </span>
      </div>

      {/* Avatar stack — shows up to 4, then +N */}
      <div className="flex items-center -space-x-1.5">
        {allUsers.slice(0, 4).map((user, i) => (
          <button
            key={user.clientId}
            onClick={user.isLocal ? () => setEditingName(true) : undefined}
            title={user.isLocal ? `You (${user.name}) — click to rename` : user.name}
            className="relative w-7 h-7 rounded-full border-2 border-background
                       flex items-center justify-center text-[10px] font-semibold
                       text-white transition-transform hover:scale-110 hover:z-10"
            style={{
              background: user.color,
              zIndex:     allUsers.length - i,
            }}
          >
            {user.name.slice(0, 2).toUpperCase()}
            {user.isLocal && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                               bg-background border border-border rounded-full
                               flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-green-500" />
              </span>
            )}
          </button>
        ))}

        {allUsers.length > 4 && (
          <div className="w-7 h-7 rounded-full border-2 border-background
                          bg-muted flex items-center justify-center
                          text-[9px] font-medium text-muted-foreground">
            +{allUsers.length - 4}
          </div>
        )}
      </div>

      {/* Inline rename popover */}
      {editingName && (
        <div className="flex items-center gap-1 bg-background border border-border
                        rounded-lg px-2 py-1 shadow-md">
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft.trim()) setUserName(nameDraft.trim());
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") { setNameDraft(getUserIdentity().name); setEditingName(false); }
            }}
            className="text-xs w-28 bg-transparent focus:outline-none text-foreground"
            placeholder="Your name"
          />
        </div>
      )}
    </div>
  );
}
