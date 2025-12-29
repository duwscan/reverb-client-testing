"use client";

import { useEffect, useState } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";

export function ConnectionStatus() {
  const { status, socketId, connectedAt, errorMessage } = useConnectionStore();
  const [uptime, setUptime] = useState("");

  useEffect(() => {
    if (status !== "connected" || !connectedAt) {
      setUptime("");
      return;
    }

    const updateUptime = () => {
      const diff = Date.now() - connectedAt.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setUptime(`${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setUptime(`${minutes}m ${seconds % 60}s`);
      } else {
        setUptime(`${seconds}s`);
      }
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [status, connectedAt]);

  const statusConfig = {
    disconnected: {
      icon: WifiOff,
      variant: "secondary" as const,
      label: "Disconnected",
    },
    connecting: {
      icon: Loader2,
      variant: "warning" as const,
      label: "Connecting...",
    },
    connected: {
      icon: Wifi,
      variant: "success" as const,
      label: "Connected",
    },
    error: {
      icon: AlertCircle,
      variant: "destructive" as const,
      label: "Error",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${status === "connecting" ? "animate-spin" : ""}`}
        />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {status === "connected" && socketId && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="text-muted-foreground">
            Socket ID:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {socketId}
            </code>
          </div>
        </>
      )}

      {status === "connected" && uptime && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="text-muted-foreground">
            Uptime: <span className="font-mono text-xs">{uptime}</span>
          </div>
        </>
      )}

      {status === "error" && errorMessage && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="truncate text-destructive">{errorMessage}</div>
        </>
      )}
    </div>
  );
}
