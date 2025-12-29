"use client";

import { useEffect, useState } from "react";
import { useConnectionStore } from "@/stores/connection-store";
import { ConnectionForm } from "@/components/ConnectionForm";
import { AuthenticationForm } from "@/components/AuthenticationForm";
import { ChannelSubscriber } from "@/components/ChannelSubscriber";
import { SubscribedChannels } from "@/components/SubscribedChannels";
import { EventLog } from "@/components/EventLog";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { PresetManager } from "@/components/PresetManager";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Radio, Plug, Unplug, Moon, Sun, Github } from "lucide-react";

export default function Home() {
  const { status, connect, disconnect, loadPresetsFromStorage } =
    useConnectionStore();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPresetsFromStorage();
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, [loadPresetsFromStorage]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col px-4">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Reverb Tester</h1>
          </div>

          <div className="flex items-center gap-2">
            <PresetManager />
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <a
                href="https://github.com/laravel/reverb"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={isConnected || isConnecting ? disconnect : connect}
            variant={isConnected ? "destructive" : "default"}
            disabled={isConnecting}
            className="min-w-[140px]"
          >
            {isConnected || isConnecting ? (
              <>
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </>
            ) : (
              <>
                <Plug className="mr-2 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
          <div className="flex-1">
            <ConnectionStatus />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <ConnectionForm />
            <AuthenticationForm />
            <ChannelSubscriber />
            <SubscribedChannels />
          </div>

          <div className="lg:min-h-[600px]">
            <EventLog />
          </div>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Built for testing Laravel Reverb WebSocket connections
        </div>
      </footer>
    </div>
  );
}
