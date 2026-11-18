
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
    onValue,
    update,
    push
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";


// ==========================================
// ELEMENTOS DEL LOGIN
// ==========================================

const pantallaLogin = document.getElementById("pantallaLogin");
const aplicacion = document.getElementById("aplicacion");
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensajeLogin");
const botonLogin = document.getElementById("btnLogin");


// ==========================================
// ELEMENTOS DEL MENÚ
// ==========================================

const btnMenuUsuario = document.getElementById("btnMenuUsuario");
const menuDesplegable = document.getElementById("menuDesplegable");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnAdministrarUsuarios = document.getElementById("btnAdministrarUsuarios");
const correoUsuario = document.getElementById("correoUsuario");


// ==========================================
// ELEMENTOS DE PRODUCTOS
// ==========================================

const btnInventario = document.getElementById("btnInventario");
const totalProductos = document.getElementById("totalProductos");


// ==========================================
// ELEMENTOS DEL REGISTRO
// ==========================================

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


// ==========================================
// ELEMENTOS DEL ESCÁNER DE REGISTRO
// ==========================================

const panelEscanerRegistro = document.getElementById("panelEscanerRegistro");
const lectorCamaraRegistro = document.getElementById("lectorCamaraRegistro");
const mensajeEscanerRegistro = document.getElementById("mensajeEscanerRegistro");
const btnCerrarEscanerRegistro = document.getElementById("btnCerrarEscanerRegistro");


// ==========================================
// ELEMENTOS DEL MÓDULO DE VENTAS
// ==========================================

const btnAbrirVentas = document.getElementById("btnAbrirVentas");
const modalVentas = document.getElementById("modalVentas");
const btnCerrarVentas = document.getElementById("btnCerrarVentas");

const buscarVenta = document.getElementById("buscarVenta");
const btnEscanearVenta = document.getElementById("btnEscanearVenta");

const panelEscanerVenta = document.getElementById("panelEscanerVenta");
const lectorCamaraVenta = document.getElementById("lectorCamaraVenta");
const mensajeEscanerVenta = document.getElementById("mensajeEscanerVenta");
const btnCerrarEscanerVenta = document.getElementById("btnCerrarEscanerVenta");

const resultadosVenta = document.getElementById("resultadosVenta");
const mensajeBusquedaVenta = document.getElementById("mensajeBusquedaVenta");

const listaCarrito = document.getElementById("listaCarrito");
const totalVenta = document.getElementById("totalVenta");
const btnVender = document.getElementById("btnVender");
const mensajeVenta = document.getElementById("mensajeVenta");

const btnMostrarHistorial = document.getElementById("btnMostrarHistorial");
const contenidoHistorial = document.getElementById("contenidoHistorial");
const listaHistorial = document.getElementById("listaHistorial");
const mensajeHistorial = document.getElementById("mensajeHistorial");


// ==========================================
// VARIABLES GENERALES
// ==========================================

let detenerInventario = null;

let inventarioActual = {};

let esAdministrador = false;

let procesandoVenta = false;

// ==========================================
// VARIABLES DEL ESCÁNER DE REGISTRO
// ==========================================

let lectorCodigoRegistro = null;
let escanerRegistroActivo = false;
let procesandoCodigoRegistro = false;


// ==========================================
// VARIABLES DEL ESCÁNER DE VENTAS
// ==========================================

let lectorCodigoVenta = null;
let escanerVentaActivo = false;
let procesandoCodigoVenta = false;


// ==========================================
// VARIABLES DEL CARRITO
// ==========================================

// Cada producto se identifica por su código de barras.

const carrito = {};


// ==========================================
// FORMATO DE DINERO
// ==========================================

const formatoDinero = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

function dinero(valor) {
    return formatoDinero.format(Number(valor) || 0);
}


// ==========================================
// ADMINISTRAR USUARIOS
// ==========================================

btnAdministrarUsuarios.addEventListener("click", () => {
    window.location.href = "usuarios.html";
});


