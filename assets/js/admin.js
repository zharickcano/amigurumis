import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Credenciales del proyecto
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

// 1. VERIFICACIÓN RIGUROSA DE SEGURIDAD
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && userSnap.data().role === "admin") {
    const adminContainer = document.getElementById("admin-container");
    if (adminContainer) adminContainer.style.display = "block";
    cargarProductos();
  } else {
    alert("Acceso denegado: No tienes permisos de administrador.");
    window.location.href = "../index.html";
  }
});

// Botón de Cerrar Sesión
document.getElementById("btn-logout")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "../index.html";
  });
});

// Función auxiliar para convertir imagen local a texto Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

// 2. CREAR PRODUCTO CON IMAGEN EN FIRESTORE
const formProducto = document.getElementById("form-producto");
formProducto?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("prod-imagen-archivo");
  const file = fileInput.files[0];

  if (!file) {
    alert("Por favor selecciona una imagen.");
    return;
  }

  try {
    const btnSubmit = formProducto.querySelector("button[type='submit']");
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Procesando imagen...";

    // Convertir el archivo local a cadena Base64
    const imagenBase64 = await fileToBase64(file);

 const nuevoProducto = {
  nombre: document.getElementById("prod-nombre").value,
  precio: Number(document.getElementById("prod-precio").value),
  categoria: document.getElementById("prod-categoria").value,
  imagenUrl: imagenBase64,
  medidas: document.getElementById("prod-medidas").value,       // <-- Nuevo
  descripcion: document.getElementById("prod-descripcion").value, // <-- Nuevo
  fecha: new Date()
};

    await addDoc(collection(db, "productos"), nuevoProducto);
    alert("¡Producto guardado exitosamente!");
    formProducto.reset();
    cargarProductos();
  } catch (error) {
    console.error("Error al guardar producto:", error);
    alert("Ocurrió un error al guardar el producto.");
  } finally {
    const btnSubmit = formProducto.querySelector("button[type='submit']");
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Guardar Producto";
  }
});

// 3. OBTENER Y MOSTRAR PRODUCTOS
async function cargarProductos() {
  const lista = document.getElementById("lista-productos");
  if (!lista) return;

  lista.innerHTML = "<p>Cargando productos...</p>";
  const querySnapshot = await getDocs(collection(db, "productos"));
  lista.innerHTML = "";

  if (querySnapshot.empty) {
    lista.innerHTML = "<p>No hay productos guardados.</p>";
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const prod = docSnap.data();
    lista.innerHTML += `
      <div class="admin-prod-card">
        <img src="${prod.imagenUrl}" alt="${prod.nombre}">
        <div>
          <h4>${prod.nombre}</h4>
          <p>$${prod.precio.toLocaleString()} | Categ: ${prod.categoria}</p>
        </div>
        <button class="btn-eliminar" onclick="eliminarProducto('${docSnap.id}')">Eliminar</button>
      </div>
    `;
  });
}

// 4. ELIMINAR PRODUCTO
window.eliminarProducto = async (id) => {
  if (confirm("¿Estás seguro de eliminar este producto?")) {
    try {
      await deleteDoc(doc(db, "productos", id));
      alert("Producto eliminado correctamente.");
      cargarProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  }
};