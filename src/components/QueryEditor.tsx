import { Play, Eraser } from "lucide-react";
import { cn } from "../lib/utils";

interface QueryEditorProps {
    query: string;
    setQuery: (query: string) => void;
    onRun: () => void;
    onClose?: () => void;
    loading?: boolean;
    className?: string;
}

export function QueryEditor({ query, setQuery, onRun, onClose, loading, className }: QueryEditorProps) {
    return (
        <div className={cn("flex flex-col bg-black/20 backdrop-blur-xl border-b border-white/10", className)}>
            <div className="flex items-center justify-between p-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 px-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <span className="text-xs text-white/30 font-mono ml-2">query.sql</span>
                </div>
                <div className="flex gap-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Close Editor"
                        >
                            <span className="text-xs font-semibold">✕</span>
                        </button>
                    )}
                    <button
                        onClick={() => setQuery("")}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Clear"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRun}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {loading ? "Running..." : "Run"}
                    </button>
                </div>
            </div>
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 w-full bg-transparent text-white font-mono text-sm p-4 resize-none focus:outline-none focus:ring-0 placeholder:text-white/20 selection:bg-blue-500/30"
                placeholder="SELECT * FROM users..."
                spellCheck={false}
            />
        </div>
    );
}
