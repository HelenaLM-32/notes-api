import mongoose from "mongoose";

// Guardamos la conexión en curso para reutilizarla: en Vercel, varias peticiones
// comparten la misma instancia y no queremos abrir una conexión nueva en cada una.
let connecting = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en el archivo .env");
  }

  if (!connecting) {
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then(() => console.log("MongoDB conectado"))
      .catch((error) => {
        connecting = null; // si falla, la próxima petición lo vuelve a intentar
        throw error;
      });
  }

  await connecting;
}
