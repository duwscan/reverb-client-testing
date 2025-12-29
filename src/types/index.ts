export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type ChannelType = "public" | "private" | "presence";

export interface ConnectionConfig {
  host: string;
  port: number | null;
  key: string;
  scheme: "ws" | "wss";
  cluster: string;
}

export interface AuthConfig {
  enabled: boolean;
  endpoint: string;
  bearerToken: string;
  csrfToken: string;
}

export interface ChannelSubscription {
  id: string;
  type: ChannelType;
  name: string;
  fullName: string;
  events: string[];
  status: "subscribing" | "subscribed" | "error";
  errorMessage?: string;
}

export interface EventLogEntry {
  id: string;
  timestamp: Date;
  type: "system" | "subscribed" | "unsubscribed" | "event" | "error" | "whisper";
  channel?: string;
  event?: string;
  payload?: unknown;
  message?: string;
}

export interface Preset {
  id: string;
  name: string;
  connection: ConnectionConfig;
  auth: AuthConfig;
  createdAt: Date;
}

export interface PresenceMember {
  id: string | number;
  info?: Record<string, unknown>;
}

export interface EchoChannel {
  name: string;
  subscription: unknown;
  listen: (event: string, callback: (data: unknown) => void) => EchoChannel;
  stopListening: (event: string) => EchoChannel;
  listenForWhisper: (event: string, callback: (data: unknown) => void) => EchoChannel;
  whisper: (event: string, data: unknown) => EchoChannel;
}

export interface EchoPrivateChannel extends EchoChannel {
  whisper: (event: string, data: unknown) => EchoPrivateChannel;
}

export interface EchoPresenceChannel extends EchoPrivateChannel {
  here: (callback: (members: PresenceMember[]) => void) => EchoPresenceChannel;
  joining: (callback: (member: PresenceMember) => void) => EchoPresenceChannel;
  leaving: (callback: (member: PresenceMember) => void) => EchoPresenceChannel;
}
