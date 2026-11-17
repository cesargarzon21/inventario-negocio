
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensajeLogin");

if (formulario && mensaje) {
    mensaje.textContent = "JavaScript está funcionando correctamente";
    mensaje.style.color = "green";

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        mensaje.textContent = "Formulario interceptado correctamente";
        mensaje.style.color = "green";
    });
} else {
    document.body.insertAdjacentHTML(
        "afterbegin",
        "<p style='color:red'>No se encontró el formulario</p>"
    );
}
