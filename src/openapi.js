// Descripción de la API en formato OpenAPI 3.0 (lo que lee Swagger UI)
const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Notes API",
    version: "1.0.0",
    description:
      "API REST de notas personales con registro, login (JWT) y CRUD. " +
      "Cada usuario solo puede ver y modificar sus propias notas.\n\n" +
      "**Cómo probarla:** 1) `POST /api/auth/register` para crear un usuario, " +
      "2) `POST /api/auth/login` para obtener el token, " +
      "3) pulsa **Authorize**, pega el token y prueba las rutas de notas.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Sistema" },
    { name: "Autenticación" },
    { name: "Notas" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string", example: "Descripción del error" } },
      },
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "helena@test.com" },
          password: { type: "string", minLength: 8, example: "12345678" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "6adc97d8cd4a35626e0e2e1c" },
          email: { type: "string", example: "helena@test.com" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT válido durante 1 día" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      NoteInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 120, example: "Comprar pan" },
          content: { type: "string", maxLength: 5000, example: "Integral" },
        },
      },
      Note: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6adc99306a2d972d87437a01" },
          user: { type: "string", example: "6adc97d8cd4a35626e0e2e1c" },
          title: { type: "string", example: "Comprar pan" },
          content: { type: "string", example: "Integral" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Datos no válidos",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Unauthorized: {
        description: "Falta el token o no es válido",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "La nota no existe (o no es tuya)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      TooManyRequests: {
        description: "Demasiadas peticiones",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
    parameters: {
      NoteId: {
        name: "id",
        in: "path",
        required: true,
        description: "Identificador de la nota",
        schema: { type: "string", example: "6adc99306a2d972d87437a01" },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Sistema"],
        summary: "Comprobar que la API responde",
        responses: {
          200: {
            description: "La API está activa",
            content: {
              "application/json": {
                schema: { type: "object", properties: { status: { type: "string", example: "ok" } } },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar un usuario",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Credentials" } } },
        },
        responses: {
          201: {
            description: "Usuario creado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "Ya existe un usuario con ese correo",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión y obtener el token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Credentials" } } },
        },
        responses: {
          200: {
            description: "Login correcto",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description: "Correo o contraseña incorrectos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Autenticación"],
        summary: "Ver mi usuario (ruta protegida)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Datos del usuario autenticado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/notes": {
      get: {
        tags: ["Notas"],
        summary: "Listar mis notas (las más recientes primero)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de notas",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Note" } },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Notas"],
        summary: "Crear una nota",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/NoteInput" } } },
        },
        responses: {
          201: {
            description: "Nota creada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Note" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/notes/{id}": {
      parameters: [{ $ref: "#/components/parameters/NoteId" }],
      get: {
        tags: ["Notas"],
        summary: "Ver una nota mía",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "La nota",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Note" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Notas"],
        summary: "Modificar una nota mía",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/NoteInput" } } },
        },
        responses: {
          200: {
            description: "Nota modificada",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Note" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Notas"],
        summary: "Borrar una nota mía",
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: "Nota borrada (sin contenido)" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};

export default openapi;
