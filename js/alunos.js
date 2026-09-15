import { db } from "./firebase-config.js";
import { state } from "./state.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const STATUS_LABEL = { ativo: "Ativo", inadimplente: "Inadimplente", inativo: "Inativo" };

function alunosCol() {
  return collection(db, "academias", state.academiaId, "alunos");
}

function notifyAlunosUpdated() {
  document.dispatchEvent(new CustomEvent("alunos-updated"));
}

export function initAlunos() {
  const form = document.getElementById("alunoForm");
  const tbody = document.getElementById("alunosTbody");
  const empty = document.getElementById("alunosEmpty");
  const novoBtn = document.getElementById("novoAlunoBtn");
  const cancelarBtn = document.getElementById("cancelarAlunoBtn");

  novoBtn.addEventListener("click", () => {
    form.reset();
    form.elements.alunoId.value = "";
    form.hidden = false;
  });

  cancelarBtn.addEventListener("click", () => {
    form.hidden = true;
    form.reset();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const alunoId = data.get("alunoId");
    const payload = {
      nome: data.get("nome").trim(),
      telefone: data.get("telefone").trim(),
      email: data.get("email").trim(),
      plano: data.get("plano"),
      diaVencimento: Number(data.get("diaVencimento")) || 10,
      status: data.get("status"),
    };

    if (alunoId) {
      await updateDoc(doc(alunosCol(), alunoId), payload);
    } else {
      await addDoc(alunosCol(), payload);
    }

    form.hidden = true;
    form.reset();
  });

  onSnapshot(query(alunosCol(), orderBy("nome")), (snap) => {
    state.alunosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAlunos(state.alunosCache, tbody, empty, form);
    notifyAlunosUpdated();
  });
}

function renderAlunos(alunos, tbody, empty, form) {
  tbody.innerHTML = "";
  empty.hidden = alunos.length > 0;

  alunos.forEach((aluno) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(aluno.nome)}</td>
      <td>${escapeHtml(aluno.telefone || "-")}</td>
      <td>${escapeHtml(aluno.plano || "-")}</td>
      <td><span class="badge badge--${aluno.status}">${STATUS_LABEL[aluno.status] || aluno.status}</span></td>
      <td>Dia ${aluno.diaVencimento || "-"}</td>
      <td class="table__actions">
        <button data-action="editar" data-id="${aluno.id}" class="link-btn">Editar</button>
        <button data-action="excluir" data-id="${aluno.id}" class="link-btn link-btn--danger">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="editar"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const aluno = alunos.find((a) => a.id === btn.dataset.id);
      if (!aluno) return;
      form.elements.alunoId.value = aluno.id;
      form.elements.nome.value = aluno.nome || "";
      form.elements.telefone.value = aluno.telefone || "";
      form.elements.email.value = aluno.email || "";
      form.elements.plano.value = aluno.plano || "mensal";
      form.elements.diaVencimento.value = aluno.diaVencimento || 10;
      form.elements.status.value = aluno.status || "ativo";
      form.hidden = false;
    });
  });

  tbody.querySelectorAll('[data-action="excluir"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Excluir este aluno? Essa ação não pode ser desfeita.")) return;
      await deleteDoc(doc(alunosCol(), btn.dataset.id));
    });
  });
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
