import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database initialization
  const db = new Database("lahe.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT,
      response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      pattern TEXT,
      commands TEXT,
      efficacy REAL DEFAULT 1.0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      content TEXT,
      importance INTEGER DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cron_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      schedule TEXT,
      command TEXT,
      last_run DATETIME,
      status TEXT DEFAULT 'active'
    );
  `);

  app.use(express.json());

  // --- Real System APIs ---

  // Execute Command
  app.post("/api/execute", async (req, res) => {
    const { command } = req.body;
    
    // Safety Blacklist
    const blacklist = ["rm -rf /", "mkfs", "dd if=/dev/zero", "> /dev/sda", "shutdown", "reboot"];
    if (blacklist.some(b => command.includes(b))) {
      return res.status(403).json({ error: "Instruction contains critically dangerous patterns and was blocked by the kernel safety gate." });
    }

    try {
      console.log(`Executing: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      res.json({ stdout, stderr });
    } catch (error: any) {
      res.status(500).json({ error: error.message, stderr: error.stderr });
    }
  });

  // Get Live Stats
  app.get("/api/stats", async (req, res) => {
    try {
      // Note: These depend on standard linux tools. On non-Linux, these will fail gracefully.
      const [uptime, memory, disk, cpuLoad] = await Promise.all([
        execAsync("uptime -p").then(r => r.stdout.trim()).catch(() => "N/A"),
        execAsync("free -h").then(r => r.stdout).catch(() => ""),
        execAsync("df -h --total | tail -1").then(r => r.stdout).catch(() => ""),
        execAsync("top -bn1 | grep 'Cpu(s)'").then(r => r.stdout).catch(() => "")
      ]);

      res.json({ uptime, memory, disk, cpuLoad });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch system stats" });
    }
  });

  // Get Live Journal logs
  app.get("/api/logs", async (req, res) => {
    try {
      // Try to get real logs, fallback to mock if failed (e.g. no permissions or non-arch)
      const { stdout } = await execAsync("journalctl -n 50 --no-hostname --output=short-iso").catch(() => ({ stdout: "" }));
      
      if (!stdout) {
        return res.json([
          { timestamp: new Date().toISOString(), source: "system", message: "Live journalctl access failed. Running in restricted container mode." }
        ]);
      }

      const lines = stdout.trim().split("\n").map(line => {
        const parts = line.split(" ");
        return {
          timestamp: parts[0] || "",
          source: parts[1]?.replace(":", "") || "kernel",
          message: parts.slice(2).join(" ")
        };
      });
      res.json(lines);
    } catch (e) {
      res.json([]);
    }
  });

  // --- Data Preservation APIs ---

  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 50").all();
    res.json(history);
  });

  app.post("/api/history", (req, res) => {
    const { query, response } = req.body;
    const stmt = db.prepare("INSERT INTO interactions (query, response) VALUES (?, ?)");
    const info = stmt.run(query, response);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/memory", (req, res) => {
    const memory = db.prepare("SELECT * FROM memory ORDER BY importance DESC, timestamp DESC").all();
    res.json(memory);
  });

  app.post("/api/memory", (req, res) => {
    const { category, content, importance } = req.body;
    const stmt = db.prepare("INSERT INTO memory (category, content, importance) VALUES (?, ?, ?)");
    const info = stmt.run(category, content, importance || 1);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/skills", (req, res) => {
    const skills = db.prepare("SELECT * FROM skills ORDER BY efficacy DESC").all();
    res.json(skills);
  });

  app.post("/api/skills", (req, res) => {
    const { name, pattern, commands } = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO skills (name, pattern, commands) VALUES (?, ?, ?)");
    const info = stmt.run(name, pattern, Array.isArray(commands) ? JSON.stringify(commands) : commands);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/cron", (req, res) => {
    const jobs = db.prepare("SELECT * FROM cron_jobs").all();
    res.json(jobs);
  });

  app.post("/api/cron", (req, res) => {
    const { name, schedule, command } = req.body;
    const stmt = db.prepare("INSERT INTO cron_jobs (name, schedule, command) VALUES (?, ?, ?)");
    const info = stmt.run(name, schedule, command);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arch Assistant Server running at http://localhost:${PORT}`);
  });
}

startServer();
