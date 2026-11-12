const botonMenu = document.querySelector(".boton-menu");
const navegacion = document.querySelector(".navegacion-principal");

botonMenu.addEventListener("click", () => {
  const abierto = navegacion.classList.toggle("abierto");
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
});

navegacion.querySelectorAll("a").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    navegacion.classList.remove("abierto");
    botonMenu.setAttribute("aria-expanded", "false");
    botonMenu.setAttribute("aria-label", "Abrir menú");
  });
});


const productosSake = {
  junmai: { nombre: "Junmai", precio: 28000, imagen: "ake-junmai.svg" },
  ginjo: { nombre: "Ginjo", precio: 34000, imagen: "sake-ginjo.svg" },
  daiginjo: { nombre: "Daiginjo", precio: 46000, imagen: "sake-daiginjo.svg" },
  nigori: { nombre: "Nigori", precio: 32000, imagen: "sake-nigori.svg" }
};
const claveCarrito = "shun-carrito-sake-v1";

function leerCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(claveCarrito) || "{}");
    const carrito = {};
    for (const id of Object.keys(productosSake)) {
      const cantidad = Number(guardado[id]);
      if (Number.isInteger(cantidad) && cantidad > 0) carrito[id] = Math.min(cantidad, 99);
    }
    return carrito;
  } catch {
    return {};
  }
}

function actualizarContadorCarrito() {
  const cantidad = Object.values(leerCarrito()).reduce((total, unidades) => total + unidades, 0);
  document.querySelectorAll(".enlace-carrito").forEach((enlace) => {
    enlace.querySelector(".contador-carrito").textContent = String(cantidad);
    enlace.setAttribute("aria-label", `Carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`);
  });
}

function guardarCarrito(carrito) {
  localStorage.setItem(claveCarrito, JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function precioEnPesos(valor) {
  return "$" + new Intl.NumberFormat("es-AR").format(valor);
}

actualizarContadorCarrito();

const avisoTienda = document.querySelector("#aviso-tienda");
if (avisoTienda) {
  document.querySelectorAll("[data-agregar]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const id = boton.dataset.agregar;
      if (!productosSake[id]) return;
      const carrito = leerCarrito();
      carrito[id] = Math.min((carrito[id] || 0) + 1, 99);
      guardarCarrito(carrito);
      avisoTienda.textContent = `Agregaste ${productosSake[id].nombre} al carrito.`;
      avisoTienda.hidden = false;
    });
  });
}

const listaCarrito = document.querySelector("#lista-carrito");
if (listaCarrito) {
  const carritoVacio = document.querySelector("#carrito-vacio");
  const contenidoCarrito = document.querySelector("#contenido-carrito");
  const totalCarrito = document.querySelector("#total-carrito");

  function mostrarCarrito() {
    const carrito = leerCarrito();
    const lineas = Object.entries(carrito);
    carritoVacio.hidden = lineas.length > 0;
    contenidoCarrito.hidden = lineas.length === 0;
    listaCarrito.innerHTML = lineas.map(([id, cantidad]) => {
      const producto = productosSake[id];
      return `<article class="item-carrito">
        <img src="${producto.imagen}" alt="Botella de sake Shun ${producto.nombre}">
        <div><h2>${producto.nombre}</h2><p>Sake · 720 ml · ${precioEnPesos(producto.precio)} por unidad</p>
          <div class="controles-cantidad">
            <button type="button" data-accion="restar" data-id="${id}" aria-label="Restar una unidad de ${producto.nombre}">−</button>
            <span aria-label="Cantidad: ${cantidad}">${cantidad}</span>
            <button type="button" data-accion="sumar" data-id="${id}" aria-label="Sumar una unidad de ${producto.nombre}">+</button>
          </div>
          <button class="quitar-producto" type="button" data-accion="quitar" data-id="${id}">Quitar</button>
        </div>
        <strong class="precio-item">${precioEnPesos(producto.precio * cantidad)}</strong>
      </article>`;
    }).join("");
    const total = lineas.reduce((suma, [id, cantidad]) => suma + productosSake[id].precio * cantidad, 0);
    totalCarrito.textContent = precioEnPesos(total);
    actualizarContadorCarrito();
  }

  listaCarrito.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton || !productosSake[boton.dataset.id]) return;
    const carrito = leerCarrito();
    const id = boton.dataset.id;
    if (boton.dataset.accion === "sumar") carrito[id] = Math.min((carrito[id] || 0) + 1, 99);
    if (boton.dataset.accion === "restar") carrito[id] = (carrito[id] || 0) - 1;
    if (boton.dataset.accion === "quitar" || carrito[id] <= 0) delete carrito[id];
    guardarCarrito(carrito);
    mostrarCarrito();
  });

  const formularioCarrito = document.querySelector("#formulario-carrito");
  formularioCarrito.setAttribute("aria-label", "Confirmar compra");
  formularioCarrito.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (Object.keys(leerCarrito()).length === 0) return;
    guardarCarrito({});
    window.location.href = "confirmacion-compra.html?tipo=sake";
  });

  mostrarCarrito();
}

