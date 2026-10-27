// Estado de la sesión y las notas.
const TOKEN_KEY = "notes-api-token";
let token = localStorage.getItem(TOKEN_KEY);
let registering = false;
let notes = [];
let messageTimer;

const welcomeWindow = document.querySelector("#welcome-window");
const folderWindow = document.querySelector("#explorer-window");
const manualWindow = document.querySelector("#manual-window");
const noteWindows = document.querySelector("#note-window-container");
const noteList = document.querySelector("#explorer-list");
const message = document.querySelector("#desktop-message");

// Todas las peticiones a la API pasan por aquí.
async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      token = null;
    }
    throw new Error(result.message || "Ha ocurrido un error");
  }
  return result;
}

function showMessage(text) {
  clearTimeout(messageTimer);
  message.textContent = text;
  message.hidden = false;
  messageTimer = setTimeout(() => {
    message.hidden = true;
  }, 3000);
}

// Registro e inicio de sesión.
function setAuthMode(createAccount) {
  registering = createAccount;
  document
    .querySelector("#login-tab")
    .classList.toggle("is-active", !createAccount);
  document
    .querySelector("#register-tab")
    .classList.toggle("is-active", createAccount);
  document
    .querySelector("#login-tab")
    .setAttribute("aria-selected", String(!createAccount));
  document
    .querySelector("#register-tab")
    .setAttribute("aria-selected", String(createAccount));
  document.querySelector("#auth-submit").textContent = createAccount
    ? "Crear cuenta"
    : "Entrar";
  document.querySelector("#password").autocomplete = createAccount
    ? "new-password"
    : "current-password";
  document.querySelector("#welcome-title").textContent = createAccount
    ? "Crear una cuenta"
    : "Bienvenido";
  document.querySelector("#auth-error").hidden = true;
}

function showLoggedInUser(user) {
  welcomeWindow.hidden = true;
  document.querySelector("#tray-user").textContent = user.email;
  document.querySelector("#logout-button").hidden = false;
  loadNotes();
}

document
  .querySelector("#login-tab")
  .addEventListener("click", () => setAuthMode(false));
document
  .querySelector("#register-tab")
  .addEventListener("click", () => setAuthMode(true));

document
  .querySelector("#auth-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = document.querySelector("#auth-error");
    const button = document.querySelector("#auth-submit");
    const credentials = Object.fromEntries(new FormData(form));

    error.hidden = true;
    button.disabled = true;
    try {
      if (registering) {
        await api("/auth/register", {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        setAuthMode(false);
      }

      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      token = result.token;
      localStorage.setItem(TOKEN_KEY, token);
      form.reset();
      showLoggedInUser(result.user);
      showMessage("Sesión iniciada.");
    } catch (requestError) {
      error.textContent = requestError.message;
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  });

// Lee las notas y las muestra en la carpeta.
async function loadNotes() {
  try {
    notes = await api("/notes");
    renderNotes();
  } catch (error) {
    showMessage(error.message);
  }
}

function renderNotes() {
  noteList.replaceChildren();

  if (notes.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-folder";
    emptyMessage.textContent = "La carpeta está vacía. Pulsa «Nueva nota» para crear una.";
    noteList.append(emptyMessage);
  }

  for (const note of notes) {
    const template = document.querySelector("#folder-note-template");
    const item = template.content.firstElementChild.cloneNode(true);
    item.querySelector(".note-name").textContent = note.title;
    item.addEventListener("click", () => openNote(note));
    noteList.append(item);
  }

  const count = notes.length === 1
    ? "objeto"
    : "objetos";
  document.querySelector("#explorer-status").textContent = `${notes.length} ${count}`;
}

function openFolder() {
  if (!token) {
    welcomeWindow.hidden = false;
    showMessage("Inicia sesión para ver tus notas.");
    return;
  }
  folderWindow.hidden = false;
}

// Abre una nota existente o una ventana en blanco para crearla.
function openNote(note = null) {
  if (!token) {
    welcomeWindow.hidden = false;
    showMessage("Inicia sesión antes de crear notas.");
    return;
  }

  const existing = [...noteWindows.children].find(
    (window) => window.dataset.noteId === note?._id,
  );
  if (existing) {
    existing.hidden = false;
    return;
  }

  const template = document.querySelector("#note-window-template");
  const windowElement = template.content.firstElementChild.cloneNode(true);
  const title = windowElement.querySelector(".note-title-input");
  const content = windowElement.querySelector(".note-content-input");
  const titlebar = windowElement.querySelector(".note-window-title");
  const status = windowElement.querySelector(".note-status");
  const saveButton = windowElement.querySelector(".save-note-button");
  const deleteButton = windowElement.querySelector(".delete-note-button");

  title.value = note?.title || "";
  content.value = note?.content || "";
  titlebar.textContent = note ? `Nota: ${note.title}` : "Nueva nota";
  status.textContent = note ? "Nota guardada" : "Nota nueva";
  deleteButton.hidden = !note;
  if (note) windowElement.dataset.noteId = note._id;
  noteWindows.append(windowElement);

  windowElement
    .querySelector("[data-close]")
    .addEventListener("click", () => windowElement.remove());

  windowElement
    .querySelector(".note-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!title.value.trim()) {
        showMessage("Escribe un título antes de guardar.");
        title.focus();
        return;
      }

      saveButton.disabled = true;
      const body = JSON.stringify({
        title: title.value.trim(),
        content: content.value,
      });
      try {
        if (note) {
          note = await api(`/notes/${note._id}`, {
            method: "PUT",
            body,
          });
        } else {
          note = await api("/notes", {
            method: "POST",
            body,
          });
        }

        windowElement.dataset.noteId = note._id;
        titlebar.textContent = `Nota: ${note.title}`;
        status.textContent = "Nota guardada";
        deleteButton.hidden = false;
        await loadNotes();
        showMessage("La nota se ha guardado.");
      } catch (error) {
        showMessage(error.message);
      } finally {
        saveButton.disabled = false;
      }
    });

  deleteButton.addEventListener("click", async () => {
    deleteButton.disabled = true;
    try {
      await api(`/notes/${note._id}`, {
        method: "DELETE",
      });
      windowElement.remove();
      await loadNotes();
      showMessage("La nota se ha eliminado.");
    } catch (error) {
      showMessage(error.message);
      deleteButton.disabled = false;
    }
  });

  title.focus();
}

// Botones principales del escritorio.
document
  .querySelector("#computer-icon")
  .addEventListener("click", () => {
    welcomeWindow.hidden = false;
  });
document
  .querySelector("#notes-folder-icon")
  .addEventListener("click", openFolder);
document
  .querySelector("#manual-icon")
  .addEventListener("click", () => {
    manualWindow.hidden = false;
  });
document
  .querySelector("#explorer-new-note")
  .addEventListener("click", () => openNote());

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    button.closest(".retro-window").hidden = true;
  });
});

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  token = null;
  notes = [];
  noteWindows.replaceChildren();
  folderWindow.hidden = true;
  welcomeWindow.hidden = false;
  document.querySelector("#tray-user").textContent = "Sin iniciar sesión";
  document.querySelector("#logout-button").hidden = true;
  renderNotes();
  setAuthMode(false);
}

document.querySelector("#logout-button").addEventListener("click", logout);

function updateClock() {
  document.querySelector("#clock").textContent = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

updateClock();
setInterval(updateClock, 30_000);

// Recupera la sesión si la persona recarga la página.
if (token) {
  api("/auth/me")
    .then(showLoggedInUser)
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      token = null;
      welcomeWindow.hidden = false;
    });
}
