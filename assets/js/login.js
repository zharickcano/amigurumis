import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Your web app's Firebase configuration
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

// ELEMENTOS DOM
const btnToggle = document.getElementById("btn-toggle-modo");
const tituloForm = document.getElementById("titulo-form");
const subtituloForm = document.getElementById("subtitulo-form");
const btnSubmit = document.getElementById("btn-submit");
const textoFooter = document.getElementById("texto-footer");
const boxOlvido = document.getElementById("box-olvido");
const formAuth = document.getElementById("form-auth");
const mensajeError = document.getElementById("mensaje-error");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

let modoRegistro = false;

// 1. ALTERNAR MODO (LOGIN <-> REGISTRO)
btnToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    modoRegistro = !modoRegistro;
    mensajeError.textContent = "";
    formAuth.reset();

    if (modoRegistro) {
        tituloForm.textContent = "Crear Cuenta";
        subtituloForm.textContent = "Regístrate para realizar compras y guardar tus amigurumis favoritos";
        btnSubmit.textContent = "Registrarme";
        textoFooter.textContent = "¿Ya tienes una cuenta?";
        btnToggle.textContent = "Inicia sesión";
        boxOlvido.style.display = "none";
    } else {
        tituloForm.textContent = "Iniciar Sesión";
        subtituloForm.textContent = "Ingresa tus datos para acceder a tu perfil";
        btnSubmit.textContent = "Ingresar a mi Cuenta";
        textoFooter.textContent = "¿No tienes una cuenta aún?";
        btnToggle.textContent = "Regístrate gratis";
        boxOlvido.style.display = "block";
    }
});

// 2. MOSTRAR / OCULTAR CONTRASEÑA
togglePassword?.addEventListener("click", () => {
    const esOculto = passwordInput.type === "password";
    passwordInput.type = esOculto ? "text" : "password";
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
});

// 3. ENVIAR FORMULARIO (INICIAR SESIÓN O REGISTRAR)
formAuth?.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensajeError.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    if (modoRegistro) {
        // --- PROCESO DE REGISTRO ---
        try {
            const credencial = await createUserWithEmailAndPassword(auth, email, password);
            const user = credencial.user;

            // Guardar documento del usuario en Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                email: email,
                role: "cliente",
                fechaRegistro: new Date()
            });

            alert("¡Cuenta creada con éxito! Bienvenido/a.");
          // Cambia: window.location.href = "cuenta-usuario.html";
window.location.href = "../index.html";
        } catch (error) {
            if (error.code === "auth/email-already-in-use") {
                mensajeError.textContent = "Este correo ya se encuentra registrado.";
            } else if (error.code === "auth/weak-password") {
                mensajeError.textContent = "La contraseña debe tener mínimo 6 caracteres.";
            } else {
                mensajeError.textContent = "Error al registrar la cuenta. Intenta nuevamente.";
            }
        }
    } else {
        // --- PROCESO DE INICIO DE SESIÓN ---
        try {
            const credencial = await signInWithEmailAndPassword(auth, email, password);
            const user = credencial.user;

            // Consultar rol para redirigir
            const userSnap = await getDoc(doc(db, "usuarios", user.uid));
            if (userSnap.exists() && userSnap.data().role === "admin") {
            // Cambia esto al iniciar sesión o registrarse con éxito:
         window.location.href = "../index.html";
            } else {
// Cambia: window.location.href = "cuenta-usuario.html";
window.location.href = "../index.html";
            }
        } catch (error) {
            mensajeError.textContent = "Correo o contraseña incorrectos.";
        }
    }
});