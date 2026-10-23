import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT || 3000;

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("No se pudo arrancar el servidor:", error.message);
  process.exit(1);
}
