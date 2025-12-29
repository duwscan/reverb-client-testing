"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JsonViewerProps {
  data: unknown;
  className?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, className, defaultExpanded = true }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
    return <span className="text-orange-500">null</span>;
  }

  if (typeof data === "string") {
    return <span className="break-all text-green-600 dark:text-green-400">&quot;{data}&quot;</span>;
  }

  if (typeof data === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{data}</span>;
  }

  if (typeof data === "boolean") {
    return <span className="text-purple-600 dark:text-purple-400">{data.toString()}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [i, v] as const)
    : Object.entries(data as Record<string, unknown>);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <div className={cn("max-w-full overflow-hidden font-mono text-xs", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 shrink-0 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
        <span className="text-muted-foreground">
          {isArray ? `Array(${entries.length})` : `Object(${entries.length})`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-4 w-4 shrink-0 p-0"
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
        <div className="ml-4 max-h-[300px] overflow-auto border-l border-border pl-2">
          {entries.map(([key, value]) => (
            <div key={String(key)} className="flex min-w-0 gap-1">
              <span className="shrink-0 text-amber-600 dark:text-amber-400">
                {isArray ? `[${key}]` : `"${key}"`}
              </span>
              <span className="shrink-0 text-muted-foreground">:</span>
              <div className="min-w-0 flex-1">
                <JsonViewer data={value} defaultExpanded={false} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
