import { Table, ChevronRight, Upload, Database } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "../lib/utils";
import { DatabaseManager } from "./DatabaseManager";

interface SidebarProps {
    onSelectTable: (tableName: string) => void;
    className?: string;
    tables: Record<string, any[]>;
    loadingTables: boolean;
    refreshTables: () => void;
}

export function Sidebar({ onSelectTable, className, tables, loadingTables, refreshTables }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dbRefreshTrigger, setDbRefreshTrigger] = useState(0);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                // alert("Upload successful!"); // Removed alert to be less intrusive
                refreshTables();
                setDbRefreshTrigger(prev => prev + 1); // Refresh DB list
            } else {
                const txt = await res.text();
                alert("Upload failed: " + txt);
            }
        } catch (err) {
            alert("Upload failed");
        }

        // reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={cn("flex flex-col h-full bg-black/20 backdrop-blur-xl border-r border-white/10 p-4", className)}>
            <div className="mb-6 px-1">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Database className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="font-semibold text-white tracking-wide">SQL Viewer</h2>
                </div>

                <DatabaseManager
                    key={dbRefreshTrigger}
                    onDatabaseChange={refreshTables}
                />
            </div>

            <div className="mb-4 px-1">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-9 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium py-2 rounded-lg border border-white/10 transition-all"
                >
                    <Upload className="w-3.5 h-3.5 opacity-70" />
                    Upload SQL / DB
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".sqlite,.db,.sql"
                    onChange={handleUpload}
                />
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider px-2 mb-2">Tables</h3>
                {loadingTables ? (
                    <div className="px-2 text-white/30 text-sm">Loading schema...</div>
                ) : (
                    Object.keys(tables).map((tableName) => (
                        <button
                            key={tableName}
                            onClick={() => onSelectTable(tableName)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                        >
                            <Table className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-colors" />
                            <span>{tableName}</span>
                            <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))
                )}
            </div>

            <div className="mt-auto px-2 pt-4">
                {/* Footer content if any */}
            </div>
        </div>
    );
}
