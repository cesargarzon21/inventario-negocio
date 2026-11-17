
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

// ======================================
// ELEMENTOS HTML
// ======================================

const formulario = document.getElementById("formCrearUsuario");
const nombreEmpleado = document.getElementById("nombreEmpleado");
const correoEmpleado = document.getElementById("correoEmpleado");
const contrasenaEmpleado = document.getElementById("contrasenaEmpleado");
const botonCrear = document.getElementById("btnCrearUsuario");
const mensaje = document.getElementById("mensajeUsuario");
const listaUsuarios = document.getElementById("listaUsuarios");
const btnVolver = document.getElementById("btnVolver");

// ======================================
// INSTANCIA SECUNDARIA
// ======================================

let appSecundaria = null;
let authSecundario = null;

// ======================================
// VOLVER AL INVENTARIO
// ======================================

btnVolver.addEventListener("click", () => {
    window.location.href = "index.html";
});

// ======================================
// COMPROBAR ADMINISTRADOR
// ======================================

async function comprobarAdministrador() {

    const usuario = auth.currentUser;

    if (!usuario) {
        return false;
    }

    try {
        await get(ref(database, "usuariosAutorizados"));
        return true;

    } catch (error) {
        console.error("Error comprobando administrador:", error);
        return false;
    }
}

// ======================================
// MOSTRAR MENSAJES
// ======================================

function mostrarMensaje(texto, color = "#075b46") {
    mensaje.textContent = texto;
    mensaje.style.color = color;
}

// ======================================
// CARGAR EMPLEADOS
// ======================================

async function cargarUsuarios() {

    listaUsuarios.textContent = "Cargando empleados...";

    try {

        const resultado = await get(
            ref(database, "usuariosAutorizados")
        );

        listaUsuarios.innerHTML = "";

        if (!resultado.exists()) {
            listaUsuarios.textContent =
                "Todavía no hay empleados registrados.";
            return;
        }

        resultado.forEach((elemento) => {

            const uid = elemento.key;
            const autorizado = elemento.val();

            if (autorizado !== true) {
                return;
            }

            const tarjeta = document.createElement("div");

            tarjeta.style.padding = "14px";
            tarjeta.style.marginBottom = "10px";
            tarjeta.style.border = "1px solid #e5ece8";
            tarjeta.style.borderRadius = "10px";
            tarjeta.style.background = "#f8fbf9";

            const identificador = document.createElement("p");

            identificador.textContent = "ID: " + uid;
            identificador.style.fontSize = "12px";
            identificador.style.overflowWrap = "anywhere";

            const estado = document.createElement("p");

            estado.textContent = "Acceso autorizado";
            estado.style.color = "#168568";

            const botonRevocar = document.createElement("button");

            botonRevocar.textContent = "Revocar acceso";
            botonRevocar.style.padding = "10px";
            botonRevocar.style.border = "none";
            botonRevocar.style.borderRadius = "8px";
            botonRevocar.style.background = "#fcebea";
            botonRevocar.style.color = "#c0392b";

            botonRevocar.addEventListener("click", async () => {

                const confirmar = confirm(
                    "¿Seguro que deseas revocar el acceso de este empleado?"
                );

                if (!confirmar) {
                    return;
                }

                try {

                    await remove(
                        ref(database, "usuariosAutorizados/" + uid)
                    );

                    alert("Acceso revocado correctamente.");

                    await cargarUsuarios();

                } catch (error) {

                    console.error(error);

                    alert("No se pudo revocar el acceso.");
                }
            });

            tarjeta.appendChild(identificador);
            tarjeta.appendChild(estado);
            tarjeta.appendChild(botonRevocar);

            listaUsuarios.appendChild(tarjeta);
        });

        if (!listaUsuarios.children.length) {
            listaUsuarios.textContent =
                "No hay empleados autorizados.";
        }

    } catch (error) {

        console.error("Error cargando empleados:", error);

        listaUsuarios.textContent =
            "No se pudo cargar la lista de empleados.";
    }
}

// ======================================
// CREAR EMPLEADO
// ======================================

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const nombre = nombreEmpleado.value.trim();
    const correo = correoEmpleado.value.trim();
    const contrasena = contrasenaEmpleado.value;

    if (!nombre || !correo || contrasena.length < 6) {

        mostrarMensaje(
            "Verifica los datos ingresados.",
            "#c0392b"
        );

        return;
    }

    botonCrear.disabled = true;

    mostrarMensaje("Creando cuenta...");

    let uidCreado = null;

    try {

        const esAdministrador = await comprobarAdministrador();

        if (!esAdministrador) {
            throw new Error(
                "No tienes permisos de administrador."
            );
        }

        // Crear segunda instancia de Firebase

        if (!appSecundaria) {

            appSecundaria = initializeApp(
                firebaseConfig,
                "AplicacionEmpleados"
            );

            authSecundario = getAuth(appSecundaria);
        }

        // Crear cuenta del empleado

        const credencial = await createUserWithEmailAndPassword(
            authSecundario,
            correo,
            contrasena
        );

        uidCreado = credencial.user.uid;

        // Autorizar acceso al inventario

        await set(
            ref(database, "usuariosAutorizados/" + uidCreado),
            true
        );

        // Guardar información del empleado

        await set(
            ref(database, "perfilesUsuarios/" + uidCreado),
            {
                nombre: nombre,
                correo: correo,
                rol: "empleado"
            }
        );

        // Cerrar únicamente la sesión secundaria

        await signOut(authSecundario);

        mostrarMensaje(
            "Empleado creado y autorizado correctamente."
        );

        formulario.reset();

        await cargarUsuarios();

    } catch (error) {

        console.error("Error creando empleado:", error);

        // Intentar limpiar el registro si quedó incompleto

        if (uidCreado) {

            try {

                await remove(
                    ref(database, "usuariosAutorizados/" + uidCreado)
                );

                await remove(
                    ref(database, "perfilesUsuarios/" + uidCreado)
                );

                if (
                    authSecundario &&
                    authSecundario.currentUser
                ) {
                    await deleteUser(authSecundario.currentUser);
                }

            } catch (errorLimpieza) {

                console.error(
                    "No se pudo completar la limpieza:",
                    errorLimpieza
                );
            }
        }

        if (error.code === "auth/email-already-in-use") {

            mostrarMensaje(
                "Este correo ya está registrado.",
                "#c0392b"
            );

        } else if (error.code === "auth/weak-password") {

            mostrarMensaje(
                "La contraseña es demasiado débil.",
                "#c0392b"
            );

        } else {

            mostrarMensaje(
                error.message || "No se pudo crear el empleado.",
                "#c0392b"
            );
        }

    } finally {

        botonCrear.disabled = false;
    }
});

// ======================================
// COMPROBAR SESIÓN Y PERMISOS
// ======================================

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {

        window.location.href = "index.html";
        return;
    }

    const esAdministrador = await comprobarAdministrador();

    if (!esAdministrador) {

        alert(
            "No tienes autorización para administrar usuarios."
        );

        window.location.href = "index.html";
        return;
    }

    await cargarUsuarios();
});

console.log("Módulo de administración iniciado");
