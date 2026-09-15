import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { createAuthUserWithoutSignIn } from "./create-user.js";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const STATUS_LABEL = { ativo: "Ativo", inadimplente: "Inadimplente", inativo: "Inativo" };

function alunosCol() {
  return collection(db, "academias", state.academiaId, "alunos");
}

function notifyAlunosUpdated() {
  document.dispatchEvent(new CustomEvent("alunos-updated"));
}

function nomeProfessor(professorId) {
  if (!professorId) return "-";
  const prof = state.professoresCache.find((p) => p.id === professorId);
  return prof ? prof.nome : "-";
}

export function initAlunos() {
  const form = document.getElementById("alunoForm");
  const tbody = document.getElementById("alunosTbody");
  const empty = document.getElementById("alunosEmpty");
  const novoBtn = document.getElementById("novoAlunoBtn");
  const cancelarBtn = document.getElementById("cancelarAlunoBtn");
  const hint = document.getElementById("alunoFormHint");
  const emailInput = form.elements.email;
  const senhaInput = form.elements.senha;

  novoBtn.addEventListener("click", () => {
    form.reset();
    form.elements.alunoId.value = "";
    emailInput.disabled = false;
    senhaInput.disabled = false;
    senhaInput.required = true;
    hint.hidden = true;
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
      plano: data.get("plano"),
      professorId: data.get("professorId") || null,
      diaVencimento: Number(data.get("diaVencimento")) || 10,
      status: data.get("status"),
    };

    if (alunoId) {
      await updateDoc(doc(alunosCol(), alunoId), payload);
    } else {
      const email = data.get("email").trim();
      const senha = data.get("senha");
      let uid;
      try {
        uid = await createAuthUserWithoutSignIn(email, senha);
      } catch (err) {
        alert(mapAuthError(err));
        return;
      }

      await setDoc(doc(alunosCol(), uid), {
        ...payload,
        email,
        criadoEm: serverTimestamp(),
      });

      await setDoc(doc(db, "usuarios", uid), {
        nome: payload.nome,
        email,
        academiaId: state.academiaId,
        role: "aluno",
        criadoEm: serverTimestamp(),
      });
    }

    form.hidden = true;
    form.reset();
  });

  onSnapshot(query(alunosCol(), orderBy("nome")), (snap) => {
    state.alunosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAlunos(state.alunosCache, tbody, empty, form, emailInput, senhaInput, hint);
    notifyAlunosUpdated();
  });

  document.addEventListener("professores-updated", () => {
    populateProfessorSelect(document.getElementById("alunoProfessorSelect"));
    renderAlunos(state.alunosCache, tbody, empty, form, emailInput, senhaInput, hint);
  });
}

function populateProfessorSelect(select) {
  const selecionado = select.value;
  select.innerHTML =
    '<option value="">Sem professor</option>' +
    state.professoresCache.map((p) => `<option value="${p.id}">${escapeHtml(p.nome)}</option>`).join("");
  if (selecionado) select.value = selecionado;
}

function mapAuthError(err) {
  const map = {
    "auth/email-already-in-use": "Este e-mail já está em uso por outra conta.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-email": "E-mail inválido.",
  };
  return map[err.code] || "Não foi possível criar o acesso. Tente novamente.";
}

function renderAlunos(alunos, tbody, empty, form, emailInput, senhaInput, hint) {
  tbody.innerHTML = "";
  empty.hidden = alunos.length > 0;

  alunos.forEach((aluno) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(aluno.nome)}</td>
      <td>${escapeHtml(aluno.telefone || "-")}</td>
      <td>${escapeHtml(nomeProfessor(aluno.professorId))}</td>
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
      emailInput.value = aluno.email || "";
      emailInput.disabled = true;
      senhaInput.value = "";
      senhaInput.disabled = true;
      senhaInput.required = false;
      hint.hidden = false;
      form.elements.plano.value = aluno.plano || "mensal";
      form.elements.professorId.value = aluno.professorId || "";
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

export { populateProfessorSelect };
