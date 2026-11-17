
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

// ELEMENTOS DEL INVENTARIO
const listaProductos = document.getElementById("listaProductos");
const totalProductos = document.getElementById("totalProductos");
const mensajeInventario = document.getElementById("mensajeInventario");
const buscarProducto = document.getElementById("buscarProducto");

// VARIABLES DEL INVENTARIO
let productosActuales = [];
let detenerInventario = null;

// FORMATO DE DINERO COLOMBIANO
const formatoDinero = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// ADMINISTRACIÓN DE USUARIOS
btnAdministrarUsuarios.addEventListener("click", () => {
    window.location.href = "usuarios.html";
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
    btnMenuUsuario.setAttribute("aria-expanded", String(!estaAbierto));
});

// CERRAR MENÚ AL PULSAR FUERA
document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".menu-usuario")) {
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
    alert("El escáner de códigos se conectará en el siguiente paso. Por ahora puedes escribir el código manualmente.");
});

// CREAR UNA FILA DE INFORMACIÓN DEL PRODUCTO
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

// MOSTRAR LOS PRODUCTOS EN PANTALLA
function mostrarProductos(productos) {
    listaProductos.replaceChildren();

    const textoBusqueda = buscarProducto.value
        .trim()
        .toLowerCase();

    const productosFiltrados = productos.filter((producto) => {
        const nombre = String(producto.nombre || "").toLowerCase();
        const codigo = String(producto.codigoBarras || "").toLowerCase();

        return nombre.includes(textoBusqueda) ||
            codigo.includes(textoBusqueda);
    });

    if (productosFiltrados.length === 0) {
        const mensajeVacio = document.createElement("p");

        mensajeVacio.className = "inventario-vacio";

        mensajeVacio.textContent = productos.length === 0
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
        cantidad.textContent = "Stock: " + Number(producto.cantidad || 0);

        encabezado.appendChild(nombre);
        encabezado.appendChild(cantidad);

        const codigo = document.createElement("p");
        codigo.className = "codigo-producto";
        codigo.textContent = "Código: " + (producto.codigoBarras || "No disponible");

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

// CONECTAR INVENTARIO CON FIREBASE
function escucharInventario() {
    if (detenerInventario) {
        detenerInventario();
        detenerInventario = null;
    }

    mensajeInventario.textContent = "Cargando productos...";
    listaProductos.replaceChildren();

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

            mensajeInventario.textContent =
                productosActuales.length === 1
                    ? "1 producto registrado"
                    : productosActuales.length + " productos registrados";

            mostrarProductos(productosActuales);
        },

        (error) => {
            console.error("Error cargando inventario:", error);

            mensajeInventario.textContent =
                "No se pudo cargar el inventario. Comprueba tus permisos.";

            listaProductos.replaceChildren();
            productosActuales = [];
            totalProductos.textContent = "0";
        }
    );
}

// BUSCAR PRODUCTOS
buscarProducto.addEventListener("input", () => {
    mostrarProductos(productosActuales);
});

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
        const productoRef = ref(database, "inventario/" + codigo);

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
                    cantidad: Number(productoActual.cantidad || 0) + cantidad
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

    productosActuales = [];
    totalProductos.textContent = "0";
    listaProductos.replaceChildren();

    if (usuario) {
        mostrarInventario();

        correoUsuario.textContent = usuario.email || "";

        menuDesplegable.hidden = true;
        btnMenuUsuario.setAttribute("aria-expanded", "false");

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

        mensajeInventario.textContent = "";
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

console.log("Sistema de inventario iniciado correctamente");
