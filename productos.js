
import { auth, database } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";


// ELEMENTOS PRINCIPALES
const btnVolver = document.getElementById("btnVolver");
const totalProductos = document.getElementById("totalProductos");
const buscarProducto = document.getElementById("buscarProducto");
const listaProductos = document.getElementById("listaProductos");
const mensajeProductos = document.getElementById("mensajeProductos");


// ELEMENTOS DEL ESCÁNER DE BÚSQUEDA
const btnEscanearBusqueda = document.getElementById("btnEscanearBusqueda");
const panelEscanerBusqueda = document.getElementById("panelEscanerBusqueda");
const lectorCamaraBusqueda = document.getElementById("lectorCamaraBusqueda");
const mensajeEscanerBusqueda = document.getElementById("mensajeEscanerBusqueda");
const btnCerrarEscanerBusqueda = document.getElementById("btnCerrarEscanerBusqueda");


// ELEMENTOS DE LA VENTANA DE EDICIÓN
const modalProducto = document.getElementById("modalProducto");
const tituloModal = document.getElementById("tituloModal");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnEliminarProducto = document.getElementById("btnEliminarProducto");
const btnDuplicarProducto = document.getElementById("btnDuplicarProducto");

const formEditarProducto = document.getElementById("formEditarProducto");
const editarNombre = document.getElementById("editarNombre");
const editarCodigo = document.getElementById("editarCodigo");
const editarPrecioCompra = document.getElementById("editarPrecioCompra");
const editarPrecioVenta = document.getElementById("editarPrecioVenta");
const editarCantidad = document.getElementById("editarCantidad");
const mensajeModal = document.getElementById("mensajeModal");


// VARIABLES
let productosActuales = [];
let detenerInventario = null;
let productoSeleccionado = null;
let esAdministrador = false;
let modoDuplicar = false;

// VARIABLES DEL ESCÁNER
let lectorBusqueda = null;
let escanerBusquedaActivo = false;
let procesandoCodigoBusqueda = false;


// FORMATO DE DINERO
const formatoDinero = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});


// VOLVER
btnVolver.addEventListener("click", async () => {
    await detenerEscanerBusqueda();
    window.location.href = "index.html";
});


// COMPROBAR SI ES ADMINISTRADOR
async function comprobarAdministrador() {

    try {

        await get(ref(database, "usuariosAutorizados"));

        return true;

    } catch (error) {

        console.log("Usuario sin permisos de administrador.");

        return false;

    }

}


// =====================================
// ESCÁNER DEL BUSCADOR
// =====================================

async function detenerEscanerBusqueda() {

    if (lectorBusqueda) {

        try {

            if (escanerBusquedaActivo) {
                await lectorBusqueda.stop();
            }

        } catch (error) {

            console.log("La cámara ya estaba detenida.");

        }

        try {

            await lectorBusqueda.clear();

        } catch (error) {

            console.log("No fue necesario limpiar el lector.");

        }

        lectorBusqueda = null;

    }

    escanerBusquedaActivo = false;
    procesandoCodigoBusqueda = false;

    panelEscanerBusqueda.hidden = true;

}


async function iniciarEscanerBusqueda() {

    if (lectorBusqueda) {
        return;
    }

    if (
        typeof Html5Qrcode === "undefined" ||
        typeof Html5QrcodeSupportedFormats === "undefined"
    ) {

        mensajeEscanerBusqueda.textContent =
            "No se pudo cargar el escáner. Recarga la página e inténtalo nuevamente.";

        panelEscanerBusqueda.hidden = false;

        return;

    }

    panelEscanerBusqueda.hidden = false;

    mensajeEscanerBusqueda.textContent =
        "Solicitando acceso a la cámara...";

    procesandoCodigoBusqueda = false;

    const formatos = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR
    ];

    lectorBusqueda = new Html5Qrcode(
        "lectorCamaraBusqueda",
        {
            formatsToSupport: formatos,
            verbose: false
        }
    );

    try {

        await lectorBusqueda.start(

            { facingMode: "environment" },

            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 120
                }
            },

            async (codigoLeido) => {

                if (procesandoCodigoBusqueda) {
                    return;
                }

                procesandoCodigoBusqueda = true;

                buscarProducto.value = codigoLeido;

                mostrarProductos();

                mensajeEscanerBusqueda.textContent =
                    "Código leído correctamente.";

                await detenerEscanerBusqueda();

                buscarProducto.focus();

            },

            () => {
                // No mostrar mensajes por cada lectura fallida.
            }

        );

        escanerBusquedaActivo = true;

        mensajeEscanerBusqueda.textContent =
            "Apunta la cámara al código de barras del producto.";

    } catch (error) {

        console.error("Error iniciando el escáner:", error);

        mensajeEscanerBusqueda.textContent =
            "No se pudo abrir la cámara. Comprueba los permisos del navegador.";

        try {

            if (lectorBusqueda) {
                await lectorBusqueda.clear();
            }

        } catch (errorLimpieza) {

            console.log("No se pudo limpiar el lector.");

        }

        lectorBusqueda = null;
        escanerBusquedaActivo = false;

    }

}


