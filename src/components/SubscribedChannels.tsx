"use client";

import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, X } from "lucide-react";

export function SubscribedChannels() {
  const { channels, unsubscribeChannel } = useConnectionStore();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          Subscribed Channels
          {channels.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {channels.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active channel subscriptions.
          </p>
        ) : (
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-md border bg-muted/50 p-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <StatusDot status={channel.status} />
                    <div className="truncate">
                      <div className="truncate text-sm font-medium">
                        {channel.fullName}
                      </div>
                      {channel.events.length > 0 && (
                        <div className="truncate text-xs text-muted-foreground">
                          Events: {channel.events.join(", ")}
                        </div>
                      )}
                      {channel.errorMessage && (
                        <div className="truncate text-xs text-destructive">
                          {channel.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => unsubscribeChannel(channel.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: "subscribing" | "subscribed" | "error" }) {
  const colors = {
    subscribing: "bg-yellow-500",
    subscribed: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}
