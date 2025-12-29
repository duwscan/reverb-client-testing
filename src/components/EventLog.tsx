"use client";

import { useEffect, useRef } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { JsonViewer } from "@/components/JsonViewer";
import { formatTimestamp } from "@/lib/utils";
import {
  ScrollText,
  Trash2,
  Radio,
  AlertCircle,
  LogIn,
  LogOut,
  Zap,
  Info,
} from "lucide-react";
import type { EventLogEntry } from "@/types";

export function EventLog() {
  const { eventLog, clearLog } = useConnectionStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLog.length]);

  return (
    <Card className="flex h-full min-h-[400px] flex-col lg:min-h-[600px]">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Event Log
            {eventLog.length > 0 && (
              <Badge variant="secondary">{eventLog.length}</Badge>
            )}
          </div>
          {eventLog.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLog}
              className="h-7 px-2"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4" ref={scrollRef}>
          {eventLog.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No events yet. Connect to a server and subscribe to channels.
            </div>
          ) : (
            <div className="space-y-2">
              {eventLog.map((entry, index) => (
                <div key={entry.id}>
                  <EventLogItem entry={entry} />
                  {index < eventLog.length - 1 && (
                    <Separator className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EventLogItem({ entry }: { entry: EventLogEntry }) {
  const typeConfig = {
    system: {
      icon: Info,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    subscribed: {
      icon: LogIn,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    unsubscribed: {
      icon: LogOut,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    event: {
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    whisper: {
      icon: Radio,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  };

  const config = typeConfig[entry.type];
  const Icon = config.icon;

  return (
    <div className={`rounded-md p-2 ${config.bg}`}>
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(entry.timestamp)}
            </span>
            {entry.channel && (
              <Badge variant="outline" className="text-xs">
                {entry.channel}
              </Badge>
            )}
            {entry.event && (
              <Badge variant="secondary" className="text-xs">
                {entry.event}
              </Badge>
            )}
          </div>
          {entry.message && (
            <p className="mt-1 text-sm">{entry.message}</p>
          )}
          {entry.payload !== undefined && (
            <div className="mt-2 rounded border bg-background p-2">
              <JsonViewer data={entry.payload} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
