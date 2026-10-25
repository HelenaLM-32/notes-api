import { Router } from "express";
import openapi from "./openapi.js";

// Versión fija de Swagger UI, cargada desde un CDN con comprobación de integridad
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1";

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Notes API — Documentación</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css"
        integrity="sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW"
        crossorigin="anonymous">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js"
          integrity="sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw"
          crossorigin="anonymous"></script>
  <script src="/api/docs/init.js"></script>
</body>
</html>`;

const initScript = `window.ui = SwaggerUIBundle({
  url: "/api/openapi.json",
  dom_id: "#swagger-ui",
  persistAuthorization: true,
});`;

// Helmet bloquea por defecto los scripts de otros dominios: aquí damos permiso
// solo para la página de documentación y solo al CDN que usamos.
const docsCsp = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self'",
].join("; ");

const router = Router();

router.get("/openapi.json", (req, res) => {
  res.json(openapi);
});

router.get("/docs/init.js", (req, res) => {
  res.type("application/javascript").send(initScript);
});

router.get("/docs", (req, res) => {
  res.setHeader("Content-Security-Policy", docsCsp);
  res.type("html").send(html);
});

export default router;
