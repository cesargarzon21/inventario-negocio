
import { auth, database } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const pantallaLogin = document.getElementById("pantallaLogin");
const aplicacion = document.getElementById("aplicacion");
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensajeLogin");
const botonLogin = document.getElementById("btnLogin");

function mostrarLogin() {
    pantallaLogin.hidden = false;
    aplicacion.hidden = true;
}

function mostrarInventario() {
    pantallaLogin.hidden = true;
    aplicacion.hidden = false;
}

// Comprobar si existe una sesión iniciada
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        mostrarInventario();
    } else {
        mostrarLogin();
    }
});

// Iniciar sesión
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Verificando acceso...";
    botonLogin.disabled = true;

    try {
        await signInWithEmailAndPassword(
            auth,
            correo,
            contrasena
        );

        mensaje.textContent = "";

    } catch (error) {
        console.error("Error de inicio de sesión:", error);

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/user-not-found" ||
            error.code === "auth/wrong-password"
        ) {
            mensaje.textContent = "Correo o contraseña incorrectos.";
        } else if (error.code === "auth/too-many-requests") {
            mensaje.textContent = "Demasiados intentos. Intenta más tarde.";
        } else {
            mensaje.textContent = "No se pudo iniciar sesión. Verifica tu conexión.";
        }

    } finally {
        botonLogin.disabled = false;
    }
});

console.log("Sistema de inicio de sesión preparado");
