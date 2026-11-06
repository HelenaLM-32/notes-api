import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Falta el token de autenticación" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string" ||
      !payload.sub
    ) {
      return res.status(401).json({ message: "Token no válido o caducado" });
    }

    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Token no válido o caducado" });
  }
}
