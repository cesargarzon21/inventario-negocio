import { auth, database } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    get,
    runTransaction,
    onValue
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


// ELEMENTOS DE PRODUCTOS
const btnInventario = document.getElementById("btnInventario");
const totalProductos = document.getElementById("totalProductos");


// ELEMENTOS DEL REGISTRO
const btnRegistrar = document.getElementById("btnRegistrar");
const seccionAgregar = btnRegistrar.closest(".agregar");
const seccionRegistro = document.getElementById("seccionRegistro");
const btnCerrarFormulario = document.getElementById("btnCerrarFormulario");
const formProducto = document.getElementById("formProducto");

const nombreProducto = document.getElementById("nombreProducto");
const codigoBarras = document.getElementById("codigoBarras");
const precioCompra = document.getElementById("precioCompra");
const precioVenta = document.getElementById("precioVenta");
const cantidadProducto = document.getElementById("cantidadProducto");

const porcentajeGanancia = document.getElementById("porcentajeGanancia");
const btnGuardarProducto = document.getElementById("btnGuardarProducto");
const mensajeProducto = document.getElementById("mensajeProducto");
const btnEscanearRegistro = document.getElementById("btnEscanearRegistro");


// VARIABLES
let detenerInventario = null;


// ADMINISTRAR USUARIOS
btnAdministrarUsuarios.addEventListener("click", () => {
    window.location.href = "usuarios.html";
});


// ABRIR PÁGINA DE PRODUCTOS
btnInventario.addEventListener("click", () => {
    window.location.href = "productos.html";
});


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

    btnMenuUsuario.setAttribute(
        "aria-expanded",
        String(!estaAbierto)
    );

});


