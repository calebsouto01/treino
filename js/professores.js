import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { createAuthUserWithoutSignIn } from "./create-user.js";
import { escapeHtml, populateProfessorSelect } from "./alunos.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function professoresCol() {
  return collection(db, "academias", state.academiaId, "professores");
}

function notifyProfessoresUpdated() {
  document.dispatchEvent(new CustomEvent("professores-updated"));
}

function contarAlunos(professorId) {
  return state.alunosCache.filter((a) => a.professorId === professorId).length;
}

export function initProfessores() {
  const form = document.getElementById("professorForm");
  const tbody = document.getElementById("professoresTbody");
  const empty = document.getElementById("professoresEmpty");
  const novoBtn = document.getElementById("novoProfessorBtn");
  const cancelarBtn = document.getElementById("cancelarProfessorBtn");

  novoBtn.addEventListener("click", () => {
    form.reset();
    form.hidden = false;
  });

  cancelarBtn.addEventListener("click", () => {
    form.hidden = true;
    form.reset();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = data.get("nome").trim();
    const email = data.get("email").trim();
    const senha = data.get("senha");

    let uid;
    try {
      uid = await createAuthUserWithoutSignIn(email, senha);
    } catch (err) {
      alert(mapAuthError(err));
      return;
    }

    await setDoc(doc(professoresCol(), uid), {
      nome,
      email,
      ativo: true,
      criadoEm: serverTimestamp(),
    });

    await setDoc(doc(db, "usuarios", uid), {
      nome,
      email,
      academiaId: state.academiaId,
      role: "professor",
      criadoEm: serverTimestamp(),
    });

    form.hidden = true;
    form.reset();
  });

  onSnapshot(query(professoresCol(), orderBy("nome")), (snap) => {
    state.professoresCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderProfessores(state.professoresCache, tbody, empty);
    populateProfessorSelect(document.getElementById("alunoProfessorSelect"));
    notifyProfessoresUpdated();
  });
}

function mapAuthError(err) {
  const map = {
    "auth/email-already-in-use": "Este e-mail já está em uso por outra conta.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-email": "E-mail inválido.",
  };
  return map[err.code] || "Não foi possível criar o acesso. Tente novamente.";
}

function renderProfessores(professores, tbody, empty) {
  tbody.innerHTML = "";
  empty.hidden = professores.length > 0;

  professores.forEach((prof) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(prof.nome)}</td>
      <td>${escapeHtml(prof.email)}</td>
      <td>${contarAlunos(prof.id)}</td>
      <td><span class="badge badge--${prof.ativo ? "ativo" : "inativo"}">${prof.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="table__actions">
        <button data-action="remover" data-id="${prof.id}" class="link-btn link-btn--danger">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="remover"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remover este professor? Os alunos vinculados a ele ficarão sem professor.")) return;
      await deleteDoc(doc(professoresCol(), btn.dataset.id));
    });
  });
}