// ==========================================
// ABRIR PÁGINA DE PRODUCTOS
// ==========================================

btnInventario.addEventListener("click", () => {
    window.location.href = "productos.html";
});


// ==========================================
// MOSTRAR LOGIN
// ==========================================

function mostrarLogin() {
    pantallaLogin.hidden = false;
    aplicacion.hidden = true;
}


// ==========================================
// MOSTRAR INVENTARIO
// ==========================================

function mostrarInventario() {
    pantallaLogin.hidden = true;
    aplicacion.hidden = false;
}


// ==========================================
// ABRIR Y CERRAR MENÚ
// ==========================================

btnMenuUsuario.addEventListener("click", () => {

    const estaAbierto = !menuDesplegable.hidden;

    menuDesplegable.hidden = estaAbierto;

    btnMenuUsuario.setAttribute(
        "aria-expanded",
        String(!estaAbierto)
    );

});


document.addEventListener("click", (evento) => {

    if (!evento.target.closest(".menu-usuario")) {

        menuDesplegable.hidden = true;

        btnMenuUsuario.setAttribute(
            "aria-expanded",
            "false"
        );

    }

});


// ==========================================
// COMPROBAR SI ES ADMINISTRADOR
// ==========================================

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


// ==========================================
// DETENER ESCÁNER DE REGISTRO
// ==========================================

async function detenerEscanerRegistro() {

    if (lectorCodigoRegistro) {

        try {

            if (escanerRegistroActivo) {
                await lectorCodigoRegistro.stop();
            }

            await lectorCodigoRegistro.clear();

        } catch (error) {

            console.error("Error deteniendo escáner de registro:", error);

        }

    }

    lectorCodigoRegistro = null;
    escanerRegistroActivo = false;
    procesandoCodigoRegistro = false;

    panelEscanerRegistro.hidden = true;

}


// ==========================================
// INICIAR ESCÁNER DE REGISTRO
// ==========================================

async function iniciarEscanerRegistro() {

    if (escanerRegistroActivo || lectorCodigoRegistro) {
        return;
    }

    if (
        typeof Html5Qrcode === "undefined" ||
        typeof Html5QrcodeSupportedFormats === "undefined"
    ) {

        mensajeEscanerRegistro.textContent =
            "No se pudo cargar el escáner. Recarga la página.";

        panelEscanerRegistro.hidden = false;

        return;

    }

    panelEscanerRegistro.hidden = false;

    mensajeEscanerRegistro.textContent =
        "Solicitando acceso a la cámara...";

    procesandoCodigoRegistro = false;

    try {

        const formatos = obtenerFormatosEscaner();

        lectorCodigoRegistro = new Html5Qrcode(
            "lectorCamaraRegistro",
            {
                formatsToSupport: formatos,
                verbose: false
            }
        );

        await lectorCodigoRegistro.start(

            { facingMode: "environment" },

            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 120
                }
            },

            async (codigoLeido) => {

                if (procesandoCodigoRegistro) {
                    return;
                }

                procesandoCodigoRegistro = true;

                codigoBarras.value = codigoLeido;

                mensajeEscanerRegistro.textContent =
                    "¡Código leído correctamente!";

                await detenerEscanerRegistro();

                codigoBarras.focus();

            },

            () => {}

        );

        escanerRegistroActivo = true;

        mensajeEscanerRegistro.textContent =
            "Apunta la cámara al código de barras.";

    } catch (error) {

        console.error("Error iniciando escáner de registro:", error);

        await detenerEscanerRegistro();

        panelEscanerRegistro.hidden = false;

        mensajeEscanerRegistro.textContent =
            "No se pudo iniciar la cámara. Comprueba los permisos.";

    }

}


function obtenerFormatosEscaner() {

    return [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR
    ];

}


btnEscanearRegistro.addEventListener(
    "click",
    iniciarEscanerRegistro
);

btnCerrarEscanerRegistro.addEventListener(
    "click",
    detenerEscanerRegistro
);


// ==========================================
// ABRIR FORMULARIO DE REGISTRO
// ==========================================

