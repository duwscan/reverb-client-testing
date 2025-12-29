"use client";

import { create } from "zustand";
import type {
  ConnectionStatus,
  ConnectionConfig,
  AuthConfig,
  ChannelSubscription,
  EventLogEntry,
  Preset,
} from "@/types";
import { generateId } from "@/lib/utils";
import { createEchoInstance, destroyEchoInstance } from "@/lib/echo-factory";

type EchoInstance = ReturnType<typeof createEchoInstance>;

interface ConnectionStore {
  status: ConnectionStatus;
  socketId: string | null;
  echo: EchoInstance | null;
  errorMessage: string | null;
  connectedAt: Date | null;

  connection: ConnectionConfig;
  auth: AuthConfig;

  channels: ChannelSubscription[];
  eventLog: EventLogEntry[];

  presets: Preset[];

  setConnection: (config: Partial<ConnectionConfig>) => void;
  setAuth: (config: Partial<AuthConfig>) => void;

  connect: () => void;
  disconnect: () => void;

  subscribeChannel: (
    type: "public" | "private" | "presence",
    name: string,
    events: string[]
  ) => void;
  unsubscribeChannel: (id: string) => void;

  addLogEntry: (
    entry: Omit<EventLogEntry, "id" | "timestamp">
  ) => void;
  clearLog: () => void;

  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  loadPresetsFromStorage: () => void;
}

const DEFAULT_CONNECTION: ConnectionConfig = {
  host: "localhost",
  port: null,
  key: "",
  scheme: "ws",
  cluster: "",
};

const DEFAULT_AUTH: AuthConfig = {
  enabled: false,
  endpoint: "",
  bearerToken: "",
  csrfToken: "",
};

