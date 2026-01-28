# SQL Viewer

A modern, high-performance SQL Viewer and Editor built with **Bun**, **React**, and **TailwindCSS**. It provides a robust interface for managing SQLite databases, importing SQL files, and exploring data with ease.

![SQL Viewer](https://placehold.co/600x400?text=SQL+Viewer+Preview)

## Features

- **Multi-Database Management**: Upload and switch between multiple SQLite databases or `.sql` dumps instantly.
- **Advanced Table Viewer**:
  - **Browse Mode**: Explorer tables without writing SQL.
  - **Pagination**: Navigate through data with custom page sizes and page jumps.
  - **Search**: Full-text search across all columns in a table.
  - **Total Records**: View row counts at a glance.
- **SQL Editor**: Execute custom SQL queries with a powerful editor.
- **Import Support**:
  - Upload `.sqlite`, `.db` files directly.
  - Import `.sql` files (automatically converts basic MySQL/SQL dumps to SQLite).
- **Modern UI**: Dark mode interface designed for developer ergonomics check.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: React 19, TailwindCSS v4
- **Database**: SQLite (via `bun:sqlite`)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.0 or later)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
# Build the application
bun run build

# Start the production server
bun start
```

## Usage

1. **Upload**: Click "Upload SQL / DB" in the sidebar to import a file.
2. **Switch**: Use the dropdown at the top of the sidebar to switch between active databases.
3. **Browse**: Click any table name to view its data. Use the toolbar to search or paginate.
4. **Query**: Click "Open in SQL Editor" or use the query input at the top to run custom SQL.
