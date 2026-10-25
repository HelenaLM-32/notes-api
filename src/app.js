import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";

const app = express();

// Detrás del proxy de Vercel hay que fiarse de la IP real del visitante
if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Límite general: 100 peticiones cada 15 minutos por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones, inténtalo de nuevo más tarde" },
});

// Límite estricto para registro y login: 20 intentos cada 15 minutos por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, inténtalo de nuevo en 15 minutos" },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

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
