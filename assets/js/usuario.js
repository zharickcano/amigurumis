import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

let currentUserId = null;

// PROTECCIÓN Y CARGA DE LA PÁGINA
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  currentUserId = user.uid;
  document.getElementById("usuario-container").style.display = "block";

  // Cargar Perfil
  const userSnap = await getDoc(doc(db, "usuarios", user.uid));
  const nombre = userSnap.exists() ? (userSnap.data().nombre || "Usuario") : "Usuario";
  document.getElementById("user-nombre").textContent = nombre;
  document.getElementById("user-email").textContent = user.email;

  // Cargar datos de Firestore
  cargarCarrito();
  cargarFavoritos();
});

// Cerrar sesión
document.getElementById("btn-logout")?.addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "../index.html");
});

// 1. CARGAR CARRITO DESDE FIRESTORE
async function cargarCarrito() {
  const contenedor = document.getElementById("lista-carrito");
  const resumen = document.getElementById("carrito-resumen");
  contenedor.innerHTML = "";

  const snapshot = await getDocs(collection(db, "usuarios", currentUserId, "carrito"));

  if (snapshot.empty) {
    contenedor.innerHTML = "<p class='texto-vacio'>Tu carrito está vacío.</p>";
    resumen.innerHTML = "";
    return;
  }

  let total = 0;
  snapshot.forEach((itemDoc) => {
    const item = itemDoc.data();
    total += Number(item.precio || 0);

    contenedor.innerHTML += `
      <div class="user-item-card">
        <img src="${item.imagenUrl}" alt="${item.nombre}">
        <div class="info">
          <h4>${item.nombre}</h4>
          <p>$${Number(item.precio).toLocaleString()} COP</p>
        </div>
        <button class="btn-quitar" onclick="eliminarDelCarrito('${itemDoc.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  });

  resumen.innerHTML = `<h4>Total a pagar: $${total.toLocaleString()} COP</h4>`;
}

// 2. CARGAR FAVORITOS DESDE FIRESTORE
async function cargarFavoritos() {
  const contenedor = document.getElementById("lista-favoritos");
  contenedor.innerHTML = "";

  const snapshot = await getDocs(collection(db, "usuarios", currentUserId, "favoritos"));

  if (snapshot.empty) {
    contenedor.innerHTML = "<p class='texto-vacio'>No tienes productos en tu lista de deseos.</p>";
    return;
  }

  snapshot.forEach((itemDoc) => {
    const item = itemDoc.data();

    contenedor.innerHTML += `
      <div class="user-item-card">
        <img src="${item.imagenUrl}" alt="${item.nombre}">
        <div class="info">
          <h4>${item.nombre}</h4>
          <p>$${Number(item.precio).toLocaleString()} COP</p>
        </div>
        <button class="btn-quitar" onclick="eliminarDeFavoritos('${itemDoc.id}')">
          <i class="fa-solid fa-heart-crack"></i>
        </button>
      </div>
    `;
  });
}

// 3. FUNCIONES GLOBALES PARA ELIMINAR DE FIRESTORE
window.eliminarDelCarrito = async (docId) => {
  try {
    await deleteDoc(doc(db, "usuarios", currentUserId, "carrito", docId));
    cargarCarrito();
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
  }
};

window.eliminarDeFavoritos = async (docId) => {
  try {
    await deleteDoc(doc(db, "usuarios", currentUserId, "favoritos", docId));
    cargarFavoritos();
  } catch (error) {
    console.error("Error al eliminar de favoritos:", error);
  }
};