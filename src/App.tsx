import { useState, useEffect } from "react";
import "./index.css";
import { Sidebar } from "./components/Sidebar";
import { QueryEditor } from "./components/QueryEditor";
import { ResultsTable } from "./components/ResultsTable";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Hash } from "lucide-react";

export function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Schema state (Lifted from Sidebar)
  const [tables, setTables] = useState<Record<string, any[]>>({});

  // Browse mode state
  const [viewMode, setViewMode] = useState<'sql' | 'browse'>('sql');
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTables = () => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => setTables(data))
      .catch((err) => console.error("Failed to fetch tables", err));
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const runQuery = async (sql: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setDuration(undefined);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to execute query");
      }

      setResults(data.results);
      setDuration(data.duration);
      return data.results;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunQuery = () => runQuery(query);

  const fetchBrowseData = async (table: string, p: number, size: number, search: string) => {
    let whereClause = "";
    if (search.trim() && tables[table]) {
      const columns = tables[table];
      // Basic text search across all columns
      const conditions = columns.map((col: any) => `${col.name} LIKE '%${search.trim()}%'`);
      whereClause = `WHERE ${conditions.join(" OR ")}`;
    }

    // Get Total Count
    try {
      const countRes = await fetch("/api/query", {
        method: "POST",
        body: JSON.stringify({ query: `SELECT COUNT(*) as count FROM ${table} ${whereClause}` })
      });
      const countData = await countRes.json();
      if (countData.results && countData.results[0]) {
        setTotalRecords(countData.results[0].count);
      }
    } catch (e) {
      console.error("Failed to count", e);
    }

    // Fetch Data
    const offset = p * size;
    runQuery(`SELECT * FROM ${table} ${whereClause} LIMIT ${size} OFFSET ${offset}`);
  };

  const handleSelectTable = (tableName: string) => {
    setActiveTable(tableName);
    setViewMode('browse');
    setPage(0);
    setSearchTerm("");
    fetchBrowseData(tableName, 0, pageSize, "");
  };

  const handlePageChange = (newPage: number) => {
    if (!activeTable) return;
    setPage(newPage);
    fetchBrowseData(activeTable, newPage, pageSize, searchTerm);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTable) return;
    setPage(0);
    fetchBrowseData(activeTable, 0, pageSize, searchTerm);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setPage(0);
    if (activeTable) fetchBrowseData(activeTable, 0, newSize, searchTerm);
  };

  const switchToSql = () => {
    setViewMode('sql');
    if (activeTable) {
      setQuery(`SELECT * FROM ${activeTable} LIMIT 100;`);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full h-full">
        <div className="w-64 flex-shrink-0">
          <Sidebar
            onSelectTable={handleSelectTable}
            tables={tables} // Pass tables down
            loadingTables={false} // Optimization: we could track loading
            refreshTables={fetchTables}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white/[0.02]">
          {viewMode === 'sql' ? (
            <div className="h-1/3 min-h-[200px] flex-shrink-0">
              <QueryEditor
                query={query}
                setQuery={setQuery}
                onRun={handleRunQuery}
                loading={isLoading}
                className="h-full"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 flex flex-col bg-black/20 border-b border-white/10">
              {/* Toolbar */}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2 whitespace-nowrap">
                      <span className="opacity-50 font-normal">Table:</span> {activeTable}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
                      {totalRecords.toLocaleString()} records
                    </span>
                  </div>

                  <div className="h-4 w-px bg-white/10" />

                  <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 w-48 focus:w-64 transition-all"
                    />
                  </form>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span>Show</span>
                    <select
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>

                  <div className="h-4 w-px bg-white/10" />

                  <button
                    onClick={switchToSql}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    Open in SQL Editor
                  </button>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="px-4 pb-2 flex items-center justify-between text-xs text-white/50">
                <div>
                  Page <span className="text-white">{page + 1}</span> of <span className="text-white">{Math.max(1, totalPages)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(Math.max(0, page - 1))}
                    disabled={page === 0 || isLoading}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Input Jump */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const p = parseInt((e.currentTarget.elements[0] as HTMLInputElement).value) - 1;
                      if (!isNaN(p) && p >= 0 && p < totalPages) handlePageChange(p);
                    }}
                  >
                    <input
                      className="w-8 text-center bg-transparent border border-white/10 rounded py-0.5 text-white focus:border-blue-500/50 outline-none"
                      defaultValue={page + 1}
                      key={page} // Force re-render on page change
                    />
                  </form>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages - 1 || isLoading}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 bg-black/20 overflow-hidden relative">
            <ResultsTable
              results={results}
              error={error}
              duration={duration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
