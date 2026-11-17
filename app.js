
import { auth, database } from "./firebase-config.js";

const estado = document.createElement("p");

estado.style.padding = "12px";
estado.style.textAlign = "center";
estado.style.fontWeight = "bold";

document.querySelector("main").prepend(estado);

try {
    if (auth && database) {
        estado.textContent = "Firebase conectado correctamente";
        estado.style.color = "green";
        console.log("Firebase conectado correctamente");
    }
} catch (error) {
    estado.textContent = "Error al conectar con Firebase";
    estado.style.color = "red";
    console.error(error);
}