btnRegistrar.addEventListener("click", () => {

    seccionRegistro.hidden = false;

    mensajeProducto.textContent = "";

    seccionRegistro.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


// ==========================================
// CERRAR FORMULARIO DE REGISTRO
// ==========================================

btnCerrarFormulario.addEventListener("click", async () => {

    await detenerEscanerRegistro();

    seccionRegistro.hidden = true;

    formProducto.reset();

    porcentajeGanancia.textContent = "0%";

    mensajeProducto.textContent = "";

});


// ==========================================
// CALCULAR PORCENTAJE DE GANANCIA
// ==========================================

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


// ==========================================
// GUARDAR PRODUCTO EN FIREBASE
// ==========================================

formProducto.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!auth.currentUser) {

        mensajeProducto.textContent =
            "Debes iniciar sesión.";

        return;

    }

    const administrador = await comprobarAdministrador();

    if (!administrador) {

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
            "La cantidad debe ser un entero mayor que cero.";

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
            "¡Producto guardado correctamente!";

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


// ==========================================
// ESCUCHAR INVENTARIO
// ==========================================

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

            inventarioActual = datos || {};

            totalProductos.textContent =
                Object.keys(inventarioActual).length;

            // Actualizar los resultados si la ventana está abierta.

            if (!modalVentas.hidden) {
                buscarProductosVenta();
            }

            // Actualizar el carrito con las existencias actuales.

            renderizarCarrito();

        },

        (error) => {

            console.error("Error cargando inventario:", error);

            totalProductos.textContent = "—";

            inventarioActual = {};

        }

    );

}


// ==========================================
// ABRIR VENTANA DE VENTAS
// ==========================================

btnAbrirVentas.addEventListener("click", async () => {

    if (!auth.currentUser) {
        return;
    }

    await detenerEscanerRegistro();

    seccionRegistro.hidden = true;
    modalVentas.hidden = false;

    buscarVenta.focus();

    mensajeVenta.textContent = esAdministrador
        ? "Agrega los productos y confirma la venta."
        : "Puedes consultar productos y el historial. La confirmación está reservada al administrador.";

    buscarProductosVenta();
    renderizarCarrito();

});


// ==========================================
// CERRAR VENTANA DE VENTAS
// ==========================================

async function cerrarVentanaVentas() {

    await detenerEscanerVenta();

    modalVentas.hidden = true;

    resultadosVenta.hidden = true;

    buscarVenta.value = "";

    mensajeBusquedaVenta.textContent = "";

}


btnCerrarVentas.addEventListener(
    "click",
    cerrarVentanaVentas
);


modalVentas.addEventListener("click", (evento) => {

    if (evento.target === modalVentas) {
        cerrarVentanaVentas();
    }

});


// ==========================================
// BUSCAR PRODUCTOS PARA VENDER
// ==========================================

buscarVenta.addEventListener("input", () => {

    buscarProductosVenta();

});


function buscarProductosVenta() {

    const busqueda = buscarVenta.value
        .trim()
        .toLowerCase();

    resultadosVenta.innerHTML = "";

    if (!busqueda) {

        resultadosVenta.hidden = true;

        mensajeBusquedaVenta.textContent = "";

        return;

    }

    const productos = Object.entries(inventarioActual)
        .filter(([codigo, producto]) => {

            const nombre = String(producto.nombre || "").toLowerCase();

            const codigoProducto = String(
                producto.codigoBarras || codigo
            ).toLowerCase();

            return (
                nombre.includes(busqueda) ||
                codigo.toLowerCase().includes(busqueda) ||
                codigoProducto.includes(busqueda)
            );

        })
        .slice(0, 30);

    resultadosVenta.hidden = false;

    if (productos.length === 0) {

        mensajeBusquedaVenta.textContent =
            "No se encontraron productos.";

        return;

    }

    mensajeBusquedaVenta.textContent =
        productos.length + " producto(s) encontrado(s).";

    productos.forEach(([codigo, producto]) => {

        const tarjeta = document.createElement("div");

        tarjeta.className = "resultado-producto-venta";

        const datos = document.createElement("div");

        datos.className = "datos-resultado-venta";

        const nombre = document.createElement("strong");

        nombre.textContent = producto.nombre || "Producto sin nombre";

        const detalle = document.createElement("span");

        detalle.textContent =
            dinero(producto.precioVenta) +
            " · Existencias: " +
            Number(producto.cantidad || 0);

        const boton = document.createElement("button");

        boton.type = "button";

        boton.textContent = "Agregar";

        boton.dataset.codigo = codigo;

        boton.className = "btn-agregar-venta";

        boton.disabled =
            !Number.isFinite(Number(producto.cantidad)) ||
            Number(producto.cantidad) <= 0;

        datos.append(nombre, detalle);

        tarjeta.append(datos, boton);

        resultadosVenta.appendChild(tarjeta);

    });

}


