# Notas — Escritorio

Aplicación web de notas para practicar el registro, el inicio de sesión y las operaciones CRUD desde un escritorio de estilo clásico. Es un proyecto de portfolio y una demo educativa: utiliza datos de prueba y no guardes información personal o confidencial.

**Demo:** [notes-api-seven-bice.vercel.app](https://notes-api-seven-bice.vercel.app)

## Capturas

![Escritorio de Notas con el formulario de acceso y el aviso de uso de la demo](./public/desktop.png)

## Tecnologías

- **Interfaz:** HTML, CSS y JavaScript sin frameworks.
- **Servidor:** Node.js y Express.
- **Base de datos:** MongoDB Atlas y Mongoose.
- **Autenticación:** bcryptjs para proteger contraseñas y JSON Web Tokens (JWT) para las sesiones.
- **Despliegue:** Vercel.

## Ejecutar en local

Necesitas Node.js y una base de datos MongoDB accesible.

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/HelenaLM-32/notes-api.git
   cd notes-api
   npm install
   ```

2. Crea un archivo `.env` en la raíz y configura las variables de entorno indicadas abajo.
3. Inicia la aplicación:

   ```bash
   npm run dev
   ```

4. Abre `http://localhost:3000`.

Para iniciar el servidor sin el modo de recarga automática, usa `npm start`.

Ejecuta los tests de API con:

```bash
npm test
```

Los tests usan el ejecutor integrado de Node.js y comprueban disponibilidad, validación de registro y protección de rutas sin conectarse a MongoDB.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGODB_URI` | Sí | URI de conexión a MongoDB, con el nombre de la base de datos. |
| `JWT_SECRET` | Sí | Clave privada usada para firmar los tokens. Genera un valor aleatorio y no lo publiques. |
| `PORT` | No | Puerto del servidor local. Por defecto es `3000`; Vercel administra su propio puerto. |

Ejemplo de `.env` (sustituye los valores de ejemplo y no subas este archivo a Git):

```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.example.mongodb.net/notes
JWT_SECRET=pon_aqui_un_valor_aleatorio_largo
PORT=3000
```

Si el usuario o la contraseña de MongoDB contienen caracteres especiales, codifícalos para que la URI sea válida.

En Vercel, configura `MONGODB_URI` y `JWT_SECRET` para el entorno **Production** y vuelve a desplegar después de modificarlas. No compartas sus valores.

## API

Las respuestas de error usan JSON con la propiedad `message`. Las rutas de notas y `GET /api/auth/me` requieren un token en la cabecera `Authorization: Bearer TU_JWT`.

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Comprueba que el servidor responde. |
| `POST` | `/api/auth/register` | Público | Crea una cuenta con correo y contraseña de al menos 8 caracteres. |
| `POST` | `/api/auth/login` | Público | Comprueba las credenciales y devuelve un JWT válido durante un día. |
| `GET` | `/api/auth/me` | Con sesión | Devuelve la cuenta asociada al token. |
| `GET` | `/api/notes` | Con sesión | Lista las notas de la cuenta autenticada. |
| `POST` | `/api/notes` | Con sesión | Crea una nota. El título es obligatorio (máximo 120 caracteres) y el contenido admite hasta 5000. |
| `GET` | `/api/notes/:id` | Con sesión | Consulta una nota propia. |
| `PUT` | `/api/notes/:id` | Con sesión | Actualiza una nota propia. |
| `DELETE` | `/api/notes/:id` | Con sesión | Elimina una nota propia. |

## Decisiones de seguridad

- Las contraseñas se guardan como hashes bcrypt; el campo no se incluye en las consultas por defecto.
- El servidor firma JWT con `JWT_SECRET` y los tokens expiran al cabo de un día.
- Cada operación de notas filtra por el usuario autenticado; conocer el identificador de otra nota no da acceso a ella.
- Se validan correos, contraseñas, contenido e identificadores antes de usarlos.
- Helmet añade cabeceras de seguridad; las peticiones API tienen límites de frecuencia, con un límite más estricto para registro e inicio de sesión.
- El cuerpo JSON de las peticiones está limitado a 10 KB.
- La interfaz y la API comparten origen; el servidor no habilita CORS para dominios externos.
- Helmet añade cabeceras a las respuestas de Express y `vercel.json` establece cabeceras equivalentes para los archivos servidos directamente por Vercel.
- El token se guarda en `localStorage` en esta demo. Para una aplicación de producción, se puede valorar usar cookies `httpOnly`, `Secure` y `SameSite`.
- No uses información real: es una demo de portfolio, no un servicio para guardar datos sensibles.

## Estructura principal

```text
public/       Interfaz del escritorio y guía del proyecto
src/app.js    Configuración de Express y rutas de la API
src/routes/   Registro, autenticación y operaciones CRUD de notas
src/models/   Modelos de usuario y nota de Mongoose
src/db.js     Conexión con MongoDB
```
