import { serve } from "bun";
import { Database } from "bun:sqlite";
import { unlink } from "node:fs/promises";
import index from "./index.html";

const defaultDbPath = "demo.sqlite";
let activeDbPath = defaultDbPath;
let db = new Database(activeDbPath);

// Ensure uploads directory exists
const UPLOADS_DIR = "uploads";
await Bun.write(`${UPLOADS_DIR}/.keep`, ""); // Quick way to ensure dir exists if not using fs.mkdir


// Seed data
function seed(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount DECIMAL(10, 2),
      status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  const userCount = database.query("SELECT count(*) as count FROM users").get() as { count: number };

  if (userCount.count === 0) {
    console.log("Seeding database...");
    const insertUser = database.prepare("INSERT INTO users (name, email, role) VALUES (?, ?, ?)");
    insertUser.run("Alice Johnson", "alice@example.com", "admin");
    insertUser.run("Bob Smith", "bob@example.com", "user");
    insertUser.run("Charlie Brown", "charlie@example.com", "user");
    insertUser.run("Diana Prince", "diana@example.com", "user");

    const insertOrder = database.prepare("INSERT INTO orders (user_id, amount, status) VALUES (?, ?, ?)");
    insertOrder.run(1, 99.99, "completed");
    insertOrder.run(2, 49.50, "pending");
    insertOrder.run(1, 150.00, "completed");
    insertOrder.run(3, 25.00, "cancelled");
    console.log("Database seeded!");
  }
}

seed(db);

// Helper to get available databases
async function getDatabases() {
  const glob = new Bun.Glob("*.{sqlite,db}");
  const files = [];

  // Add default demo.sqlite if it exists or we want to list it
  files.push({ name: "demo.sqlite", current: activeDbPath === "demo.sqlite" });

  for await (const file of glob.scan(UPLOADS_DIR)) {
    const name = `${UPLOADS_DIR}/${file}`;
    files.push({ name: file, path: name, current: activeDbPath === name });
  }

  return files;
}


const server = serve({
  routes: {
    "/api/query": {
      async POST(req) {
        try {
          const { query } = await req.json();
          if (!query) throw new Error("Query is required");

          const start = performance.now();

          let results;
          const isSelect = query.trim().toLowerCase().startsWith("select");

          if (isSelect) {
            results = db.query(query).all();
          } else {
            const result = db.run(query);
            results = [{ changes: result.changes, lastInsertId: result.lastInsertRowid }];
          }

          const duration = performance.now() - start;

          return Response.json({ results, duration });
        } catch (err) {
          return Response.json({ error: (err as Error).message }, { status: 400 });
        }
      }
    },

    "/api/tables": {
      async GET() {
        const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];

        const schema: Record<string, any[]> = {};

        for (const table of tables) {
          const columns = db.query(`PRAGMA table_info(${table.name})`).all();
          schema[table.name] = columns;
        }

        return Response.json(schema);
      }
    },

    "/api/upload": {
      async POST(req) {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return new Response("No file uploaded", { status: 400 });
        }

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".sql")) {
          let text = await file.text();

          // Basic MySQL to SQLite conversion
          // ... (keep existing conversion logic, but shortened for brevity in this replace block if possible, 
          // but I must match exact content. Since I can't easily match the huge regex block without potential errors, 
          // I'll wrap the logic to save to a NEW file)

          // ... [The regex replacements are large, I will re-include them to be safe]
          // 1. Remove MySQL-specific comments /*! ... */
          text = text.replace(/\/\*!.*?\*\//gs, "");
          // 2. Remove LOCK/UNLOCK TABLES
          text = text.replace(/^LOCK TABLES.*;/gmi, "");
          text = text.replace(/^UNLOCK TABLES;/gmi, "");
          // 3. Handle CREATE TABLE options
          text = text.replace(/ENGINE=[^;]*;/gi, ";");
          // 4. Remove AUTO_INCREMENT
          text = text.replace(/\bAUTO_INCREMENT\b/gi, "");
          // 5. Remove ON UPDATE CURRENT_TIMESTAMP
          text = text.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, "");
          // 6. Convert 'int' to 'INTEGER'
          text = text.replace(/\bint\b/gi, "INTEGER");
          // 7. Remove 'unsigned'
          text = text.replace(/\bunsigned\b/gi, "");
          // 8. Fix UNIQUE KEY -> UNIQUE (...)
          text = text.replace(/UNIQUE KEY\s+[`"']?\w+[`"']?\s*\(/gi, "UNIQUE (");
          // 9. Handle MySQL escape sequences
          text = text.replace(/\\'/g, "''");
          text = text.replace(/\\"/g, '"');
          // 10. Remove empty statements
          text = text.replace(/;(\s*;)+/g, ";");
          text = text.replace(/^\s*;+/g, "");

          // Execute SQL script
          try {
            // Create a new distinct database file
            const newDbName = fileName.replace(/\.sql$/, ".sqlite");
            const newDbPath = `${UPLOADS_DIR}/${newDbName}-${Date.now()}.sqlite`;

            const tempDb = new Database(newDbPath, { create: true });
            tempDb.run(text);
            tempDb.close();

            return new Response("SQL imported successfully into " + newDbName);
          } catch (e) {
            return new Response("Error executing SQL: " + (e as Error).message, { status: 500 });
          }
        } else if (fileName.endsWith(".sqlite") || fileName.endsWith(".db")) {
          // Upload DB file
          const bytes = await file.arrayBuffer();
          const path = `${UPLOADS_DIR}/${file.name}-${Date.now()}`; // Unique name
          await Bun.write(path, bytes);

          return new Response("Database uploaded: " + file.name);
        } else {
          return new Response("Invalid file type. Upload .sql, .sqlite, or .db", { status: 400 });
        }
      }
    },

    "/api/databases": {
      async GET() {
        return Response.json(await getDatabases());
      },
      async DELETE(req) {
        const url = new URL(req.url);
        const name = url.searchParams.get("name"); // Expecting filename e.g. "uploads/foo.sqlite" or just "foo.sqlite"??
        // Let's expect the full relative path or just the filename in uploads.

        if (!name || name === "demo.sqlite") {
          return new Response("Cannot delete default database", { status: 400 });
        }

        // Security check: ensure it's in uploads/
        if (!name.startsWith(UPLOADS_DIR)) {
          return new Response("Invalid file path", { status: 403 });
        }

        const file = Bun.file(name);
        if (await file.exists()) {
          await unlink(name); // Need to import unlink or use node:fs
          if (activeDbPath === name) {
            // Revert to default
            db.close();
            activeDbPath = defaultDbPath;
            db = new Database(activeDbPath);
          }
          return new Response("Deleted");
        }
        return new Response("File not found", { status: 404 });
      }
    },

    "/api/databases/switch": {
      async POST(req) {
        const { name } = await req.json();
        if (!name) return new Response("Name required", { status: 400 });

        // minimal validation
        const file = Bun.file(name);
        if (await file.exists()) {
          db.close();
          activeDbPath = name;
          db = new Database(activeDbPath);
          return new Response("Switched to " + name);
        }
        return new Response("Database not found", { status: 404 });
      }
    },

    "/*": index
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
  },
});

console.log(`🚀 SQL Viewer running at ${server.url}`);