// ==========================================
// AGREGAR PRODUCTOS AL CARRITO
// ==========================================

resultadosVenta.addEventListener("click", (evento) => {

    const boton = evento.target.closest(".btn-agregar-venta");

    if (!boton) {
        return;
    }

    agregarAlCarrito(boton.dataset.codigo);

});


function agregarAlCarrito(codigo) {

    const producto = inventarioActual[codigo];

    if (!producto) {

        mensajeBusquedaVenta.textContent =
            "El producto ya no está disponible.";

        return;

    }

    const stock = Number(producto.cantidad || 0);

    if (!Number.isInteger(stock) || stock <= 0) {

        mensajeBusquedaVenta.textContent =
            "Este producto no tiene existencias.";

        return;

    }

    const cantidadActual = carrito[codigo]
        ? carrito[codigo].cantidad
        : 0;

    if (cantidadActual + 1 > stock) {

        mensajeBusquedaVenta.textContent =
            "No hay suficientes existencias.";

        return;

    }

    carrito[codigo] = {
        cantidad: cantidadActual + 1
    };

    mensajeBusquedaVenta.textContent =
        "Producto agregado al carrito.";

    renderizarCarrito();

}


// ==========================================
// RENDERIZAR CARRITO
// ==========================================

function renderizarCarrito() {

    listaCarrito.innerHTML = "";

    let total = 0;

    const codigos = Object.keys(carrito);

    if (codigos.length === 0) {

        const vacio = document.createElement("p");

        vacio.className = "carrito-vacio";

        vacio.textContent =
            "Todavía no has agregado productos.";

        listaCarrito.appendChild(vacio);

    }

    codigos.forEach((codigo) => {

        const producto = inventarioActual[codigo];

        if (!producto) {
            return;
        }

        const cantidad = carrito[codigo].cantidad;

        const stock = Number(producto.cantidad || 0);

        const precio = Number(producto.precioVenta || 0);

        const subtotal = precio * cantidad;

        total += subtotal;

        const tarjeta = document.createElement("div");

        tarjeta.className = "item-carrito";

        const datos = document.createElement("div");

        datos.className = "datos-item-carrito";

        const nombre = document.createElement("strong");

        nombre.textContent = producto.nombre || "Producto";

        const subtotalTexto = document.createElement("span");

        subtotalTexto.textContent = dinero(subtotal);

        datos.append(nombre, subtotalTexto);


        const controles = document.createElement("div");

        controles.className = "controles-cantidad";


        const botonMenos = document.createElement("button");

        botonMenos.type = "button";

        botonMenos.textContent = "−";

        botonMenos.dataset.accion = "restar";

        botonMenos.dataset.codigo = codigo;


        const inputCantidad = document.createElement("input");

        inputCantidad.type = "number";

        inputCantidad.min = "1";

        inputCantidad.max = String(stock);

        inputCantidad.step = "1";

        inputCantidad.value = String(cantidad);

        inputCantidad.dataset.accion = "cantidad";

        inputCantidad.dataset.codigo = codigo;


        const botonMas = document.createElement("button");

        botonMas.type = "button";

        botonMas.textContent = "+";

        botonMas.dataset.accion = "sumar";

        botonMas.dataset.codigo = codigo;

        botonMas.disabled = cantidad >= stock;


        const botonEliminar = document.createElement("button");

        botonEliminar.type = "button";

        botonEliminar.textContent = "✕";

        botonEliminar.className = "btn-eliminar-carrito";

        botonEliminar.dataset.accion = "eliminar";

        botonEliminar.dataset.codigo = codigo;


        controles.append(
            botonMenos,
            inputCantidad,
            botonMas,
            botonEliminar
        );

        tarjeta.append(datos, controles);

        listaCarrito.appendChild(tarjeta);

    });

    totalVenta.textContent = dinero(total);

    // La confirmación permanece desactivada en esta etapa.

    btnVender.disabled =
    !esAdministrador ||
    codigos.length === 0 ||
    procesandoVenta;

}


