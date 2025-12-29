"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      void 0;
    }
  };

  if (data === null || data === undefined) {
    return <span className="json-null">null</span>;
  }

  if (typeof data === "string") {
    return <span className="json-string">&quot;{data}&quot;</span>;
  }

  if (typeof data === "number") {
    return <span className="json-number">{data}</span>;
  }

  if (typeof data === "boolean") {
    return <span className="json-boolean">{data.toString()}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [i, v] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <div className={cn("font-mono text-xs", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
        <span className="text-muted-foreground">
          {isArray ? `Array(${entries.length})` : `Object`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-4 w-4 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-border pl-2">
          {entries.map(([key, value]) => (
            <div key={String(key)} className="flex gap-1">
              <span className="json-key">{isArray ? `[${key}]` : `"${key}"`}</span>
              <span className="text-muted-foreground">:</span>
              <JsonViewer data={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