const mensajeConfirmacionCompra = document.querySelector("#mensaje-confirmacion-compra");
if (mensajeConfirmacionCompra && new URLSearchParams(window.location.search).get("tipo") === "sake") {
  mensajeConfirmacionCompra.textContent = "Tu compra de sake quedó confirmada. ¡Gracias por elegir Shun!";
}


const formularioReserva = document.querySelector("#formulario-reserva");
if (formularioReserva) {
  const campoFecha = document.querySelector("#fecha");
  const campoHorario = document.querySelector("#horario");
  const calendario = document.querySelector("#calendario-reserva");
  const tituloMes = document.querySelector("#mes-calendario");
  const diasCalendario = document.querySelector("#dias-calendario");
  const botonAnterior = document.querySelector("#mes-anterior");
  const botonSiguiente = document.querySelector("#mes-siguiente");
  const errorFecha = document.querySelector("#error-fecha");
  const hoy = new Date();
  let mesVisible = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  function diaDeHoy() {
    const fecha = new Date();
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  function fechaDisponible(fecha) {
    const dia = fecha.getDay();
    return fecha >= diaDeHoy() && (dia === 4 || dia === 5 || dia === 6);
  }

  function cerrarCalendario() {
    calendario.hidden = true;
    campoFecha.setAttribute("aria-expanded", "false");
  }

  function dibujarCalendario() {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    tituloMes.textContent = new Intl.DateTimeFormat("es-AR", {
      month: "long", year: "numeric"
    }).format(mesVisible);
    botonAnterior.disabled = mesVisible <= new Date(diaDeHoy().getFullYear(), diaDeHoy().getMonth(), 1);
    diasCalendario.replaceChildren();

  
    const espacios = (new Date(anio, mes, 1).getDay() + 6) % 7;
    for (let i = 0; i < espacios; i++) {
      const espacio = document.createElement("span");
      espacio.setAttribute("aria-hidden", "true");
      diasCalendario.append(espacio);
    }

    const cantidadDias = new Date(anio, mes + 1, 0).getDate();
    for (let dia = 1; dia <= cantidadDias; dia++) {
      const fecha = new Date(anio, mes, dia);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = String(dia);
      boton.disabled = !fechaDisponible(fecha);
      boton.setAttribute("aria-label", new Intl.DateTimeFormat("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(fecha));

      const iso = [anio, String(mes + 1).padStart(2, "0"), String(dia).padStart(2, "0")].join("-");
      if (campoFecha.dataset.fecha === iso) boton.setAttribute("aria-pressed", "true");
      boton.addEventListener("click", () => {
        campoFecha.dataset.fecha = iso;
        campoFecha.value = [String(dia).padStart(2, "0"), String(mes + 1).padStart(2, "0"), anio].join("/");
        campoFecha.removeAttribute("aria-invalid");
        errorFecha.hidden = true;
        cerrarCalendario();
        campoHorario.focus();
      });
      diasCalendario.append(boton);
    }
  }

  function abrirCalendario() {
    if (!calendario.hidden) return;
    dibujarCalendario();
    calendario.hidden = false;
    campoFecha.setAttribute("aria-expanded", "true");
    diasCalendario.querySelector("button:not(:disabled)")?.focus();
  }

  campoFecha.addEventListener("click", () => {
    if (calendario.hidden) abrirCalendario();
    else cerrarCalendario();
  });
  campoFecha.addEventListener("keydown", (evento) => {
    if (["Enter", " ", "ArrowDown"].includes(evento.key)) {
      evento.preventDefault();
      abrirCalendario();
    }
  });
  botonAnterior.addEventListener("click", () => {
    mesVisible.setMonth(mesVisible.getMonth() - 1);
    dibujarCalendario();
  });
  botonSiguiente.addEventListener("click", () => {
    mesVisible.setMonth(mesVisible.getMonth() + 1);
    dibujarCalendario();
  });
  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".selector-fecha")) cerrarCalendario();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !calendario.hidden) {
      cerrarCalendario();
      campoFecha.focus();
    }
  });

  formularioReserva.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const partes = (campoFecha.dataset.fecha || "").split("-").map(Number);
    const fechaElegida = partes.length === 3 ? new Date(partes[0], partes[1] - 1, partes[2]) : null;
    if (!fechaElegida || !fechaDisponible(fechaElegida)) {
      errorFecha.textContent = "Elegí un jueves, viernes o sábado en el calendario.";
      errorFecha.hidden = false;
      campoFecha.setAttribute("aria-invalid", "true");
      campoFecha.focus();
      return;
    }
    if (!["20:00", "22:30"].includes(campoHorario.value)) {
      campoHorario.setCustomValidity("Elegí uno de los dos horarios disponibles.");
      campoHorario.reportValidity();
      return;
    }
    window.location.href = "confirmacion-reserva.html";
  });
  campoHorario.addEventListener("change", () => campoHorario.setCustomValidity(""));
}

