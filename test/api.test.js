import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { after, before, test } from "node:test";
import authRoutes from "../src/routes/auth.js";
import notesRoutes from "../src/routes/notes.js";

process.env.JWT_SECRET = "test-secret-for-api-tests";

const app = express();
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("health endpoint reports that the API is available", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("registration rejects an invalid email before using the database", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "password123" }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "El correo electrónico no es válido",
  });
});

test("registration requires a password with at least eight characters", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@example.com", password: "short" }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "La contraseña debe tener al menos 8 caracteres",
  });
});

test("the current-user endpoint requires an authentication token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Falta el token de autenticación",
  });
});

test("notes reject an invalid authentication token", async () => {
  const response = await fetch(`${baseUrl}/api/notes`, {
    headers: { Authorization: "Bearer invalid-token" },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Token no válido o caducado",
  });
});