// ABRIR ESCÁNER DE BÚSQUEDA
btnEscanearBusqueda.addEventListener("click", () => {

    iniciarEscanerBusqueda();

});


// CERRAR ESCÁNER DE BÚSQUEDA
btnCerrarEscanerBusqueda.addEventListener("click", () => {

    detenerEscanerBusqueda();

});


// =====================================
// CERRAR VENTANA DE PRODUCTO
// =====================================

function cerrarModal() {

    modalProducto.hidden = true;

    productoSeleccionado = null;
    modoDuplicar = false;

    formEditarProducto.reset();

    mensajeModal.textContent = "";

}

btnCerrarModal.addEventListener("click", cerrarModal);


// CERRAR AL TOCAR EL FONDO
modalProducto.addEventListener("click", (evento) => {

    if (evento.target === modalProducto) {
        cerrarModal();
    }

});


// =====================================
// ABRIR VENTANA DE PRODUCTO
// =====================================

function abrirModal(producto) {

    if (!esAdministrador) {
        return;
    }

    productoSeleccionado = producto;
    modoDuplicar = false;

    tituloModal.textContent = "Editar producto";

    editarNombre.value = producto.nombre || "";
    editarCodigo.value = producto.codigoBarras || "";
    editarPrecioCompra.value = Number(producto.precioCompra || 0);
    editarPrecioVenta.value = Number(producto.precioVenta || 0);
    editarCantidad.value = Number(producto.cantidad || 0);

    btnEliminarProducto.hidden = false;
    btnDuplicarProducto.hidden = false;

    mensajeModal.textContent = "";

    modalProducto.hidden = false;

}


// =====================================
// MOSTRAR PRODUCTOS
// =====================================

function mostrarProductos() {

    listaProductos.replaceChildren();

    const textoBusqueda = buscarProducto.value
        .trim()
        .toLowerCase();

    const productosFiltrados = productosActuales.filter((producto) => {

        const nombre = String(producto.nombre || "").toLowerCase();
        const codigo = String(producto.codigoBarras || "").toLowerCase();

        return nombre.includes(textoBusqueda) ||
            codigo.includes(textoBusqueda);

    });


    if (productosFiltrados.length === 0) {

        const mensajeVacio = document.createElement("p");

        mensajeVacio.className = "inventario-vacio";

        mensajeVacio.textContent = productosActuales.length === 0
            ? "Todavía no hay productos registrados."
            : "No se encontraron productos.";

        listaProductos.appendChild(mensajeVacio);

        return;

    }


    productosFiltrados.forEach((producto) => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "producto-item";

        const encabezado = document.createElement("div");
        encabezado.className = "encabezado-producto";

        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre || "Producto sin nombre";

        const cantidad = document.createElement("span");
        cantidad.className = "cantidad-producto";

        cantidad.textContent =
            "Stock: " + Number(producto.cantidad || 0);

        encabezado.appendChild(nombre);
        encabezado.appendChild(cantidad);


        const codigo = document.createElement("p");
        codigo.className = "codigo-producto";

        codigo.textContent =
            "Código: " + (producto.codigoBarras || "No disponible");


        const detalles = document.createElement("div");
        detalles.className = "detalles-producto";

        const precio = document.createElement("strong");

        precio.textContent = formatoDinero.format(
            Number(producto.precioVenta || 0)
        );

        detalles.appendChild(precio);


        tarjeta.appendChild(encabezado);
        tarjeta.appendChild(codigo);
        tarjeta.appendChild(detalles);


        // SOLO EL ADMINISTRADOR PUEDE ABRIR LA VENTANA
        if (esAdministrador) {

            tarjeta.addEventListener("click", () => {
                abrirModal(producto);
            });

        }

        listaProductos.appendChild(tarjeta);

    });

}


// BUSCADOR
buscarProducto.addEventListener("input", mostrarProductos);


// =====================================
// ESCUCHAR INVENTARIO
// =====================================

function escucharInventario() {

    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    mensajeProductos.textContent = "Cargando productos...";

    const inventarioRef = ref(database, "inventario");

    detenerInventario = onValue(

        inventarioRef,

        (snapshot) => {

            const datos = snapshot.val();

            productosActuales = datos
                ? Object.entries(datos).map(([codigo, producto]) => ({
                    ...producto,
                    idFirebase: codigo,
                    codigoBarras: producto.codigoBarras || codigo
                }))
                : [];

            totalProductos.textContent = productosActuales.length;

            mensajeProductos.textContent =
                productosActuales.length === 1
                    ? "1 producto registrado"
                    : productosActuales.length + " productos registrados";

            mostrarProductos();

        },

        (error) => {

            console.error("Error cargando inventario:", error);

            mensajeProductos.textContent =
                "No se pudo cargar el inventario. Comprueba tus permisos.";

            productosActuales = [];
            totalProductos.textContent = "—";

            listaProductos.replaceChildren();

        }

    );

}


