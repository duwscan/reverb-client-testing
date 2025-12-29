"use client";

import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { KeyRound } from "lucide-react";

export function AuthenticationForm() {
  const { auth, setAuth, status } = useConnectionStore();
  const isConnected = status === "connected" || status === "connecting";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Authentication
          </div>
          <Switch
            checked={auth.enabled}
            onCheckedChange={(enabled) => setAuth({ enabled })}
            disabled={isConnected}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {auth.enabled ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Auth Endpoint (full URL)</Label>
              <Input
                id="endpoint"
                value={auth.endpoint}
                onChange={(e) => setAuth({ endpoint: e.target.value })}
                placeholder="https://api.example.com/broadcasting/auth"
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Bearer Token</Label>
              <Input
                id="token"
                type="password"
                value={auth.bearerToken}
                onChange={(e) => setAuth({ bearerToken: e.target.value })}
                placeholder="your-sanctum-token"
                disabled={isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csrf">CSRF Token (optional)</Label>
              <Input
                id="csrf"
                value={auth.csrfToken}
                onChange={(e) => setAuth({ csrfToken: e.target.value })}
                placeholder="csrf-token"
                disabled={isConnected}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Enable authentication to subscribe to private and presence channels.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
