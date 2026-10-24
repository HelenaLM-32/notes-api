import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba para comprobar que el servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Rutas que no existen
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Errores no controlados (por ejemplo, un JSON mal formado)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Error interno del servidor" : err.message,
  });
});

export default app;
