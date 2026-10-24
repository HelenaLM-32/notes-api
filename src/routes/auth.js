import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body = {}) {
  const { email, password } = body;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return "El correo electrónico no es válido";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  return null;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const error = validateCredentials(req.body);
  if (error) return res.status(400).json({ message: error });

  const { email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed });

  res.status(201).json({ id: user.id, email: user.email });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const error = validateCredentials(req.body);
  if (error) return res.status(400).json({ message: error });

  const { email, password } = req.body;

  // El campo password está oculto por defecto, así que lo pedimos con +password
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
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
