import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import jwt from "jsonwebtoken";
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
const validToken = jwt.sign({ sub: "test-user" }, process.env.JWT_SECRET);

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

test("registration rejects a JSON array without reaching the database", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "[]",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "El cuerpo de la petición debe ser un objeto JSON",
  });
});

test("registration rejects passwords longer than bcrypt's supported byte length", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@example.com",
      password: "a".repeat(73),
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "La contraseña no puede superar los 72 bytes",
  });
});

test("the current-user endpoint requires an authentication token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Falta el token de autenticación",
  });
});

test("notes reject a JSON array before accessing the database", async () => {
  const response = await fetch(`${baseUrl}/api/notes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${validToken}`,
      "Content-Type": "application/json",
    },
    body: "[]",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "El cuerpo de la petición debe ser un objeto JSON",
  });
});

test("notes reject an invalid identifier before accessing the database", async () => {
  const response = await fetch(`${baseUrl}/api/notes/not-an-id`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    message: "El identificador no es válido",
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

test("notes reject JWTs signed with an unsupported algorithm", async () => {
  const token = jwt.sign(
    { sub: "test-user" },
    process.env.JWT_SECRET,
    { algorithm: "HS384" },
  );
  const response = await fetch(`${baseUrl}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Token no válido o caducado",
  });
});