// =====================================
// VALIDAR CÓDIGO DE BARRAS
// =====================================

function codigoValido(codigo) {

    return codigo !== "" &&
        !/[.#$[\]/\u0000-\u001F\u007F]/.test(codigo);

}


// =====================================
// GUARDAR CAMBIOS O CREAR DUPLICADO
// =====================================

formEditarProducto.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    if (!esAdministrador || !productoSeleccionado) {
        return;
    }

    const nombre = editarNombre.value.trim();
    const codigo = editarCodigo.value.trim();
    const precioCompra = Number(editarPrecioCompra.value);
    const precioVenta = Number(editarPrecioVenta.value);
    const cantidad = Number(editarCantidad.value);

    if (!nombre || !codigoValido(codigo)) {

        mensajeModal.textContent =
            "Escribe un nombre y un código de barras válido.";

        return;

    }

    if (
        !Number.isFinite(precioCompra) ||
        !Number.isFinite(precioVenta) ||
        !Number.isInteger(cantidad) ||
        precioCompra < 0 ||
        precioVenta < 0 ||
        cantidad < 0
    ) {

        mensajeModal.textContent =
            "Comprueba los precios y la cantidad.";

        return;

    }

    const btnGuardar = document.getElementById("btnGuardarCambios");

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {

        const inventarioRef = ref(database, "inventario");

        const snapshot = await get(inventarioRef);
        const inventario = snapshot.val() || {};

        // COMPROBAR QUE EL CÓDIGO NO EXISTA
        if (
            inventario[codigo] &&
            (modoDuplicar || codigo !== productoSeleccionado.idFirebase)
        ) {

            mensajeModal.textContent =
                "Ya existe un producto con ese código de barras.";

            return;

        }


        const porcentajeGanancia = precioCompra > 0
            ? ((precioVenta - precioCompra) / precioCompra) * 100
            : 0;


        const nuevoProducto = {
            ...productoSeleccionado,
            nombre: nombre,
            codigoBarras: codigo,
            precioCompra: precioCompra,
            precioVenta: precioVenta,
            porcentajeGanancia: porcentajeGanancia,
            cantidad: cantidad
        };

        delete nuevoProducto.idFirebase;


        if (modoDuplicar) {

            await set(
                ref(database, "inventario/" + codigo),
                nuevoProducto
            );

            alert("Producto duplicado correctamente.");

        } else {

            const codigoAnterior = productoSeleccionado.idFirebase;

            const cambios = {};

            if (codigoAnterior !== codigo) {
                cambios[codigoAnterior] = null;
            }

            cambios[codigo] = nuevoProducto;

            await update(inventarioRef, cambios);

            alert("Producto actualizado correctamente.");

        }

        cerrarModal();

    } catch (error) {

        console.error("Error guardando producto:", error);

        mensajeModal.textContent =
            "No se pudieron guardar los cambios. Comprueba tus permisos.";

    } finally {

        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar cambios";

    }

});


// =====================================
// DUPLICAR PRODUCTO
// =====================================

btnDuplicarProducto.addEventListener("click", () => {

    if (!productoSeleccionado || !esAdministrador) {
        return;
    }

    modoDuplicar = true;

    tituloModal.textContent = "Duplicar producto";

    editarCodigo.value = "";
    editarCantidad.value = 0;

    mensajeModal.textContent =
        "Asigna un código de barras diferente para crear la copia.";

});


// =====================================
// ELIMINAR PRODUCTO
// =====================================

btnEliminarProducto.addEventListener("click", async () => {

    if (!productoSeleccionado || !esAdministrador) {
        return;
    }

    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
    );

    if (!confirmar) {
        return;
    }

    try {

        await remove(
            ref(database, "inventario/" + productoSeleccionado.idFirebase)
        );

        alert("Producto eliminado correctamente.");

        cerrarModal();

    } catch (error) {

        console.error("Error eliminando producto:", error);

        mensajeModal.textContent =
            "No se pudo eliminar el producto. Comprueba tus permisos.";

    }

});


// =====================================
// COMPROBAR SESIÓN
// =====================================

onAuthStateChanged(auth, async (usuario) => {

    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    await detenerEscanerBusqueda();

    if (!usuario) {

        window.location.href = "index.html";
        return;

    }

    esAdministrador = await comprobarAdministrador();

    escucharInventario();

});


console.log("Página de productos iniciada correctamente");
