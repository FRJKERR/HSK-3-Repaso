/* ===========================================================================
   nav-loader.js · Carga dinámica del menú común (nav.html)
   ---------------------------------------------------------------------------
   - Obtiene «nav.html» con fetch() y lo inyecta en el elemento #nav-placeholder.
   - Se ejecuta solo al cargar la página (DOMContentLoaded).
   - Marca como «.activo» el enlace que corresponde a la página actual.
   - Si la carga falla, muestra un menú mínimo de reserva para no dejar la
     página sin navegación.

   NOTA: fetch() necesita servirse por HTTP(S). En GitHub Pages funciona sin
   más; para probar en local usa un servidor (p. ej. «python3 -m http.server»),
   no abras el archivo con doble clic (file://).
   =========================================================================== */
(function () {
  "use strict";

  function cargarNav() {
    var placeholder = document.getElementById("nav-placeholder");
    if (!placeholder) {
      console.warn("nav-loader: no se encontró el elemento #nav-placeholder.");
      return;
    }

    fetch("nav.html")
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;
        marcarActivo(placeholder);
      })
      .catch(function (err) {
        console.error("nav-loader: no se pudo cargar nav.html →", err);
        // Menú de reserva (sin estilos del partial) para mantener la navegación.
        placeholder.innerHTML =
          '<nav class="main-nav" aria-label="Niveles HSK"><ul class="nav-list">' +
          '<li><a href="hsk2.html">HSK 2</a></li>' +
          '<li><a href="index.html">HSK 3</a></li>' +
          "</ul></nav>";
        marcarActivo(placeholder);
      });
  }

  function marcarActivo(scope) {
    // Nombre del archivo abierto; en la raíz del sitio ("/") equivale a index.html.
    var actual = window.location.pathname.split("/").pop();
    if (!actual) actual = "index.html";

    var enlaces = scope.querySelectorAll(".nav-list a");
    for (var i = 0; i < enlaces.length; i++) {
      var href = enlaces[i].getAttribute("href") || "";
      var destino = href.split("/").pop();
      if (destino === actual) {
        enlaces[i].classList.add("activo");
        enlaces[i].setAttribute("aria-current", "page");
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargarNav);
  } else {
    cargarNav();
  }
})();