// CERRAR MENÚ AL PULSAR FUERA
document.addEventListener("click", (evento) => {

    if (!evento.target.closest(".menu-usuario")) {

        menuDesplegable.hidden = true;

        btnMenuUsuario.setAttribute(
            "aria-expanded",
            "false"
        );

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

    if (!auth.currentUser) {
        return false;
    }

    try {

        await get(ref(database, "usuariosAutorizados"));
        return true;

    } catch (error) {

        if (error.code !== "PERMISSION_DENIED") {
            console.error("Error comprobando permisos:", error);
        }

        return false;

    }

}


// ABRIR FORMULARIO
btnRegistrar.addEventListener("click", () => {

    seccionRegistro.hidden = false;
    mensajeProducto.textContent = "";

    seccionRegistro.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


// CERRAR FORMULARIO
btnCerrarFormulario.addEventListener("click", () => {

    seccionRegistro.hidden = true;
    formProducto.reset();

    porcentajeGanancia.textContent = "0%";
    mensajeProducto.textContent = "";

});


// CALCULAR PORCENTAJE DE GANANCIA
function calcularGanancia() {

    const compra = Number(precioCompra.value);
    const venta = Number(precioVenta.value);

    if (
        precioCompra.value === "" ||
        precioVenta.value === "" ||
        compra <= 0
    ) {

        porcentajeGanancia.textContent = "0%";
        return;

    }

    const ganancia = ((venta - compra) / compra) * 100;

    porcentajeGanancia.textContent =
        ganancia.toFixed(2) + "%";

}

precioCompra.addEventListener("input", calcularGanancia);
precioVenta.addEventListener("input", calcularGanancia);


// ESCÁNER DEL FORMULARIO
btnEscanearRegistro.addEventListener("click", () => {

    alert(
        "El escáner de códigos se conectará en el siguiente paso. Por ahora puedes escribir el código manualmente."
    );

});


// ACTUALIZAR CONTADOR DE PRODUCTOS
function escucharInventario() {

    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    totalProductos.textContent = "…";

    const inventarioRef = ref(database, "inventario");

    detenerInventario = onValue(

        inventarioRef,

        (snapshot) => {

            const datos = snapshot.val();

            const cantidad = datos
                ? Object.keys(datos).length
                : 0;

            totalProductos.textContent = cantidad;

        },

        (error) => {

            console.error("Error cargando inventario:", error);
            totalProductos.textContent = "—";

        }

    );

}


// GUARDAR PRODUCTO EN FIREBASE
formProducto.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!auth.currentUser) {
        mensajeProducto.textContent = "Debes iniciar sesión.";
        return;
    }

    const esAdministrador = await comprobarAdministrador();

    if (!esAdministrador) {

        mensajeProducto.textContent =
            "No tienes permisos para registrar productos.";

        return;

    }

    const nombre = nombreProducto.value.trim();
    const codigo = codigoBarras.value.trim();
    const compra = Number(precioCompra.value);
    const venta = Number(precioVenta.value);
    const cantidad = Number(cantidadProducto.value);

    if (!nombre || !codigo) {

        mensajeProducto.textContent =
            "Completa el nombre y el código de barras.";

        return;

    }

    if (/[.#$\[\]/]/.test(codigo)) {

        mensajeProducto.textContent =
            "El código contiene caracteres no permitidos.";

        return;

    }

    if (
        !Number.isFinite(compra) ||
        !Number.isFinite(venta) ||
        compra <= 0 ||
        venta <= 0
    ) {

        mensajeProducto.textContent =
            "Los precios deben ser mayores que cero.";

        return;

    }

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1
    ) {

        mensajeProducto.textContent =
            "La cantidad debe ser un número entero mayor que cero.";

        return;

    }

    const ganancia = ((venta - compra) / compra) * 100;

    btnGuardarProducto.disabled = true;
    mensajeProducto.textContent = "Guardando producto...";

    try {

        const productoRef = ref(
            database,
            "inventario/" + codigo
        );

        const resultado = await runTransaction(

            productoRef,

            (productoActual) => {

                if (productoActual === null) {

                    return {
                        nombre: nombre,
                        codigoBarras: codigo,
                        precioCompra: compra,
                        precioVenta: venta,
                        porcentajeGanancia: Number(ganancia.toFixed(2)),
                        cantidad: cantidad
                    };

                }

                return {
                    ...productoActual,
                    cantidad:
                        Number(productoActual.cantidad || 0) + cantidad
                };

            }

        );

        if (!resultado.committed) {
            throw new Error("No se pudo completar el registro.");
        }

        mensajeProducto.textContent =
            "¡Producto guardado! El inventario se actualizará automáticamente.";

        formProducto.reset();
        porcentajeGanancia.textContent = "0%";

    } catch (error) {

        console.error("Error guardando producto:", error);

        if (error.code === "PERMISSION_DENIED") {

            mensajeProducto.textContent =
                "Firebase rechazó la operación. No tienes permisos.";

        } else {

            mensajeProducto.textContent =
                error.message || "No se pudo guardar el producto.";

        }

    } finally {

        btnGuardarProducto.disabled = false;

    }

});


// CONTROLAR SESIÓN
onAuthStateChanged(auth, async (usuario) => {

    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    totalProductos.textContent = "0";

    if (usuario) {

        mostrarInventario();

        correoUsuario.textContent = usuario.email || "";

        menuDesplegable.hidden = true;

        btnMenuUsuario.setAttribute(
            "aria-expanded",
            "false"
        );

        btnAdministrarUsuarios.hidden = true;
        btnRegistrar.hidden = true;
        seccionAgregar.hidden = true;
        seccionRegistro.hidden = true;

        const esAdministrador = await comprobarAdministrador();

        btnAdministrarUsuarios.hidden = !esAdministrador;
        btnRegistrar.hidden = !esAdministrador;
        seccionAgregar.hidden = !esAdministrador;

        escucharInventario();

    } else {

        mostrarLogin();

        menuDesplegable.hidden = true;
        btnAdministrarUsuarios.hidden = true;
        btnRegistrar.hidden = true;
        seccionAgregar.hidden = true;
        seccionRegistro.hidden = true;

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

        await signInWithEmailAndPassword(
            auth,
            correo,
            contrasena
        );

        mensaje.textContent = "";

    } catch (error) {

        console.error(error);

        if (error.code === "auth/invalid-credential") {

            mensaje.textContent =
                "Correo o contraseña incorrectos.";

        } else if (error.code === "auth/too-many-requests") {

            mensaje.textContent =
                "Demasiados intentos. Intenta más tarde.";

        } else {

            mensaje.textContent =
                "No se pudo iniciar sesión. Intenta nuevamente.";

        }

    } finally {

        botonLogin.disabled = false;

    }

});


console.log("Sistema de inventario iniciado correctamente");
