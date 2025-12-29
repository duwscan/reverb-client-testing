"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { ConnectionConfig, AuthConfig } from "@/types";

type EchoInstance = InstanceType<typeof Echo>;

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: EchoInstance | null;
  }
}

export interface EchoFactoryOptions {
  connection: ConnectionConfig;
  auth: AuthConfig;
  onConnected?: (socketId: string) => void;
  onDisconnected?: () => void;
  onError?: (error: unknown) => void;
  onStateChange?: (state: string) => void;
}

export function createEchoInstance(options: EchoFactoryOptions): EchoInstance {
  const { connection, auth } = options;

  if (typeof window !== "undefined") {
    window.Pusher = Pusher;
  }

  Pusher.logToConsole = true;

  const useTLS = connection.scheme === "wss";

  const echoConfig: Record<string, unknown> = {
    broadcaster: "reverb",
    key: connection.key,
    wsHost: connection.host,
    forceTLS: useTLS,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
  };

  if (connection.port) {
    echoConfig.wsPort = connection.port;
    echoConfig.wssPort = connection.port;
  } else {
    echoConfig.wsPort = useTLS ? 443 : 80;
    echoConfig.wssPort = useTLS ? 443 : 80;
  }

  if (connection.cluster) {
    echoConfig.cluster = connection.cluster;
  } else {
    echoConfig.cluster = "mt1";
  }

  if (auth.enabled && auth.endpoint) {
    echoConfig.authorizer = (
      channel: { name: string },
    ) => ({
      authorize: (
        socketId: string,
        callback: (error: boolean, data?: unknown) => void
      ) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (auth.bearerToken) {
          headers["Authorization"] = `Bearer ${auth.bearerToken}`;
        }

        if (auth.csrfToken) {
          headers["X-CSRF-TOKEN"] = auth.csrfToken;
        }

        console.log(`[Auth] Authorizing channel: ${channel.name}, socketId: ${socketId}`);
        console.log(`[Auth] Endpoint: ${auth.endpoint}`);
        console.log(`[Auth] Headers:`, headers);

        fetch(auth.endpoint, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then(async (response) => {
            const text = await response.text();
            console.log(`[Auth] Response status: ${response.status}`);
            console.log(`[Auth] Response body:`, text);
            
            if (!response.ok) {
              throw new Error(`Auth failed (${response.status}): ${text}`);
            }
            
            try {
              return JSON.parse(text);
            } catch {
              throw new Error(`Invalid JSON response: ${text}`);
            }
          })
          .then((data) => {
            console.log(`[Auth] Success:`, data);
            callback(false, data);
          })
          .catch((error) => {
            console.error(`[Auth] Error:`, error);
            callback(true, { error: error.message || String(error) });
          });
      },
    });
  }

  console.log("Creating Echo with config:", echoConfig);

  const echo = new Echo(echoConfig as ConstructorParameters<typeof Echo>[0]);

  const pusherConnector = echo.connector as unknown as { pusher: Pusher };
  const pusher = pusherConnector.pusher;

  pusher.connection.bind("connected", () => {
    console.log("Pusher connected");
    const socketId = echo.socketId();
    if (socketId && options.onConnected) {
      options.onConnected(socketId);
    }
  });

  pusher.connection.bind("disconnected", () => {
    console.log("Pusher disconnected");
    options.onDisconnected?.();
  });

  pusher.connection.bind("error", (error: unknown) => {
    console.error("Pusher error:", error);
    options.onError?.(error);
  });

  pusher.connection.bind("state_change", (states: { current: string; previous: string }) => {
    console.log("Pusher state change:", states.previous, "->", states.current);
    options.onStateChange?.(states.current);
  });

  pusher.connection.bind("connecting", () => {
    console.log("Pusher connecting...");
  });

  pusher.connection.bind("unavailable", () => {
    console.log("Pusher unavailable");
    options.onError?.(new Error("Connection unavailable"));
  });

  pusher.connection.bind("failed", () => {
    console.log("Pusher failed");
    options.onError?.(new Error("Connection failed"));
  });

  return echo;
}

export function destroyEchoInstance(echo: EchoInstance | null): void {
  if (echo) {
    try {
      echo.disconnect();
    } catch {
      void 0;
    }
  }
  if (typeof window !== "undefined") {
    window.Echo = null;
  }
}
