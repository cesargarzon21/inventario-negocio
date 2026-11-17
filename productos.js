import { auth, database } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";


// ELEMENTOS
const btnVolver = document.getElementById("btnVolver");
const totalProductos = document.getElementById("totalProductos");
const buscarProducto = document.getElementById("buscarProducto");
const listaProductos = document.getElementById("listaProductos");
const mensajeProductos = document.getElementById("mensajeProductos");


// VARIABLES
let productosActuales = [];
let detenerInventario = null;


// FORMATO DE DINERO COLOMBIANO
const formatoDinero = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});


// VOLVER AL INVENTARIO
btnVolver.addEventListener("click", () => {
    window.location.href = "index.html";
});


// CREAR DATO DEL PRODUCTO
function crearDatoProducto(etiqueta, valor) {

    const fila = document.createElement("div");
    fila.className = "dato-producto";

    const titulo = document.createElement("span");
    titulo.textContent = etiqueta;

    const contenido = document.createElement("strong");
    contenido.textContent = valor;

    fila.appendChild(titulo);
    fila.appendChild(contenido);

    return fila;

}


// MOSTRAR PRODUCTOS
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


        detalles.appendChild(
            crearDatoProducto(
                "Precio de compra",
                formatoDinero.format(Number(producto.precioCompra || 0))
            )
        );

        detalles.appendChild(
            crearDatoProducto(
                "Precio de venta",
                formatoDinero.format(Number(producto.precioVenta || 0))
            )
        );

        detalles.appendChild(
            crearDatoProducto(
                "Ganancia",
                Number(producto.porcentajeGanancia || 0).toFixed(2) + "%"
            )
        );


        tarjeta.appendChild(encabezado);
        tarjeta.appendChild(codigo);
        tarjeta.appendChild(detalles);

        listaProductos.appendChild(tarjeta);

    });

}


// BUSCADOR
buscarProducto.addEventListener("input", mostrarProductos);


// ESCUCHAR INVENTARIO EN FIREBASE
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


// COMPROBAR SESIÓN
onAuthStateChanged(auth, (usuario) => {

    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    if (!usuario) {

        window.location.href = "index.html";
        return;

    }

    escucharInventario();

});


console.log("Página de productos iniciada correctamente");
