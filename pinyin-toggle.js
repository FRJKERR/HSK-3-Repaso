/* ===========================================================================
   pinyin-toggle.js · Guía fonética pinyin opcional para los ejemplos
   ---------------------------------------------------------------------------
   - Recorre todos los <span class="zh-ex"> y les añade el pinyin generado
     automáticamente con pinyin-pro (CDN).
   - Aplica correcciones para las partículas estructurales que la librería
     lee mal (得 de complemento, 地 adverbial, 教 en 教我们…).
   - Añade un botón flotante (esquina inferior derecha) que muestra u oculta
     el pinyin de toda la página. La preferencia se guarda en localStorage
     y se sincroniza entre HSK 2, HSK 3 y futuros niveles.

   Para que funcione, antes de este script hay que cargar pinyin-pro:
     <script src="https://cdn.jsdelivr.net/npm/pinyin-pro@3/dist/index.js"></script>
     <script src="pinyin-toggle.js"></script>
   =========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1. Estilos inyectados (un solo bloque, así no toca el CSS existente) */
  /* ------------------------------------------------------------------ */
  var css = ''
    + '.py-ex{'
    +   'display:none;'  /* oculto por defecto */
    +   'font-family:"Spectral",Georgia,serif;'
    +   'font-style:italic;'
    +   'font-size:.82rem;'
    +   'color:var(--gold,#A6792F);'
    +   'letter-spacing:.04em;'
    +   'margin-top:2px;'
    + '}'
    + 'body.show-pinyin .py-ex{display:block;}'

    /* Botón flotante */
    + '#pinyin-toggle-btn{'
    +   'position:fixed;'
    +   'right:22px;bottom:22px;'
    +   'z-index:9999;'
    +   'display:inline-flex;align-items:center;gap:8px;'
    +   'padding:9px 16px;'
    +   'font-family:"Fraunces",Georgia,serif;'
    +   'font-weight:600;'
    +   'font-size:.78rem;'
    +   'letter-spacing:.08em;'
    +   'text-transform:uppercase;'
    +   'color:var(--ink-soft,#6A6055);'
    +   'background:var(--paper-2,#F3EBDC);'
    +   'border:1px solid var(--line,#E3D8C4);'
    +   'border-radius:999px;'
    +   'box-shadow:0 4px 14px -4px rgba(60,40,20,.25);'
    +   'cursor:pointer;'
    +   'transition:all .18s;'
    +   'user-select:none;'
    + '}'
    + '#pinyin-toggle-btn:hover{'
    +   'color:var(--cinnabar,#B23A2E);'
    +   'background:#fff;'
    +   'transform:translateY(-1px);'
    + '}'
    + '#pinyin-toggle-btn .py-icon{'
    +   'font-family:"Noto Serif SC",serif;'
    +   'font-size:.95rem;'
    +   'color:var(--cinnabar,#B23A2E);'
    + '}'
    + 'body.show-pinyin #pinyin-toggle-btn{'
    +   'color:#fff;'
    +   'background:var(--cinnabar,#B23A2E);'
    +   'border-color:var(--cinnabar,#B23A2E);'
    +   'box-shadow:2px 2px 0 var(--cinnabar-deep,#8C2A20),0 4px 14px -4px rgba(60,40,20,.25);'
    + '}'
    + 'body.show-pinyin #pinyin-toggle-btn .py-icon{color:#fff;}'
    + '@media print{#pinyin-toggle-btn{display:none;}}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ------------------------------------------------------------------ */
  /* 2. Correcciones para palabras donde pinyin-pro se equivoca         */
  /*    (auditadas sobre los 499 ejemplos de HSK 2 y HSK 3)             */
  /* ------------------------------------------------------------------ */
  var overrides = {
    // 得 como partícula de complemento (no "dé" sino "de" neutro)
    "做得": "zuò de", "说得": "shuō de", "唱得": "chàng de", "跑得": "pǎo de",
    "写得": "xiě de", "听得": "tīng de", "看得": "kàn de", "走得": "zǒu de",
    "学得": "xué de", "玩得": "wán de", "长得": "zhǎng de",
    // 地 como partícula adverbial (no "dì" sino "de" neutro)
    "慢慢地": "màn màn de", "认真地": "rèn zhēn de", "安静地": "ān jìng de",
    "快乐地": "kuài lè de", "高高兴兴地": "gāo gāo xìng xìng de",
    // 教 = jiāo (enseñar) cuando va con destinatario o materia
    "教我们": "jiāo wǒ men", "教汉语": "jiāo hàn yǔ",
    "教中文": "jiāo zhōng wén", "教英语": "jiāo yīng yǔ"
  };

  /* ------------------------------------------------------------------ */
  /* 3. Crear botón flotante                                            */
  /* ------------------------------------------------------------------ */
  function crearBoton() {
    var btn = document.createElement("button");
    btn.id = "pinyin-toggle-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Mostrar u ocultar pinyin");
    btn.innerHTML = '<span class="py-icon">拼</span><span>Pinyin</span>';
    btn.addEventListener("click", function () {
      var activo = document.body.classList.toggle("show-pinyin");
      try { localStorage.setItem("hsk-pinyin", activo ? "1" : "0"); } catch (e) {}
      btn.setAttribute("aria-pressed", activo ? "true" : "false");
    });
    document.body.appendChild(btn);
    return btn;
  }

  /* ------------------------------------------------------------------ */
  /* 4. Inyectar pinyin en cada ejemplo                                 */
  /* ------------------------------------------------------------------ */
  function inyectarPinyin() {
    if (typeof window.pinyinPro === "undefined") {
      console.warn("pinyin-toggle: pinyin-pro no está cargado. Añade <script src='https://cdn.jsdelivr.net/npm/pinyin-pro@3/dist/index.js'></script> antes de este script.");
      return false;
    }
    var pinyin = window.pinyinPro.pinyin;
    var customPinyin = window.pinyinPro.customPinyin;

    // Registrar las correcciones una sola vez
    if (customPinyin) customPinyin(overrides);

    // Generar el pinyin para cada ejemplo
    var ejemplos = document.querySelectorAll(".zh-ex");
    for (var i = 0; i < ejemplos.length; i++) {
      // Evitar duplicados si el script corre dos veces por error
      if (ejemplos[i].nextElementSibling && ejemplos[i].nextElementSibling.classList.contains("py-ex")) {
        continue;
      }
      var texto = ejemplos[i].textContent;
      var py = pinyin(texto, { toneType: "symbol", nonZh: "consecutive" });
      var span = document.createElement("span");
      span.className = "py-ex";
      span.textContent = py;
      ejemplos[i].parentNode.insertBefore(span, ejemplos[i].nextSibling);
    }
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* 5. Arranque                                                        */
  /* ------------------------------------------------------------------ */
  function arrancar() {
    var btn = crearBoton();

    // Restaurar preferencia guardada
    try {
      if (localStorage.getItem("hsk-pinyin") === "1") {
        document.body.classList.add("show-pinyin");
        btn.setAttribute("aria-pressed", "true");
      }
    } catch (e) {}

    // pinyin-pro carga como script normal; puede que ya esté listo o no.
    // Reintentamos brevemente si todavía no llegó.
    var intentos = 0;
    function intentarInyectar() {
      if (inyectarPinyin()) return;
      if (++intentos < 20) setTimeout(intentarInyectar, 100);
    }
    intentarInyectar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
