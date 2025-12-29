"use client";

import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Server } from "lucide-react";

function formatConnectionUrl(scheme: string, host: string, port: number | null): string {
  if (port) {
    return `${scheme}://${host}:${port}`;
  }
  return `${scheme}://${host}`;
}

export function ConnectionForm() {
  const { connection, setConnection, status } = useConnectionStore();
  const isConnected = status === "connected" || status === "connecting";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4" />
          Server Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={connection.host}
              onChange={(e) => setConnection({ host: e.target.value })}
              placeholder="localhost or your-domain.com"
              disabled={isConnected}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port (optional)</Label>
            <Input
              id="port"
              type="number"
              value={connection.port ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setConnection({ port: value ? parseInt(value) : null });
              }}
              placeholder="Default (80/443)"
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="key">App Key</Label>
          <Input
            id="key"
            value={connection.key}
            onChange={(e) => setConnection({ key: e.target.value })}
            placeholder="your-reverb-app-key"
            disabled={isConnected}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="scheme">Scheme</Label>
            <Select
              value={connection.scheme}
              onValueChange={(value: "ws" | "wss") => setConnection({ scheme: value })}
              disabled={isConnected}
            >
              <SelectTrigger id="scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ws">ws://</SelectItem>
                <SelectItem value="wss">wss://</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cluster">Cluster (optional)</Label>
            <Input
              id="cluster"
              value={connection.cluster}
              onChange={(e) => setConnection({ cluster: e.target.value })}
              placeholder="mt1"
              disabled={isConnected}
            />
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          Connection URL:{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {formatConnectionUrl(connection.scheme, connection.host, connection.port)}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