const formularioGiftcard = document.querySelector("#formulario-giftcard");
if (formularioGiftcard) {
  const paraMi = document.querySelector("#destino-propio");
  const paraOtraPersona = document.querySelector("#destino-otra");
  const etiquetaCorreo = document.querySelector("#etiqueta-correo");
  const etiquetaNombre = document.querySelector("#etiqueta-nombre");
  const fechaEntrega = document.querySelector("#fecha-entrega");
  const horaEntrega = document.querySelector("#hora-entrega");
  const calendarioEntrega = document.querySelector("#calendario-entrega");
  const mesCalendarioEntrega = document.querySelector("#mes-calendario-entrega");
  const diasCalendarioEntrega = document.querySelector("#dias-calendario-entrega");
  const mesAnteriorEntrega = document.querySelector("#mes-anterior-entrega");
  const mesSiguienteEntrega = document.querySelector("#mes-siguiente-entrega");
  const errorFechaEntrega = document.querySelector("#error-fecha-entrega");
  const hoy = new Date();
  let mesVisibleEntrega = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  function diaDeHoyEntrega() {
    const fecha = new Date();
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  function cerrarCalendarioEntrega() {
    calendarioEntrega.hidden = true;
    fechaEntrega.setAttribute("aria-expanded", "false");
  }

  function dibujarCalendarioEntrega() {
    const anio = mesVisibleEntrega.getFullYear();
    const mes = mesVisibleEntrega.getMonth();
    mesCalendarioEntrega.textContent = new Intl.DateTimeFormat("es-AR", {
      month: "long", year: "numeric"
    }).format(mesVisibleEntrega);
    mesAnteriorEntrega.disabled = mesVisibleEntrega <= new Date(diaDeHoyEntrega().getFullYear(), diaDeHoyEntrega().getMonth(), 1);
    diasCalendarioEntrega.replaceChildren();

    const espacios = (new Date(anio, mes, 1).getDay() + 6) % 7;
    for (let i = 0; i < espacios; i++) {
      const espacio = document.createElement("span");
      espacio.setAttribute("aria-hidden", "true");
      diasCalendarioEntrega.append(espacio);
    }

    const cantidadDias = new Date(anio, mes + 1, 0).getDate();
    for (let dia = 1; dia <= cantidadDias; dia++) {
      const fecha = new Date(anio, mes, dia);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = String(dia);
      boton.disabled = fecha < diaDeHoyEntrega();
      boton.setAttribute("aria-label", new Intl.DateTimeFormat("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }).format(fecha));

      const iso = [anio, String(mes + 1).padStart(2, "0"), String(dia).padStart(2, "0")].join("-");
      if (fechaEntrega.dataset.fecha === iso) boton.setAttribute("aria-pressed", "true");
      boton.addEventListener("click", () => {
        fechaEntrega.dataset.fecha = iso;
        fechaEntrega.value = [String(dia).padStart(2, "0"), String(mes + 1).padStart(2, "0"), anio].join("/");
        fechaEntrega.removeAttribute("aria-invalid");
        errorFechaEntrega.hidden = true;
        cerrarCalendarioEntrega();
        horaEntrega.focus();
      });
      diasCalendarioEntrega.append(boton);
    }
  }

  function abrirCalendarioEntrega() {
    if (!calendarioEntrega.hidden) return;
    dibujarCalendarioEntrega();
    calendarioEntrega.hidden = false;
    fechaEntrega.setAttribute("aria-expanded", "true");
    diasCalendarioEntrega.querySelector("button:not(:disabled)")?.focus();
  }

  fechaEntrega.addEventListener("click", () => {
    if (calendarioEntrega.hidden) abrirCalendarioEntrega();
    else cerrarCalendarioEntrega();
  });
  fechaEntrega.addEventListener("keydown", (evento) => {
    if (["Enter", " ", "ArrowDown"].includes(evento.key)) {
      evento.preventDefault();
      abrirCalendarioEntrega();
    }
  });
  mesAnteriorEntrega.addEventListener("click", () => {
    mesVisibleEntrega.setMonth(mesVisibleEntrega.getMonth() - 1);
    dibujarCalendarioEntrega();
  });
  mesSiguienteEntrega.addEventListener("click", () => {
    mesVisibleEntrega.setMonth(mesVisibleEntrega.getMonth() + 1);
    dibujarCalendarioEntrega();
  });
  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".selector-fecha")) cerrarCalendarioEntrega();
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !calendarioEntrega.hidden) {
      cerrarCalendarioEntrega();
      fechaEntrega.focus();
    }
  });

  function actualizarDestinatario() {
    etiquetaCorreo.textContent = paraMi.checked ? "Tu correo electrónico:" : "Correo electrónico del destinatario:";
    etiquetaNombre.textContent = paraMi.checked ? "Tu nombre:" : "Nombre del destinatario:";
  }

  paraMi.addEventListener("change", actualizarDestinatario);
  paraOtraPersona.addEventListener("change", actualizarDestinatario);

  formularioGiftcard.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const partes = (fechaEntrega.dataset.fecha || "").split("-").map(Number);
    const fechaElegida = partes.length === 3 ? new Date(partes[0], partes[1] - 1, partes[2]) : null;
    if (!fechaElegida || fechaElegida < diaDeHoyEntrega()) {
      errorFechaEntrega.textContent = "Elegí una fecha de entrega de hoy en adelante.";
      errorFechaEntrega.hidden = false;
      fechaEntrega.setAttribute("aria-invalid", "true");
      fechaEntrega.focus();
      return;
    }
    window.location.href = "confirmacion-compra.html";
  });
}
