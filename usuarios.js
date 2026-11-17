
import { auth, database, firebaseConfig } from "./firebase-config.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signOut,
    getAuth,
    deleteUser
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    get,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const formulario = document.getElementById("formCrearUsuario");
const nombreEmpleado = document.getElementById("nombreEmpleado");
const correoEmpleado = document.getElementById("correoEmpleado");
const contrasenaEmpleado = document.getElementById("contrasenaEmpleado");
const btnCrearUsuario = document.getElementById("btnCrearUsuario");
const mensajeUsuario = document.getElementById("mensajeUsuario");
const listaUsuarios = document.getElementById("listaUsuarios");
const btnVolver = document.getElementById("btnVolver");

let appSecundaria = null;
let authSecundario = null;

btnVolver.addEventListener("click", () => {
    window.location.href = "index.html";
});

async function comprobarAdministrador() {
    if (!auth.currentUser) return false;

    try {
        const resultado = await get(ref(database, "usuariosAutorizados"));
        return resultado.exists();
    } catch (error) {
        return false;
    }
}

async function cargarUsuarios() {
    listaUsuarios.innerHTML = "<p>Cargando empleados...</p>";

    try {
        const resultado = await get(ref(database, "usuariosAutorizados"));

        if (!resultado.exists()) {
            listaUsuarios.innerHTML = "<p>Todavía no hay empleados registrados.</p>";
            return;
        }

        const usuarios = resultado.val();

        const perfilesResultado = await get(ref(database, "perfilesUsuarios"));
        const perfiles = perfilesResultado.exists()
            ? perfilesResultado.val()
            : {};

        listaUsuarios.innerHTML = "";

        for (const uid in usuarios) {
            if (usuarios[uid] !== true) continue;

            const perfil = perfiles[uid] || {};

            const tarjeta = document.createElement("div");
            tarjeta.className = "usuario-item";

            const informacion = document.createElement("div");
            informacion.className = "usuario-info";

            const nombre = document.createElement("strong");
            nombre.textContent = perfil.nombre || "Nombre no disponible";

            const correo = document.createElement("span");
            correo.textContent = perfil.correo || "Correo no disponible";

            const estado = document.createElement("span");
            estado.textContent = "Estado: Autorizado";

            informacion.appendChild(nombre);
            informacion.appendChild(correo);
            informacion.appendChild(estado);

            const botonRevocar = document.createElement("button");
            botonRevocar.type = "button";
            botonRevocar.textContent = "Revocar acceso";

            botonRevocar.addEventListener("click", async () => {
                const confirmar = confirm(
                    `¿Deseas revocar el acceso de ${perfil.nombre || perfil.correo || "este empleado"}?`
                );

                if (!confirmar) return;

                botonRevocar.disabled = true;

                try {
                    await remove(ref(database, "usuariosAutorizados/" + uid));

                    alert("Acceso revocado correctamente.");
                    await cargarUsuarios();

                } catch (error) {
                    alert("No se pudo revocar el acceso.");
                    botonRevocar.disabled = false;
                }
            });

            tarjeta.appendChild(informacion);
            tarjeta.appendChild(botonRevocar);

            listaUsuarios.appendChild(tarjeta);
        }

    } catch (error) {
        console.error(error);
        listaUsuarios.innerHTML = "<p>No se pudo cargar la lista de empleados.</p>";
    }
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombre = nombreEmpleado.value.trim();
    const correo = correoEmpleado.value.trim();
    const contrasena = contrasenaEmpleado.value;

    if (!nombre || !correo || contrasena.length < 6) {
        mensajeUsuario.textContent = "Completa todos los campos correctamente.";
        return;
    }

    btnCrearUsuario.disabled = true;
    mensajeUsuario.textContent = "Creando cuenta...";

    let uidCreado = null;

    try {
        const esAdministrador = await comprobarAdministrador();

        if (!esAdministrador) {
            throw new Error("No tienes permisos de administrador.");
        }

        if (!appSecundaria) {
            appSecundaria = initializeApp(
                firebaseConfig,
                "AplicacionEmpleados"
            );

            authSecundario = getAuth(appSecundaria);
        }

        const credencial = await createUserWithEmailAndPassword(
            authSecundario,
            correo,
            contrasena
        );

        uidCreado = credencial.user.uid;

        await set(
            ref(database, "usuariosAutorizados/" + uidCreado),
            true
        );

        await set(
            ref(database, "perfilesUsuarios/" + uidCreado),
            {
                nombre: nombre,
                correo: correo,
                rol: "empleado"
            }
        );

        await signOut(authSecundario);

        mensajeUsuario.textContent =
            "Empleado creado y autorizado correctamente.";

        formulario.reset();

        await cargarUsuarios();

    } catch (error) {
        console.error(error);

        if (uidCreado) {
            try {
                await remove(
                    ref(database, "usuariosAutorizados/" + uidCreado)
                );

                await remove(
                    ref(database, "perfilesUsuarios/" + uidCreado)
                );
            } catch (errorLimpieza) {
                console.error(errorLimpieza);
            }
        }

        if (error.code === "auth/email-already-in-use") {
            mensajeUsuario.textContent =
                "Este correo electrónico ya está registrado.";
        } else if (error.code === "auth/weak-password") {
            mensajeUsuario.textContent =
                "La contraseña debe tener al menos 6 caracteres.";
        } else {
            mensajeUsuario.textContent =
                error.message || "No se pudo crear el empleado.";
        }

        if (authSecundario && authSecundario.currentUser) {
            try {
                await signOut(authSecundario);
            } catch (errorSalida) {
                console.error(errorSalida);
            }
        }

    } finally {
        btnCrearUsuario.disabled = false;
    }
});

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        window.location.href = "index.html";
        return;
    }

    const esAdministrador = await comprobarAdministrador();

    if (!esAdministrador) {
        alert("No tienes permisos para administrar usuarios.");
        window.location.href = "index.html";
        return;
    }

    await cargarUsuarios();
});
