import { auth, db } from "./firebase-config.js";
import { state } from "./state.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { initAlunos } from "./alunos.js";
import { initPagamentos } from "./pagamentos.js";
import { initCheckin } from "./checkin.js";

const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".sidebar__link");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((l) => l.classList.remove("is-active"));
    link.classList.add("is-active");
    const target = link.dataset.view;
    views.forEach((v) => (v.hidden = v.id !== `view-${target}`));
  });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const usuarioSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (!usuarioSnap.exists()) {
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  const usuario = usuarioSnap.data();
  state.uid = user.uid;
  state.academiaId = usuario.academiaId;

  const academiaSnap = await getDoc(doc(db, "academias", usuario.academiaId));
  state.nomeAcademia = academiaSnap.exists() ? academiaSnap.data().nome : "Academia";
  document.getElementById("nomeAcademia").textContent = state.nomeAcademia;

  initAlunos();
  initPagamentos();
  initCheckin();
});
