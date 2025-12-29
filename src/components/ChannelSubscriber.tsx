"use client";

import { useState } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Plus } from "lucide-react";
import type { ChannelType } from "@/types";

export function ChannelSubscriber() {
  const { status, subscribeChannel, auth } = useConnectionStore();
  const [channelType, setChannelType] = useState<ChannelType>("public");
  const [channelName, setChannelName] = useState("");
  const [eventName, setEventName] = useState("");

  const isConnected = status === "connected";
  const canSubscribePrivate = auth.enabled;

  const handleSubscribe = () => {
    if (!channelName.trim()) return;
    
    const events = eventName.trim()
      ? eventName.split(",").map((e) => e.trim()).filter(Boolean)
      : [];
    
    subscribeChannel(channelType, channelName.trim(), events);
    setChannelName("");
    setEventName("");
  };

  const getFullChannelName = () => {
    if (!channelName) return "";
    if (channelType === "public") return channelName;
    if (channelType === "private") return `private-${channelName}`;
    return `presence-${channelName}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4" />
          Subscribe to Channel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={channelType}
          onValueChange={(v) => setChannelType(v as ChannelType)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="public" className="flex-1">
              Public
            </TabsTrigger>
            <TabsTrigger
              value="private"
              className="flex-1"
              disabled={!canSubscribePrivate}
            >
              Private
            </TabsTrigger>
            <TabsTrigger
              value="presence"
              className="flex-1"
              disabled={!canSubscribePrivate}
            >
              Presence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="mt-3 space-y-3">
            <ChannelInputs
              channelName={channelName}
              eventName={eventName}
              onChannelChange={setChannelName}
              onEventChange={setEventName}
              disabled={!isConnected}
            />
          </TabsContent>

          <TabsContent value="private" className="mt-3 space-y-3">
            {canSubscribePrivate ? (
              <ChannelInputs
                channelName={channelName}
                eventName={eventName}
                onChannelChange={setChannelName}
                onEventChange={setEventName}
                disabled={!isConnected}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable authentication to subscribe to private channels.
              </p>
            )}
          </TabsContent>

          <TabsContent value="presence" className="mt-3 space-y-3">
            {canSubscribePrivate ? (
              <ChannelInputs
                channelName={channelName}
                eventName={eventName}
                onChannelChange={setChannelName}
                onEventChange={setEventName}
                disabled={!isConnected}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable authentication to subscribe to presence channels.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {channelName && (
          <div className="text-xs text-muted-foreground">
            Full channel name:{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              {getFullChannelName()}
            </code>
          </div>
        )}

        <Button
          onClick={handleSubscribe}
          disabled={!isConnected || !channelName.trim()}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
}

interface ChannelInputsProps {
  channelName: string;
  eventName: string;
  onChannelChange: (value: string) => void;
  onEventChange: (value: string) => void;
  disabled: boolean;
}

function ChannelInputs({
  channelName,
  eventName,
  onChannelChange,
  onEventChange,
  disabled,
}: ChannelInputsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="channel-name">Channel Name</Label>
        <Input
          id="channel-name"
          value={channelName}
          onChange={(e) => onChannelChange(e.target.value)}
          placeholder="chat.1"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-name">
          Event Name(s){" "}
          <span className="font-normal text-muted-foreground">
            (comma-separated, prefix with . for custom events)
          </span>
        </Label>
        <Input
          id="event-name"
          value={eventName}
          onChange={(e) => onEventChange(e.target.value)}
          placeholder=".MessageSent, .UserTyping"
          disabled={disabled}
        />
      </div>
    </>
  );
}
