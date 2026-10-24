import { Router } from "express";
import Note from "../models/Note.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Todas las rutas de este router exigen estar autenticado
router.use(requireAuth);

function validateNote(body = {}) {
  const { title, content } = body;
  if (typeof title !== "string" || title.trim().length === 0) {
    return "El título es obligatorio";
  }
  if (title.trim().length > 120) {
    return "El título no puede superar los 120 caracteres";
  }
  if (content !== undefined && typeof content !== "string") {
    return "El contenido debe ser texto";
  }
  if (typeof content === "string" && content.length > 5000) {
    return "El contenido no puede superar los 5000 caracteres";
  }
  return null;
}

// POST /api/notes  → crear una nota
router.post("/", async (req, res) => {
  const error = validateNote(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, content } = req.body;
  const note = await Note.create({ user: req.userId, title, content });

  res.status(201).json(note);
});

// GET /api/notes  → listar MIS notas, las más recientes primero
router.get("/", async (req, res) => {
  const notes = await Note.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(notes);
});

export default router;
