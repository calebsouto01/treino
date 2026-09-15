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
  return collection(db, "professores", state.professorId, "alunos");
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
  const hint = document.getElementById("alunoFormHint");
  const emailInput = form.elements.email;
  const senhaInput = form.elements.senha;
  const buscaInput = document.getElementById("alunoBusca");
  const filtroStatus = document.getElementById("alunoFiltroStatus");

  function alunosFiltrados() {
    const termo = buscaInput.value.trim().toLowerCase();
    const status = filtroStatus.value;
    return state.alunosCache.filter((a) => {
      const bateNome = !termo || a.nome.toLowerCase().includes(termo);
      const bateStatus = !status || a.status === status;
      return bateNome && bateStatus;
    });
  }

  function rerenderComFiltro() {
    renderAlunos(alunosFiltrados(), tbody, empty, form, emailInput, senhaInput, hint);
  }

  buscaInput.addEventListener("input", rerenderComFiltro);
  filtroStatus.addEventListener("change", rerenderComFiltro);

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
      diaVencimento: Number(data.get("diaVencimento")) || 10,
      status: data.get("status"),
      dataNascimento: data.get("dataNascimento") || null,
      objetivo: data.get("objetivo"),
      nivel: data.get("nivel"),
      frequenciaSemanal: Number(data.get("frequenciaSemanal")) || 3,
      restricoes: Array.from(form.querySelectorAll('input[name="restricoes"]:checked')).map((cb) => cb.value),
      observacoes: data.get("observacoes").trim(),
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
        professorId: state.professorId,
        role: "aluno",
        criadoEm: serverTimestamp(),
      });
    }

    form.hidden = true;
    form.reset();
  });

  onSnapshot(query(alunosCol(), orderBy("nome")), (snap) => {
    state.alunosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rerenderComFiltro();
    notifyAlunosUpdated();
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

function renderAlunos(alunos, tbody, empty, form, emailInput, senhaInput, hint) {
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
        <button data-action="gerenciar" data-id="${aluno.id}" class="link-btn">Gerenciar</button>
        <button data-action="editar" data-id="${aluno.id}" class="link-btn">Editar</button>
        <button data-action="excluir" data-id="${aluno.id}" class="link-btn link-btn--danger">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="gerenciar"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const aluno = alunos.find((a) => a.id === btn.dataset.id);
      if (!aluno) return;
      document.dispatchEvent(new CustomEvent("aluno-selecionado", { detail: aluno }));
    });
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
      form.elements.diaVencimento.value = aluno.diaVencimento || 10;
      form.elements.status.value = aluno.status || "ativo";
      form.elements.dataNascimento.value = aluno.dataNascimento || "";
      form.elements.objetivo.value = aluno.objetivo || "hipertrofia";
      form.elements.nivel.value = aluno.nivel || "iniciante";
      form.elements.frequenciaSemanal.value = aluno.frequenciaSemanal || 3;
      form.querySelectorAll('input[name="restricoes"]').forEach((cb) => {
        cb.checked = (aluno.restricoes || []).includes(cb.value);
      });
      form.elements.observacoes.value = aluno.observacoes || "";
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
