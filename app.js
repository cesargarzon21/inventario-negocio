
import { auth, database } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

// ELEMENTOS DEL LOGIN
const pantallaLogin = document.getElementById("pantallaLogin");
const aplicacion = document.getElementById("aplicacion");
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensajeLogin");
const botonLogin = document.getElementById("btnLogin");

// ELEMENTOS DEL MENÚ
const btnMenuUsuario = document.getElementById("btnMenuUsuario");
const menuDesplegable = document.getElementById("menuDesplegable");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnAdministrarUsuarios = document.getElementById("btnAdministrarUsuarios");
const correoUsuario = document.getElementById("correoUsuario");

// MOSTRAR LOGIN
function mostrarLogin() {
    pantallaLogin.hidden = false;
    aplicacion.hidden = true;
}

// MOSTRAR INVENTARIO
function mostrarInventario() {
    pantallaLogin.hidden = true;
    aplicacion.hidden = false;
}

// ABRIR Y CERRAR MENÚ
btnMenuUsuario.addEventListener("click", () => {
    const estaAbierto = !menuDesplegable.hidden;

    menuDesplegable.hidden = estaAbierto;
    btnMenuUsuario.setAttribute("aria-expanded", String(!estaAbierto));
});

// CERRAR MENÚ AL PULSAR FUERA
document.addEventListener("click", (evento) => {
    if (
        !evento.target.closest(".menu-usuario")
    ) {
        menuDesplegable.hidden = true;
        btnMenuUsuario.setAttribute("aria-expanded", "false");
    }
});

// CERRAR SESIÓN
btnCerrarSesion.addEventListener("click", async () => {
    try {
        await signOut(auth);
        menuDesplegable.hidden = true;
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión.");
    }
});

// COMPROBAR SI EL USUARIO ES ADMINISTRADOR
async function comprobarAdministrador() {
    try {
        await get(ref(database, "usuariosAutorizados"));
        return true;
    } catch (error) {
        if (error.code === "PERMISSION_DENIED") {
            return false;
        }

        console.error("Error comprobando permisos:", error);
        return false;
    }
}

// CONTROLAR SESIÓN
onAuthStateChanged(auth, async (usuario) => {
    if (usuario) {
        mostrarInventario();

        correoUsuario.textContent = usuario.email || "";

        menuDesplegable.hidden = true;
        btnMenuUsuario.setAttribute("aria-expanded", "false");

        btnAdministrarUsuarios.hidden = true;

        const esAdministrador = await comprobarAdministrador();

        btnAdministrarUsuarios.hidden = !esAdministrador;

    } else {
        mostrarLogin();
        menuDesplegable.hidden = true;
        btnAdministrarUsuarios.hidden = true;
    }
});

// INICIAR SESIÓN
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Verificando acceso...";
    botonLogin.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, correo, contrasena);
        mensaje.textContent = "";

    } catch (error) {
        console.error(error);

        if (error.code === "auth/invalid-credential") {
            mensaje.textContent = "Correo o contraseña incorrectos.";
        } else if (error.code === "auth/too-many-requests") {
            mensaje.textContent = "Demasiados intentos. Intenta más tarde.";
        } else {
            mensaje.textContent = "No se pudo iniciar sesión. Intenta nuevamente.";
        }

    } finally {
        botonLogin.disabled = false;
    }
});

console.log("Sistema de autenticación y menú iniciado");
