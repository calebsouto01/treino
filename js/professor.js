import { auth, db } from "./firebase-config.js";
import { state } from "./state.js";
import { requireRole } from "./guard.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

let alunoAtualId = null;
let unsubAvaliacoes = null;
let unsubExecucoes = null;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function alunoRef(alunoId) {
  return doc(db, "academias", state.academiaId, "alunos", alunoId);
}

// ---------- Lista de alunos ----------

function renderAlunosList(alunos) {
  const container = document.getElementById("alunosList");
  container.innerHTML = "";

  if (alunos.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum aluno vinculado a você ainda.</p>';
    return;
  }

  alunos.forEach((aluno) => {
    const btn = document.createElement("button");
    btn.className = "aluno-item" + (aluno.id === alunoAtualId ? " is-active" : "");
    btn.textContent = aluno.nome;
    btn.addEventListener("click", () => selecionarAluno(aluno));
    container.appendChild(btn);
  });
}

function selecionarAluno(aluno) {
  alunoAtualId = aluno.id;
  document.getElementById("nenhumAlunoSelecionado").hidden = true;
  document.getElementById("alunoDetalhe").hidden = false;
  document.getElementById("alunoNomeTitulo").textContent = aluno.nome;

  document.querySelectorAll(".aluno-item").forEach((el) => {
    el.classList.toggle("is-active", el.textContent === aluno.nome);
  });

  carregarTreino(aluno.id);
  carregarAvaliacoes(aluno.id);
  carregarExecucoes(aluno.id);
}

// ---------- Tabs ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== `panel-${tab.dataset.tab}`));
  });
});

// ---------- Treino ----------

function linhaExercicio(ex = {}) {
  const row = document.createElement("div");
  row.className = "exercicio-row";
  row.innerHTML = `
    <label>Exercício<input type="text" data-field="nome" value="${escapeHtml(ex.nome || "")}" required></label>
    <label>Séries<input type="number" min="1" data-field="series" value="${ex.series ?? 3}" required></label>
    <label>Repetições<input type="text" data-field="repeticoes" value="${escapeHtml(ex.repeticoes || "12")}" required></label>
    <label>Carga<input type="text" data-field="carga" value="${escapeHtml(ex.carga || "")}" placeholder="Ex: 20kg"></label>
    <label>Descanso<input type="text" data-field="descanso" value="${escapeHtml(ex.descanso || "60s")}"></label>
    <button type="button" class="remove-exercicio" title="Remover">✕</button>
  `;
  row.querySelector(".remove-exercicio").addEventListener("click", () => row.remove());
  return row;
}

document.getElementById("addExercicioBtn").addEventListener("click", () => {
  document.getElementById("exerciciosList").appendChild(linhaExercicio());
});

async function carregarTreino(alunoId) {
  const treinoForm = document.getElementById("treinoForm");
  const exerciciosList = document.getElementById("exerciciosList");
  exerciciosList.innerHTML = "";
  treinoForm.elements.nome.value = "";

  const snap = await getDoc(doc(alunoRef(alunoId), "treinos", "atual"));
  if (snap.exists()) {
    const treino = snap.data();
    treinoForm.elements.nome.value = treino.nome || "";
    (treino.exercicios || []).forEach((ex) => exerciciosList.appendChild(linhaExercicio(ex)));
  }
  if (exerciciosList.children.length === 0) {
    exerciciosList.appendChild(linhaExercicio());
  }
}

document.getElementById("treinoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!alunoAtualId) return;

  const form = e.target;
  const exercicios = Array.from(document.querySelectorAll("#exerciciosList .exercicio-row")).map((row) => ({
    nome: row.querySelector('[data-field="nome"]').value.trim(),
    series: Number(row.querySelector('[data-field="series"]').value) || 1,
    repeticoes: row.querySelector('[data-field="repeticoes"]').value.trim(),
    carga: row.querySelector('[data-field="carga"]').value.trim(),
    descanso: row.querySelector('[data-field="descanso"]').value.trim(),
  }));

  await setDoc(doc(alunoRef(alunoAtualId), "treinos", "atual"), {
    nome: form.elements.nome.value.trim(),
    professorId: state.uid,
    exercicios,
    atualizadoEm: serverTimestamp(),
  });

  alert("Treino salvo!");
});

// ---------- Avaliação física ----------

function calcularImc(peso, altura) {
  if (!peso || !altura) return "-";
  return (peso / (altura * altura)).toFixed(1);
}

function carregarAvaliacoes(alunoId) {
  if (unsubAvaliacoes) unsubAvaliacoes();
  const tbody = document.getElementById("avaliacoesTbody");
  const empty = document.getElementById("avaliacoesEmpty");

  const q = query(collection(alunoRef(alunoId), "avaliacoes"), orderBy("data", "desc"));
  unsubAvaliacoes = onSnapshot(q, (snap) => {
    const avaliacoes = snap.docs.map((d) => d.data());
    tbody.innerHTML = "";
    empty.hidden = avaliacoes.length > 0;

    avaliacoes.forEach((a) => {
      const data = a.data?.toDate ? a.data.toDate().toLocaleDateString("pt-BR") : "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data}</td>
        <td>${a.peso ?? "-"} kg</td>
        <td>${calcularImc(a.peso, a.altura)}</td>
        <td>${a.cintura ?? "-"}</td>
        <td>${a.quadril ?? "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

document.getElementById("avaliacaoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!alunoAtualId) return;

  const form = e.target;
  const data = new FormData(form);

  await addDoc(collection(alunoRef(alunoAtualId), "avaliacoes"), {
    peso: Number(data.get("peso")),
    altura: Number(data.get("altura")),
    cintura: data.get("cintura") ? Number(data.get("cintura")) : null,
    quadril: data.get("quadril") ? Number(data.get("quadril")) : null,
    braco: data.get("braco") ? Number(data.get("braco")) : null,
    coxa: data.get("coxa") ? Number(data.get("coxa")) : null,
    observacoes: data.get("observacoes").trim(),
    professorId: state.uid,
    data: serverTimestamp(),
  });

  form.reset();
});

// ---------- Histórico de execuções ----------

function carregarExecucoes(alunoId) {
  if (unsubExecucoes) unsubExecucoes();
  const tbody = document.getElementById("execucoesTbody");
  const empty = document.getElementById("execucoesEmpty");

  const q = query(collection(alunoRef(alunoId), "execucoes"), orderBy("data", "desc"));
  unsubExecucoes = onSnapshot(q, (snap) => {
    const execucoes = snap.docs.map((d) => d.data());
    tbody.innerHTML = "";
    empty.hidden = execucoes.length > 0;

    execucoes.forEach((ex) => {
      const data = ex.data?.toDate ? ex.data.toDate().toLocaleDateString("pt-BR") : "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data}</td>
        <td>${escapeHtml(ex.treinoNome || "-")}</td>
        <td>${ex.nota ? "⭐".repeat(ex.nota) : "-"}</td>
        <td>${escapeHtml(ex.feedback || "-")}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ---------- Bootstrap ----------

requireRole("professor", (usuario) => {
  state.uid = usuario.uid;
  state.role = usuario.role;
  state.academiaId = usuario.academiaId;
  document.getElementById("nomeProfessor").textContent = usuario.nome || "Professor";

  const q = query(collection(db, "academias", state.academiaId, "alunos"), where("professorId", "==", usuario.uid));

  onSnapshot(q, (snap) => {
    const alunos = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.nome.localeCompare(b.nome));
    renderAlunosList(alunos);
  });
});
