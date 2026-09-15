import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { redirectIfLoggedIn, ROLE_PAGE } from "./guard.js";

// Se já estiver logado, vai direto pro dashboard certo (admin/professor/aluno)
redirectIfLoggedIn();

const tabs = document.querySelectorAll(".auth-tab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
  });
});

function showError(el, err) {
  const map = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  };
  el.textContent = map[err.code] || "Ocorreu um erro. Tente novamente.";
  el.hidden = false;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("loginError");
  errorEl.hidden = true;
  const data = new FormData(loginForm);
  try {
    const cred = await signInWithEmailAndPassword(auth, data.get("email"), data.get("senha"));
    const usuarioSnap = await getDoc(doc(db, "usuarios", cred.user.uid));
    const role = usuarioSnap.exists() ? usuarioSnap.data().role : "admin";
    window.location.href = ROLE_PAGE[role] || "app.html";
  } catch (err) {
    showError(errorEl, err);
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("signupError");
  errorEl.hidden = true;
  const data = new FormData(signupForm);
  const nomeAcademia = data.get("nomeAcademia").trim();
  const nome = data.get("nome").trim();
  const email = data.get("email").trim();
  const senha = data.get("senha");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = cred.user.uid;
    const academiaRef = doc(db, "academias", uid);

    await setDoc(academiaRef, {
      nome: nomeAcademia,
      donoUid: uid,
      criadoEm: serverTimestamp(),
    });

    await setDoc(doc(db, "usuarios", uid), {
      nome,
      email,
      academiaId: uid,
      role: "admin",
      criadoEm: serverTimestamp(),
    });

    window.location.href = "app.html";
  } catch (err) {
    showError(errorEl, err);
  }
});