// ==========================================
// MODIFICAR CANTIDADES DEL CARRITO
// ==========================================

listaCarrito.addEventListener("click", (evento) => {

    const boton = evento.target.closest("button");

    if (!boton) {
        return;
    }

    const codigo = boton.dataset.codigo;

    const accion = boton.dataset.accion;

    if (!codigo || !carrito[codigo]) {
        return;
    }

    const producto = inventarioActual[codigo];

    if (!producto) {
        return;
    }

    const stock = Number(producto.cantidad || 0);

    if (accion === "sumar") {

        if (carrito[codigo].cantidad < stock) {
            carrito[codigo].cantidad++;
        }

    }

    if (accion === "restar") {

        carrito[codigo].cantidad--;

        if (carrito[codigo].cantidad <= 0) {
            delete carrito[codigo];
        }

    }

    if (accion === "eliminar") {

        delete carrito[codigo];

    }

    renderizarCarrito();

});


listaCarrito.addEventListener("change", (evento) => {

    const input = evento.target;

    if (input.dataset.accion !== "cantidad") {
        return;
    }

    const codigo = input.dataset.codigo;

    if (!carrito[codigo]) {
        return;
    }

    const producto = inventarioActual[codigo];

    if (!producto) {
        return;
    }

    const cantidad = Number(input.value);

    const stock = Number(producto.cantidad || 0);

    if (
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > stock
    ) {

        mensajeVenta.textContent =
            "La cantidad debe estar entre 1 y las existencias disponibles.";

        renderizarCarrito();

        return;

    }

    carrito[codigo].cantidad = cantidad;

    mensajeVenta.textContent = "";

    renderizarCarrito();

});


// ==========================================
// DETENER ESCÁNER DE VENTAS
// ==========================================

async function detenerEscanerVenta() {

    if (lectorCodigoVenta) {

        try {

            if (escanerVentaActivo) {
                await lectorCodigoVenta.stop();
            }

            await lectorCodigoVenta.clear();

        } catch (error) {

            console.error("Error deteniendo escáner de ventas:", error);

        }

    }

    lectorCodigoVenta = null;

    escanerVentaActivo = false;

    procesandoCodigoVenta = false;

    panelEscanerVenta.hidden = true;

}


// ==========================================
// INICIAR ESCÁNER DE VENTAS
// ==========================================

btnEscanearVenta.addEventListener(
    "click",
    iniciarEscanerVenta
);


btnCerrarEscanerVenta.addEventListener(
    "click",
    detenerEscanerVenta
);


