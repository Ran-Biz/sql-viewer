import { useEffect, useState } from "react";
import { Database, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

interface DatabaseFile {
    name: string;
    path?: string;
    current: boolean;
}

interface DatabaseManagerProps {
    onDatabaseChange: () => void;
    className?: string;
}

export function DatabaseManager({ onDatabaseChange, className }: DatabaseManagerProps) {
    const [databases, setDatabases] = useState<DatabaseFile[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchDatabases = async () => {
        try {
            const res = await fetch("/api/databases");
            const data = await res.json();
            setDatabases(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchDatabases();
    }, []);

    // Listen for global event or something? For now we just fetch.
    // If Sidebar triggers an upload, it should tell us to refresh.
    // We can use an imperative handle or just pass a refresh trigger prop if needed.
    // simpler: expose a static event emitter or just rely on parent passing a refresh signal.
    // Actually, Sidebar handles upload. Sidebar is the parent (or sibling in layout).
    // Let's assume Sidebar will mount this. 

    const handleSwitch = async (db: DatabaseFile) => {
        if (db.current) return;
        setLoading(true);
        try {
            await fetch("/api/databases/switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: db.path || db.name }), // Use path if available (uploads), else name (default)
            });
            await fetchDatabases();
            onDatabaseChange();
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, db: DatabaseFile) => {
        e.stopPropagation();
        if (!confirm(`Delete ${db.name}?`)) return;

        try {
            await fetch(`/api/databases?name=${encodeURIComponent(db.path || db.name)}`, {
                method: "DELETE"
            });
            await fetchDatabases();
            onDatabaseChange(); // Only acts if we deleted current, but good practice
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const currentDb = databases.find(d => d.current) || { name: "Unknown DB" };

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Database className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-sm text-white/90 truncate">{currentDb.name}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>

            {isOpen && (
                <div className="absolute top-12 left-0 w-full z-50 bg-[#151515] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {databases.map((db, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSwitch(db)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors group",
                                db.current && "bg-blue-500/10"
                            )}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className={cn("text-sm truncate", db.current ? "text-blue-400" : "text-white/70")}>
                                    {db.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                {db.current && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                {!db.current && db.name !== "demo.sqlite" && (
                                    <button
                                        onClick={(e) => handleDelete(e, db)}
                                        className="p-1 hover:bg-red-500/20 rounded transition-all"
                                        title="Delete Database"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