function getChannelFullName(
  type: "public" | "private" | "presence",
  name: string
): string {
  if (type === "public") return name;
  if (type === "private") return `private-${name}`;
  return `presence-${name}`;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  status: "disconnected",
  socketId: null,
  echo: null,
  errorMessage: null,
  connectedAt: null,

  connection: DEFAULT_CONNECTION,
  auth: DEFAULT_AUTH,

  channels: [],
  eventLog: [],

  presets: [],

  setConnection: (config) =>
    set((state) => ({
      connection: { ...state.connection, ...config },
    })),

  setAuth: (config) =>
    set((state) => ({
      auth: { ...state.auth, ...config },
    })),

  connect: () => {
    const { connection, auth, echo: existingEcho } = get();

    if (existingEcho) {
      destroyEchoInstance(existingEcho);
    }

    set({ status: "connecting", errorMessage: null });

    const url = connection.port
      ? `${connection.scheme}://${connection.host}:${connection.port}`
      : `${connection.scheme}://${connection.host}`;

    get().addLogEntry({
      type: "system",
      message: `Connecting to ${url}...`,
    });

    try {
      const echo = createEchoInstance({
        connection,
        auth,
        onConnected: (socketId) => {
          set({
            status: "connected",
            socketId,
            connectedAt: new Date(),
          });
          get().addLogEntry({
            type: "system",
            message: `Connected! Socket ID: ${socketId}`,
          });
        },
        onDisconnected: () => {
          set({
            status: "disconnected",
            socketId: null,
            connectedAt: null,
          });
          get().addLogEntry({
            type: "system",
            message: "Disconnected from server",
          });
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : String(error);
          set({
            status: "error",
            errorMessage: message,
          });
          get().addLogEntry({
            type: "error",
            message: `Connection error: ${message}`,
          });
        },
        onStateChange: (state) => {
          get().addLogEntry({
            type: "system",
            message: `Connection state: ${state}`,
          });
        },
      });

      set({ echo });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        status: "error",
        errorMessage: message,
      });
      get().addLogEntry({
        type: "error",
        message: `Failed to create connection: ${message}`,
      });
    }
  },

  disconnect: () => {
    const { echo, channels } = get();

    channels.forEach((channel) => {
      if (echo) {
        echo.leave(channel.fullName);
      }
    });

    destroyEchoInstance(echo);

    set({
      status: "disconnected",
      socketId: null,
      echo: null,
      connectedAt: null,
      channels: [],
    });

    get().addLogEntry({
      type: "system",
      message: "Disconnected",
    });
  },

  subscribeChannel: (type, name, events) => {
    const { echo, channels } = get();

    if (!echo) {
      get().addLogEntry({
        type: "error",
        message: "Cannot subscribe: not connected",
      });
      return;
    }

    const fullName = getChannelFullName(type, name);
    const existingChannel = channels.find((c) => c.fullName === fullName);

    if (existingChannel) {
      get().addLogEntry({
        type: "error",
        message: `Already subscribed to ${fullName}`,
      });
      return;
    }

    const subscription: ChannelSubscription = {
      id: generateId(),
      type,
      name,
      fullName,
      events,
      status: "subscribing",
    };

    set({ channels: [...channels, subscription] });

    get().addLogEntry({
      type: "system",
      message: `Subscribing to ${fullName}...`,
    });

    try {
      let channel;

      if (type === "public") {
        channel = echo.channel(name);
      } else if (type === "private") {
        channel = echo.private(name);
      } else {
        channel = echo.join(name);
      }

      events.forEach((eventName) => {
        const trimmedEvent = eventName.trim();
        
        channel.listen(trimmedEvent, (data: unknown) => {
          console.log(`[Event] Received via .listen(): ${trimmedEvent}`, data);
          get().addLogEntry({
            type: "event",
            channel: fullName,
            event: trimmedEvent,
            payload: data,
          });
        });

        const pusherChannel = channel.subscription;
        
        pusherChannel.bind(trimmedEvent, (data: unknown) => {
          console.log(`[Event] Received via .bind() (exact): ${trimmedEvent}`, data);
          get().addLogEntry({
            type: "event",
            channel: fullName,
            event: trimmedEvent,
            payload: data,
          });
        });

        pusherChannel.bind_global((eventName: string, data: unknown) => {
          if (eventName.startsWith("pusher:")) return;
          console.log(`[Event] Global event: ${eventName}`, data);
        });
      });

      channel.subscription.bind_global((eventName: string, data: unknown) => {
        if (eventName.startsWith("pusher:")) return;
        console.log(`[Channel ${fullName}] Any event: ${eventName}`, data);
        
        const isListenedEvent = events.some(e => {
          const t = e.trim();
          return eventName === t || eventName === `.${t}` || eventName === `\\${t}`;
        });
        
        if (!isListenedEvent) {
          get().addLogEntry({
            type: "event",
            channel: fullName,
            event: eventName,
            payload: data,
            message: "(unregistered event)",
          });
        }
      });

      if (type === "presence") {
        channel
          .here((members: unknown[]) => {
            get().addLogEntry({
              type: "system",
              channel: fullName,
              message: `Presence: ${members.length} member(s) here`,
              payload: members,
            });
          })
          .joining((member: unknown) => {
            get().addLogEntry({
              type: "system",
              channel: fullName,
              message: "Member joined",
              payload: member,
            });
          })
          .leaving((member: unknown) => {
            get().addLogEntry({
              type: "system",
              channel: fullName,
              message: "Member left",
              payload: member,
            });
          });
      }

      channel.subscription.bind("pusher:subscription_succeeded", () => {
        set({
          channels: get().channels.map((c) =>
            c.id === subscription.id ? { ...c, status: "subscribed" as const } : c
          ),
        });
        get().addLogEntry({
          type: "subscribed",
          channel: fullName,
          message: `Subscribed to ${fullName}`,
        });
      });

      channel.subscription.bind(
        "pusher:subscription_error",
        (error: unknown) => {
          let errorMsg: string;
          if (error instanceof Error) {
            errorMsg = error.message;
          } else if (typeof error === "object" && error !== null) {
            const errObj = error as Record<string, unknown>;
            if (errObj.error) {
              errorMsg = String(errObj.error);
            } else if (errObj.message) {
              errorMsg = String(errObj.message);
            } else if (errObj.status) {
              errorMsg = `HTTP ${errObj.status}: ${errObj.type || "Unknown error"}`;
            } else {
              errorMsg = JSON.stringify(error, null, 2);
            }
          } else {
            errorMsg = String(error);
          }
          
          console.error("[Subscription Error]", error);
          
          set({
            channels: get().channels.map((c) =>
              c.id === subscription.id
                ? { ...c, status: "error" as const, errorMessage: errorMsg }
                : c
            ),
          });
          get().addLogEntry({
            type: "error",
            channel: fullName,
            message: `Subscription failed: ${errorMsg}`,
            payload: error,
          });
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        channels: get().channels.map((c) =>
          c.id === subscription.id
            ? { ...c, status: "error" as const, errorMessage: message }
            : c
        ),
      });
      get().addLogEntry({
        type: "error",
        channel: fullName,
        message: `Failed to subscribe: ${message}`,
      });
    }
  },

  unsubscribeChannel: (id) => {
    const { echo, channels } = get();
    const channel = channels.find((c) => c.id === id);

    if (!channel) return;

    if (echo) {
      echo.leave(channel.fullName);
    }

    set({ channels: channels.filter((c) => c.id !== id) });

    get().addLogEntry({
      type: "unsubscribed",
      channel: channel.fullName,
      message: `Unsubscribed from ${channel.fullName}`,
    });
  },

  addLogEntry: (entry) =>
    set((state) => ({
      eventLog: [
        ...state.eventLog,
        {
          ...entry,
          id: generateId(),
          timestamp: new Date(),
        },
      ],
    })),

  clearLog: () => set({ eventLog: [] }),

  savePreset: (name) => {
    const { connection, auth, presets } = get();
    const preset: Preset = {
      id: generateId(),
      name,
      connection: { ...connection },
      auth: { ...auth },
      createdAt: new Date(),
    };

    const updatedPresets = [...presets, preset];
    set({ presets: updatedPresets });

    if (typeof window !== "undefined") {
      localStorage.setItem("reverb-tester-presets", JSON.stringify(updatedPresets));
    }
  },

  loadPreset: (id) => {
    const { presets } = get();
    const preset = presets.find((p) => p.id === id);

    if (preset) {
      set({
        connection: { ...preset.connection },
        auth: { ...preset.auth },
      });
    }
  },

  deletePreset: (id) => {
    const { presets } = get();
    const updatedPresets = presets.filter((p) => p.id !== id);
    set({ presets: updatedPresets });

    if (typeof window !== "undefined") {
      localStorage.setItem("reverb-tester-presets", JSON.stringify(updatedPresets));
    }
  },

  loadPresetsFromStorage: () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reverb-tester-presets");
      if (stored) {
        try {
          const presets = JSON.parse(stored);
          set({ presets });
        } catch {
          void 0;
        }
      }
    }
  },
}));
