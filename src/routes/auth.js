import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_BYTES = 72;

function validateCredentials(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "El cuerpo de la petición debe ser un objeto JSON";
  }

  const { email, password } = body;
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  if (
    !normalizedEmail ||
    normalizedEmail.length > 254 ||
    !EMAIL_REGEX.test(normalizedEmail)
  ) {
    return "El correo electrónico no es válido";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return "La contraseña no puede superar los 72 bytes";
  }
  return null;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const error = validateCredentials(req.body);
  if (error) return res.status(400).json({ message: error });

  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
  }

  const hashed = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await User.create({ email: normalizedEmail, password: hashed });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
  }

  res.status(201).json({ id: user.id, email: user.email });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const error = validateCredentials(req.body);
  if (error) return res.status(400).json({ message: error });

  const { email, password } = req.body;

  // El campo password está oculto por defecto, así que lo pedimos con +password
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  const valid = user && (await bcrypt.compare(password, user.password));

  // Mismo mensaje si falla el correo o la contraseña, para no dar pistas
  if (!valid) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token, user: { id: user.id, email: user.email } });
});

// GET /api/auth/me  (ruta protegida, para comprobar que el token funciona)
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: "El usuario ya no existe" });
  res.json({ id: user.id, email: user.email });
});

export default router;