async function iniciarEscanerVenta() {

    if (escanerVentaActivo || lectorCodigoVenta) {
        return;
    }

    await detenerEscanerRegistro();

    if (
        typeof Html5Qrcode === "undefined" ||
        typeof Html5QrcodeSupportedFormats === "undefined"
    ) {

        mensajeEscanerVenta.textContent =
            "No se pudo cargar el escáner. Recarga la página.";

        panelEscanerVenta.hidden = false;

        return;

    }

    panelEscanerVenta.hidden = false;

    mensajeEscanerVenta.textContent =
        "Solicitando acceso a la cámara...";

    procesandoCodigoVenta = false;

    try {

        lectorCodigoVenta = new Html5Qrcode(
            "lectorCamaraVenta",
            {
                formatsToSupport: obtenerFormatosEscaner(),
                verbose: false
            }
        );

        await lectorCodigoVenta.start(

            { facingMode: "environment" },

            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 120
                }
            },

            async (codigoLeido) => {

                if (procesandoCodigoVenta) {
                    return;
                }

                procesandoCodigoVenta = true;

                await detenerEscanerVenta();

                buscarVenta.value = codigoLeido;

                buscarProductosVenta();

                const productoEncontrado =
                    inventarioActual[codigoLeido];

                if (productoEncontrado) {

                    agregarAlCarrito(codigoLeido);

                    mensajeBusquedaVenta.textContent =
                        "Producto escaneado y agregado al carrito.";

                } else {

                    mensajeBusquedaVenta.textContent =
                        "No encontramos ese código. Comprueba que esté registrado.";

                }

                buscarVenta.focus();

            },

            () => {}

        );

        escanerVentaActivo = true;

        mensajeEscanerVenta.textContent =
            "Apunta la cámara al código de barras.";

    } catch (error) {

        console.error("Error iniciando escáner de ventas:", error);

        await detenerEscanerVenta();

        panelEscanerVenta.hidden = false;

        mensajeEscanerVenta.textContent =
            "No se pudo iniciar la cámara. Comprueba los permisos.";

    }

}


// ==========================================
// FECHAS Y HORAS DE COLOMBIA
// ==========================================

function obtenerDiaBogota(timestamp) {

    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date(timestamp));

    const obtener = (tipo) =>
        partes.find(parte => parte.type === tipo).value;

    return (
        obtener("year") + "-" +
        obtener("month") + "-" +
        obtener("day")
    );

}


function formatearFechaBogota(dia) {

    const [anio, mes, diaMes] = dia.split("-").map(Number);

    const fecha = new Date(anio, mes - 1, diaMes, 12);

    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(fecha);

}


function formatearHoraBogota(timestamp) {

    return new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(new Date(timestamp));

}


// ==========================================
// CONFIRMAR VENTA
// ==========================================

btnVender.addEventListener("click", confirmarVenta);


