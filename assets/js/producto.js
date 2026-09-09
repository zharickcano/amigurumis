import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeVs_dgduPdcPwqJm9JTYMssUciaXnJh8",
  authDomain: "tienda-de-amigurumi.firebaseapp.com",
  projectId: "tienda-de-amigurumi",
  storageBucket: "tienda-de-amigurumi.firebasestorage.app",
  messagingSenderId: "340118088224",
  appId: "1:340118088224:web:d97856aecfc87c5eccaa45"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Obtener ID del producto desde la URL (?id=xxxx)
const params = new URLSearchParams(window.location.search);
const productoId = params.get("id");

let usuarioActual = null;
let productoActualData = null;

// Control de Sesión en Header
const btnUserIcon = document.getElementById("btn-user-icon");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioActual = user;
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const esAdmin = userDoc.exists() && userDoc.data().role === "admin";
    const destino = esAdmin ? "cuenta-admin.html" : "cuenta-usuario.html";

    const parentContainer = btnUserIcon.parentElement;
    parentContainer.innerHTML = `
      <div class="user-dropdown">
        <button class="user-btn" type="button"><i class="fa-solid fa-user"></i></button>
        <div class="dropdown-content">
          <a href="${destino}">${esAdmin ? 'Panel Admin' : 'Mi Cuenta'}</a>
          <button id="btn-logout" type="button">Cerrar Sesión</button>
        </div>
      </div>
    `;

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      signOut(auth).then(() => window.location.reload());
    });
  }
});

// Cargar Datos Iniciales
if (productoId) {
  cargarDetalleProducto(productoId);
} else {
  window.location.href = "../index.html";
}

async function cargarDetalleProducto(id) {
  try {
    const docRef = doc(db, "productos", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("El producto no existe.");
      window.location.href = "../index.html";
      return;
    }

    productoActualData = docSnap.data();

    // Rellenar Información Principal
    document.getElementById("prod-img").src = productoActualData.imagenUrl;
    document.getElementById("prod-nombre").textContent = productoActualData.nombre;
    document.getElementById("prod-categoria").textContent = productoActualData.categoria;
    document.getElementById("prod-precio").textContent = `$${Number(productoActualData.precio).toLocaleString()} COP`;
    document.getElementById("prod-medidas").textContent = productoActualData.medidas || "No especificadas";
    document.getElementById("prod-descripcion").textContent = productoActualData.descripcion || "Sin descripción disponible.";

    // Cargar listas recomendadas
    cargarRecomendaciones(id, productoActualData.categoria);

  } catch (error) {
    console.error("Error al cargar producto:", error);
  }
}

async function cargarRecomendaciones(idActual, categoriaActual) {
  const gridRecomendados = document.getElementById("grid-recomendados");
  const gridInteresantes = document.getElementById("grid-interesantes");

  gridRecomendados.innerHTML = "";
  gridInteresantes.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "productos"));

  const recomendados = [];
  const interesantes = [];

  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== idActual) {
      const prod = docSnap.data();
      const item = { id: docSnap.id, ...prod };

      if (prod.categoria === categoriaActual) {
        recomendados.push(item);
      } else {
        interesantes.push(item);
      }
    }
  });

  // Rellenar Grid Recomendados
  if (recomendados.length === 0) {
    gridRecomendados.innerHTML = `<p class="texto-vacio">No hay otros productos en esta categoría por el momento.</p>`;
  } else {
    recomendados.forEach((p) => {
      gridRecomendados.innerHTML += crearTarjetaHTML(p);
    });
  }

  // Rellenar Grid También Interesantes
  if (interesantes.length === 0) {
    gridInteresantes.innerHTML = `<p class="texto-vacio">No hay más productos disponibles para mostrar.</p>`;
  } else {
    interesantes.forEach((p) => {
      gridInteresantes.innerHTML += crearTarjetaHTML(p);
    });
  }
}

function crearTarjetaHTML(p) {
  return `
    <div class="producto-card">
      <img src="${p.imagenUrl}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p class="categoria-tag">${p.categoria}</p>
      <div class="prod-footer">
        <span class="precio">$${Number(p.precio).toLocaleString()} COP</span>
        <a href="producto.html?id=${p.id}" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; text-decoration: none;">Ver</a>
      </div>
    </div>
  `;
}

// Botones de acción (Carrito / Favoritos)
document.getElementById("btn-add-cart")?.addEventListener("click", async () => {
  if (!usuarioActual) {
    alert("Debes iniciar sesión para agregar al carrito.");
    window.location.href = "login.html";
    return;
  }

  await addDoc(collection(db, "usuarios", usuarioActual.uid, "carrito"), productoActualData);
  alert("¡Producto añadido al carrito!");
});

document.getElementById("btn-add-fav")?.addEventListener("click", async () => {
  if (!usuarioActual) {
    alert("Debes iniciar sesión para guardar en favoritos.");
    window.location.href = "login.html";
    return;
  }

  await addDoc(collection(db, "usuarios", usuarioActual.uid, "favoritos"), productoActualData);
  alert("¡Producto añadido a favoritos!");
});