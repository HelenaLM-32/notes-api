import { Router } from "express";
import mongoose from "mongoose";
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

// Comprueba que el :id de la URL tenga forma de id de MongoDB
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "El identificador no es válido" });
  }
  next();
}

// GET /api/notes/:id  → ver una nota mía
router.get("/:id", checkId, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ message: "Nota no encontrada" });
  res.json(note);
});

// PUT /api/notes/:id  → modificar una nota mía
router.put("/:id", checkId, async (req, res) => {
  const error = validateNote(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, content } = req.body;
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { title, content },
    { returnDocument: "after", runValidators: true }
  );
  if (!note) return res.status(404).json({ message: "Nota no encontrada" });
  res.json(note);
});

// DELETE /api/notes/:id  → borrar una nota mía
router.delete("/:id", checkId, async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ message: "Nota no encontrada" });
  res.status(204).send();
});

export default router;
