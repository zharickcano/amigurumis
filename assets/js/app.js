import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Credenciales actualizadas de Firebase
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

// 1. MENÚ Y REDIRECCIÓN DEL ÍCONO DE USUARIO
const btnUserIcon = document.getElementById("btn-user-icon");

onAuthStateChanged(auth, async (user) => {
  if (!btnUserIcon) return;

  if (user) {
    // Consultar rol en Firestore
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const esAdmin = userDoc.exists() && userDoc.data().role === "admin";
    
    // Determinar la ruta y el texto del botón según el rol
    const destino = esAdmin ? "pages/cuenta-admin.html" : "pages/cuenta-usuario.html";
    const textoOpcion = esAdmin ? "Panel Admin" : "Mi Cuenta";

    // Transformar el contenedor en el menú desplegable
    const parentContainer = btnUserIcon.parentElement;
    parentContainer.innerHTML = `
      <div class="user-dropdown">
        <button class="user-btn" type="button"><i class="fa-solid fa-user"></i></button>
        <div class="dropdown-content">
          <button id="btn-go-account" type="button">${textoOpcion}</button>
          <button id="btn-logout" type="button">Cerrar Sesión</button>
        </div>
      </div>
    `;

    // Redirección explícita al panel o cuenta
    document.getElementById("btn-go-account")?.addEventListener("click", () => {
      window.location.href = destino;
    });

    // Evento para cerrar sesión
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.reload();
      });
    });

  } else {
    // Si no ha iniciado sesión, al hacer clic va al login
    btnUserIcon.href = "pages/login.html";
  }
});
// 2. FILTRADO POR CATEGORÍAS
const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const categoria = btn.getAttribute("data-categoria");
    cargarProductos(categoria);
  });
});

// 3. CARGA DINÁMICA Y BÚSQUEDA DESDE FIRESTORE
let productosCache = [];

async function cargarProductos(categoria = "todo") {
  const catalogo = document.querySelector(".catalogo");
  if (!catalogo) return;

  catalogo.innerHTML = "<p>Cargando productos...</p>";

  try {
    let q;
    if (categoria === "todo") {
      q = collection(db, "productos");
    } else {
      q = query(collection(db, "productos"), where("categoria", "==", categoria));
    }

    const querySnapshot = await getDocs(q);
    productosCache = [];

    querySnapshot.forEach((docSnap) => {
      productosCache.push({ id: docSnap.id, ...docSnap.data() });
    });

    mostrarProductos(productosCache);

  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// 4. MOSTRAR PRODUCTOS EN EL CATÁLOGO
function mostrarProductos(lista) {
  const catalogo = document.querySelector(".catalogo");
  if (!catalogo) return;

  catalogo.innerHTML = "";

  if (lista.length === 0) {
    catalogo.innerHTML = "<p class='texto-vacio'>No se encontraron productos que coincidan con la búsqueda.</p>";
    return;
  }

  lista.forEach((prod) => {
    catalogo.innerHTML += `
      <div class="producto-card">
        <a href="pages/producto.html?id=${prod.id}" style="text-decoration: none; color: inherit;">
          <img src="${prod.imagenUrl}" alt="${prod.nombre}">
          <h3>${prod.nombre}</h3>
        </a>
        <p class="categoria-tag">${prod.categoria}</p>
        
        <p class="prod-medidas">
          <i class="fa-solid fa-ruler-combined"></i> ${prod.medidas || 'Medidas no especificadas'}
        </p>
        <p class="prod-descripcion">${prod.descripcion || ''}</p>
        
        <div class="prod-footer">
          <span class="precio">$${Number(prod.precio).toLocaleString()} COP</span>
          <a href="pages/producto.html?id=${prod.id}" class="btn-primary" style="padding: 6px 12px; font-size: 0.85rem; text-decoration: none; border-radius: 6px;">Ver Detalles</a>
        </div>
      </div>
    `;
  });
}

// 5. EVENTO DE BÚSQUEDA EN TIEMPO REAL
const inputBusqueda = document.getElementById("input-busqueda");

inputBusqueda?.addEventListener("input", (e) => {
  const termino = e.target.value.toLowerCase().trim();

  const resultados = productosCache.filter((prod) => {
    const nombre = (prod.nombre || "").toLowerCase();
    const categoria = (prod.categoria || "").toLowerCase();
    const descripcion = (prod.descripcion || "").toLowerCase();
    const precio = (prod.precio || "").toString();

    return (
      nombre.includes(termino) ||
      categoria.includes(termino) ||
      descripcion.includes(termino) ||
      precio.includes(termino)
    );
  });

  mostrarProductos(resultados);
});

// MENÚ DE CONTACTO EN EL FOOTER (AL HACER CLIC)
const btnContacto = document.querySelector(".footer-contacto-btn");
const dropdownContacto = document.querySelector(".footer-contacto-dropdown");

btnContacto?.addEventListener("click", (e) => {
  e.stopPropagation(); // Evita que el clic se propague al documento
  dropdownContacto.classList.toggle("active");
});

// Cierra el menú al hacer clic en cualquier otro lugar fuera de él
document.addEventListener("click", () => {
  dropdownContacto?.classList.remove("active");
});

// Carga inicial al entrar a la tienda
cargarProductos();