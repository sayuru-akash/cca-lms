import { Terminal } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <Terminal className="h-16 w-16 text-terminal-green animate-pulse" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Terminal className="h-16 w-16 text-terminal-green" />
          </div>
        </div>
        <p className="mt-6 font-mono text-lg text-terminal-green terminal-glow">
          $ loading...
        </p>
        <div className="mt-4 flex items-center justify-center gap-1">
          <div className="h-2 w-2 rounded-full bg-terminal-green animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-terminal-green animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-terminal-green animate-bounce" />
        </div>
      </div>
    </div>
  );
}
