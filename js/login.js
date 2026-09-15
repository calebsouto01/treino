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

// Se já estiver logado, vai direto pro dashboard certo (professor/aluno)
redirectIfLoggedIn();

// ---------- Navegação entre cartões ----------

const roleChoice = document.getElementById("roleChoice");
const cardProfessor = document.getElementById("cardProfessor");
const cardAluno = document.getElementById("cardAluno");

document.querySelectorAll(".role-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    roleChoice.hidden = true;
    if (btn.dataset.role === "professor") cardProfessor.hidden = false;
    else cardAluno.hidden = false;
  });
});

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => {
    cardProfessor.hidden = true;
    cardAluno.hidden = true;
    roleChoice.hidden = false;
  });
});

// ---------- Abas dentro do cartão do professor ----------

const professorTabs = cardProfessor.querySelectorAll(".auth-tab");
const loginProfessorForm = document.getElementById("loginProfessorForm");
const signupForm = document.getElementById("signupForm");

professorTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    professorTabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const isLogin = tab.dataset.tab === "login-professor";
    loginProfessorForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
  });
});

// ---------- Helpers ----------

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

async function fazerLogin(form, errorElId, papelEsperado) {
  const errorEl = document.getElementById(errorElId);
  errorEl.hidden = true;
  const data = new FormData(form);

  try {
    const cred = await signInWithEmailAndPassword(auth, data.get("email"), data.get("senha"));
    const usuarioSnap = await getDoc(doc(db, "usuarios", cred.user.uid));

    if (!usuarioSnap.exists()) {
      throw { code: "auth/user-not-found" };
    }

    const role = usuarioSnap.data().role;
    if (role !== papelEsperado) {
      errorEl.textContent =
        papelEsperado === "professor"
          ? "Esta conta é de aluno. Volte e escolha \"Sou Aluno\"."
          : "Esta conta é de professor. Volte e escolha \"Sou Professor\".";
      errorEl.hidden = false;
      return;
    }

    window.location.href = ROLE_PAGE[role] || "index.html";
  } catch (err) {
    showError(errorEl, err);
  }
}

// ---------- Login professor ----------

loginProfessorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  fazerLogin(loginProfessorForm, "loginProfessorError", "professor");
});

// ---------- Login aluno ----------

document.getElementById("loginAlunoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  fazerLogin(e.target, "loginAlunoError", "aluno");
});

// ---------- Cadastro do professor ----------

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("signupError");
  errorEl.hidden = true;
  const data = new FormData(signupForm);
  const nome = data.get("nome").trim();
  const email = data.get("email").trim();
  const senha = data.get("senha");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = cred.user.uid;

    await setDoc(doc(db, "professores", uid), {
      nome,
      email,
      criadoEm: serverTimestamp(),
    });

    await setDoc(doc(db, "usuarios", uid), {
      nome,
      email,
      professorId: uid,
      role: "professor",
      criadoEm: serverTimestamp(),
    });

    window.location.href = "professor.html";
  } catch (err) {
    showError(errorEl, err);
  }
});