async function confirmarVenta() {

    if (procesandoVenta) {
        return;
    }

    if (!auth.currentUser || !esAdministrador) {

        mensajeVenta.textContent =
            "No tienes permisos para confirmar ventas.";

        return;

    }

    const codigos = Object.keys(carrito);

    if (codigos.length === 0) {

        mensajeVenta.textContent =
            "Agrega al menos un producto.";

        return;

    }

    procesandoVenta = true;

    btnVender.disabled = true;

    mensajeVenta.textContent =
        "Verificando existencias y registrando venta...";

    try {

        // Consultar nuevamente el inventario directamente en Firebase.

        const resultadoInventario = await get(
            ref(database, "inventario")
        );

        if (!resultadoInventario.exists()) {
            throw new Error("No hay productos registrados.");
        }

        const inventarioFresco = resultadoInventario.val();

        const productosVenta = [];

        let total = 0;

        const actualizaciones = {};

        // Revisar cada producto del carrito.

        for (const codigo of codigos) {

            const producto = inventarioFresco[codigo];

            if (!producto) {

                throw new Error(
                    "El producto con código " + codigo +
                    " ya no existe en el inventario."
                );

            }

            const cantidad = Number(carrito[codigo].cantidad);

            const stock = Number(producto.cantidad);

            const precio = Number(producto.precioVenta);

            if (
                !Number.isInteger(cantidad) ||
                cantidad < 1
            ) {

                throw new Error(
                    "Hay una cantidad inválida en el carrito."
                );

            }

            if (
                !Number.isInteger(stock) ||
                stock < cantidad
            ) {

                throw new Error(
                    "Existencias insuficientes para: " +
                    producto.nombre +
                    ". Disponibles: " + (stock || 0)
                );

            }

            if (
                !Number.isFinite(precio) ||
                precio <= 0
            ) {

                throw new Error(
                    "El precio de " +
                    producto.nombre +
                    " no es válido."
                );

            }

            const subtotal = precio * cantidad;

            total += subtotal;

            productosVenta.push({

                codigoBarras: codigo,

                nombre: String(producto.nombre || "Producto"),

                cantidad: cantidad,

                precioUnitario: precio,

                subtotal: subtotal

            });

            // Preparar el descuento del inventario.

            actualizaciones[
                "inventario/" + codigo + "/cantidad"
            ] = stock - cantidad;

        }

        if (
            !Number.isFinite(total) ||
            total <= 0
        ) {

            throw new Error("El total de la venta no es válido.");

        }

        // Crear un identificador único para la venta.

        const referenciaVenta = push(ref(database, "ventas"));

        const idVenta = referenciaVenta.key;

        if (!idVenta) {
            throw new Error("No se pudo generar el número de venta.");
        }

        const fechaHora = Date.now();

        const dia = obtenerDiaBogota(fechaHora);

        const venta = {

            fechaHora: fechaHora,

            dia: dia,

            vendedor: {
                uid: auth.currentUser.uid,
                correo: auth.currentUser.email || "Sin correo"
            },

            productos: productosVenta,

            total: total

        };

        // Añadir el registro de venta a la misma actualización
        // que descuenta las existencias.

        actualizaciones["ventas/" + idVenta] = venta;

        // Firebase aplica todas las rutas juntas o ninguna.

        await update(
            ref(database),
            actualizaciones
        );

        // Limpiar el carrito después de guardar correctamente.

        Object.keys(carrito).forEach(codigo => {
            delete carrito[codigo];
        });

        renderizarCarrito();

        buscarProductosVenta();

        mensajeVenta.textContent =
            "¡Venta registrada correctamente! Total: " +
            dinero(total);

        // Actualizar el historial si está abierto.

        if (!contenidoHistorial.hidden) {
            await cargarHistorialVentas();
        }

    } catch (error) {

        console.error("Error confirmando venta:", error);

        if (error.code === "PERMISSION_DENIED") {

            mensajeVenta.textContent =
                "Firebase rechazó la venta. Comprueba los permisos.";

        } else {

            mensajeVenta.textContent =
                error.message || "No se pudo registrar la venta.";

        }

    } finally {

        procesandoVenta = false;

        renderizarCarrito();

    }

}


// ==========================================
// MOSTRAR Y OCULTAR HISTORIAL
// ==========================================

btnMostrarHistorial.addEventListener("click", async () => {

    const estaAbierto = !contenidoHistorial.hidden;

    contenidoHistorial.hidden = estaAbierto;

    btnMostrarHistorial.setAttribute(
        "aria-expanded",
        String(!estaAbierto)
    );

    if (!estaAbierto) {
        await cargarHistorialVentas();
    }

});


// ==========================================
// CARGAR HISTORIAL DESDE FIREBASE
// ==========================================

