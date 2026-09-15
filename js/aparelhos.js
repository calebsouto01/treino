import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function aparelhosCol() {
  return collection(db, "professores", state.professorId, "aparelhos");
}

let aparelhosCache = [];

export function getAparelhosCache() {
  return aparelhosCache;
}

function notifyAparelhosUpdated() {
  document.dispatchEvent(new CustomEvent("aparelhos-updated"));
}

export function initAparelhos() {
  const form = document.getElementById("aparelhoForm");
  const tbody = document.getElementById("aparelhosTbody");
  const empty = document.getElementById("aparelhosEmpty");

  document.getElementById("novoAparelhoBtn").addEventListener("click", () => {
    form.reset();
    form.elements.aparelhoId.value = "";
    form.hidden = false;
  });

  document.getElementById("cancelarAparelhoBtn").addEventListener("click", () => {
    form.hidden = true;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const aparelhoId = form.elements.aparelhoId.value;
    const nome = form.elements.nome.value.trim();

    if (aparelhoId) {
      await updateDoc(doc(aparelhosCol(), aparelhoId), { nome });
    } else {
      await addDoc(aparelhosCol(), { nome, criadoEm: serverTimestamp() });
    }

    form.hidden = true;
  });

  onSnapshot(query(aparelhosCol(), orderBy("nome")), (snap) => {
    aparelhosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAparelhos(tbody, empty, form);
    notifyAparelhosUpdated();
  });
}

function renderAparelhos(tbody, empty, form) {
  tbody.innerHTML = "";
  empty.hidden = aparelhosCache.length > 0;

  aparelhosCache.forEach((aparelho) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(aparelho.nome)}</td>
      <td class="table__actions">
        <button data-action="editar" class="link-btn">Editar</button>
        <button data-action="excluir" class="link-btn link-btn--danger">Excluir</button>
      </td>
    `;
    tr.querySelector('[data-action="editar"]').addEventListener("click", () => {
      form.elements.aparelhoId.value = aparelho.id;
      form.elements.nome.value = aparelho.nome;
      form.hidden = false;
    });
    tr.querySelector('[data-action="excluir"]').addEventListener("click", async () => {
      if (!confirm(`Excluir o aparelho "${aparelho.nome}"?`)) return;
      await deleteDoc(doc(aparelhosCol(), aparelho.id));
    });
    tbody.appendChild(tr);
  });
}
