import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import Database from "better-sqlite3";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = new Database("surgiplan.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      details TEXT,
      organ TEXT,
      target_x REAL,
      target_y REAL,
      target_z REAL,
      critical_structures TEXT,
      robot_x REAL,
      robot_y REAL,
      robot_z REAL,
      analysis TEXT,
      motion_plan TEXT,
      constraints TEXT,
      simulation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const NEBIUS_IP = "89.169.122.179";
  const REASON2_BASE_URL = `http://${NEBIUS_IP}:8000/v1`;

  // History API
  app.get("/api/history", (req, res) => {
    try {
      const plans = db.prepare("SELECT * FROM plans ORDER BY created_at DESC").all();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", (req, res) => {
    try {
      const { 
        name, details, organ, target_x, target_y, target_z, 
        critical_structures, robot_x, robot_y, robot_z,
        analysis, motion_plan, constraints, simulation 
      } = req.body;

      const info = db.prepare(`
        INSERT INTO plans (
          name, details, organ, target_x, target_y, target_z, 
          critical_structures, robot_x, robot_y, robot_z,
          analysis, motion_plan, constraints, simulation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, details, organ, target_x, target_y, target_z, 
        critical_structures, robot_x, robot_y, robot_z,
        analysis, motion_plan, constraints, simulation
      );

      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM plans WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for Reason2 Models
  app.get("/api/reason2/models", async (req, res) => {
    try {
      const response = await axios.get(`${REASON2_BASE_URL}/models`, { timeout: 5000 });
      res.json(response.data);
    } catch (error: any) {
      console.error("Reason2 Proxy Error (Models):", error.message);
      res.status(502).json({ error: "Failed to connect to Reason2 VM", details: error.message });
    }
  });

  // Proxy for Reason2 Chat Completions
  app.post("/api/reason2/chat/completions", async (req, res) => {
    try {
      const response = await axios.post(`${REASON2_BASE_URL}/chat/completions`, req.body, {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Reason2 Proxy Error (Chat):", error.message);
      res.status(502).json({ error: "Reason2 Execution Failed", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
