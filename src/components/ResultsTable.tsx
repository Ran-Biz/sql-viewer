import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface ResultsTableProps {
    results: any[];
    error?: string | null;
    duration?: number;
    className?: string;
}

export function ResultsTable({ results, error, duration, className }: ResultsTableProps) {
    if (error) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full", className)}>
                <div className="p-4 bg-red-500/10 rounded-full mb-4 ring-1 ring-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Query Failed</h3>
                <p className="text-white/50 max-w-md font-mono text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                    {error}
                </p>
            </div>
        );
    }

    if (!results || results.length === 0) {
        if (typeof duration === 'number') {
            return (
                <div className={cn("flex flex-col items-center justify-center h-full text-white/30", className)}>
                    <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 className="w-12 h-12 stroke-[1.5] opacity-50" />
                        <p>Query executed successfully. No results returned.</p>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded-full font-mono">{duration.toFixed(2)}ms</span>
                    </div>
                </div>
            )
        }
        return (
            <div className={cn("flex items-center justify-center h-full text-white/20 font-medium", className)}>
                Run a query to see results
            </div>
        );
    }

    const columns = Object.keys(results[0]);

    return (
        <div className={cn("flex flex-col h-full overflow-hidden", className)}>
            {duration !== undefined && (
                <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-white/[0.02] text-xs text-white/40">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400/70" />
                        <span>{results.length} rows</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{duration.toFixed(2)}ms</span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="font-medium text-white/70 px-4 py-3 border-b border-white/10">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {results.map((row, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                {columns.map((col) => (
                                    <td key={`${i}-${col}`} className="text-white/60 px-4 py-2.5 font-mono text-xs">
                                        {row[col] === null ? <span className="text-white/20 italic">null</span> : String(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