async function cargarHistorialVentas() {

    listaHistorial.innerHTML = "";

    mensajeHistorial.textContent =
        "Cargando historial...";

    try {

        const resultado = await get(
            ref(database, "ventas")
        );

        if (!resultado.exists()) {

            mensajeHistorial.textContent =
                "Todavía no hay ventas registradas.";

            return;

        }

        const ventas = Object.entries(resultado.val());

        // Ordenar de la más reciente a la más antigua.

        ventas.sort((a, b) => {

            return Number(b[1].fechaHora || 0) -
                   Number(a[1].fechaHora || 0);

        });

        // Agrupar las ventas por día en Colombia.

        const ventasPorDia = {};

        ventas.forEach(([id, venta]) => {

            const timestamp = Number(venta.fechaHora);

            if (!Number.isFinite(timestamp)) {
                return;
            }

            const dia = venta.dia || obtenerDiaBogota(timestamp);

            if (!ventasPorDia[dia]) {
                ventasPorDia[dia] = [];
            }

            ventasPorDia[dia].push({
                id,
                ...venta
            });

        });

        const dias = Object.keys(ventasPorDia).sort().reverse();

        if (dias.length === 0) {

            mensajeHistorial.textContent =
                "No se encontraron ventas válidas.";

            return;

        }

        mensajeHistorial.textContent = "";

        dias.forEach(dia => {

            const ventasDelDia = ventasPorDia[dia];

            const totalDia = ventasDelDia.reduce(
                (suma, venta) => suma + Number(venta.total || 0),
                0
            );

            // Contenedor del día.

            const grupo = document.createElement("section");

            grupo.className = "grupo-historial-ventas";

            // Encabezado del día.

            const encabezado = document.createElement("div");

            encabezado.className = "encabezado-dia-historial";

            const titulo = document.createElement("h3");

            titulo.textContent = formatearFechaBogota(dia);

            const resumen = document.createElement("p");

            resumen.textContent =
                ventasDelDia.length + " venta(s) · " +
                dinero(totalDia);

            encabezado.append(titulo, resumen);

            grupo.appendChild(encabezado);

            // Detalle de cada venta.

            ventasDelDia.forEach(venta => {

                const tarjeta = document.createElement("article");

                tarjeta.className = "tarjeta-historial-venta";

                const hora = document.createElement("strong");

                hora.textContent =
                    formatearHoraBogota(Number(venta.fechaHora));

                const vendedor = document.createElement("p");

                vendedor.textContent =
                    "Vendedor: " +
                    String(
                        venta.vendedor?.correo || "No identificado"
                    );

                const detalle = document.createElement("div");

                detalle.className = "detalle-historial-venta";

                const productos = Array.isArray(venta.productos)
                    ? venta.productos
                    : [];

                productos.forEach(producto => {

                    const linea = document.createElement("p");

                    linea.textContent =
                        String(producto.nombre || "Producto") +
                        " · " +
                        Number(producto.cantidad || 0) +
                        " x " +
                        dinero(producto.precioUnitario) +
                        " = " +
                        dinero(producto.subtotal);

                    detalle.appendChild(linea);

                });

                const totalVentaTexto = document.createElement("strong");

                totalVentaTexto.className = "total-historial-venta";

                totalVentaTexto.textContent =
                    "Total: " + dinero(venta.total);

                tarjeta.append(
                    hora,
                    vendedor,
                    detalle,
                    totalVentaTexto
                );

                grupo.appendChild(tarjeta);

            });

            listaHistorial.appendChild(grupo);

        });

    } catch (error) {

        console.error("Error cargando historial:", error);

        mensajeHistorial.textContent =
            error.code === "PERMISSION_DENIED"
                ? "No tienes permisos para consultar el historial."
                : "No se pudo cargar el historial.";

    }

}


// ==========================================
// CONTROLAR SESIÓN
// ==========================================

onAuthStateChanged(auth, async (usuario) => {

    if (detenerInventario) {

        detenerInventario();

        detenerInventario = null;

    }

    await detenerEscanerRegistro();

    await detenerEscanerVenta();

    modalVentas.hidden = true;

    inventarioActual = {};

    Object.keys(carrito).forEach((codigo) => {
        delete carrito[codigo];
    });

    totalProductos.textContent = "0";

    esAdministrador = false;

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

        esAdministrador = await comprobarAdministrador();

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


// ==========================================
// INICIAR SESIÓN
// ==========================================

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const correo = document.getElementById("correo").value.trim();

    const contrasena =
        document.getElementById("contrasena").value;

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


// ==========================================
// CERRAR SESIÓN
// ==========================================

btnCerrarSesion.addEventListener("click", async () => {

    try {

        await detenerEscanerRegistro();

        await detenerEscanerVenta();

        await signOut(auth);

        menuDesplegable.hidden = true;

    } catch (error) {

        console.error("Error al cerrar sesión:", error);

        alert("No se pudo cerrar la sesión.");

    }

});


console.log("Sistema de inventario y módulo de ventas iniciado correctamente");
