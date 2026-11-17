
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

onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        mostrarInventario();
    } else {
        mostrarLogin();
    }
});

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

console.log("Sistema de autenticación iniciado");
