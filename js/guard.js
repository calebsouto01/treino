import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const ROLE_PAGE = { admin: "app.html", professor: "professor.html", aluno: "aluno.html" };

// Usado nas páginas de dashboard: garante que o usuário logado tem o papel
// esperado; caso contrário manda para a página certa (ou para o login).
export function requireRole(expectedRole, onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    const usuario = snap.data();
    if (usuario.role !== expectedRole) {
      window.location.href = ROLE_PAGE[usuario.role] || "index.html";
      return;
    }

    onReady({ uid: user.uid, ...usuario });
  });
}

// Usado no index.html: se já estiver logado, manda direto pro dashboard certo.
export function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) {
      window.location.href = ROLE_PAGE[snap.data().role] || "app.html";
    }
  });
}
