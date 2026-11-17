
const estado = document.createElement("p");

estado.style.padding = "12px";
estado.style.textAlign = "center";
estado.style.fontWeight = "bold";

document.querySelector("main").prepend(estado);

estado.textContent = "JavaScript está funcionando";

async function comprobarFirebase() {
    try {
        const modulo = await import("./firebase-config.js");

        if (modulo.auth && modulo.database) {
            estado.textContent = "Firebase conectado correctamente";
            estado.style.color = "green";
        }
    } catch (error) {
        estado.textContent = "Error: " + error.message;
        estado.style.color = "red";
        console.error(error);
    }
}

comprobarFirebase();
