import { auth, db } from "./firebase-config.js";
import { state } from "./state.js";
import { requireRole } from "./guard.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
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
import { initAlunos } from "./alunos.js";
import { initPagamentos } from "./pagamentos.js";
import { initCheckin } from "./checkin.js";
import { initPlanos, getPlanosCache } from "./planos.js";
import { initAvaliacao } from "./avaliacao.js";
import { initAparelhos } from "./aparelhos.js";
import { initExercicios } from "./exercicios.js";
import { criarLinhaExercicio, lerExerciciosDoContainer } from "./exercicio-row.js";
import { irParaView } from "./nav.js";

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function alunoRef(alunoId) {
  return doc(db, "professores", state.professorId, "alunos", alunoId);
}

// ---------- Navegação principal ----------

const navLinks = document.querySelectorAll(".sidebar__link, .sidebar__sublink");

navLinks.forEach((link) => {
  link.addEventListener("click", () => irParaView(link.dataset.view));
});

// ---------- Ir para o detalhe de um aluno ----------

let alunoAtual = null;
let treinosCache = [];
let unsubTreinos = null;
let unsubAlunoDoc = null;
let unsubExecucoes = null;

document.addEventListener("aluno-selecionado", (e) => {
  alunoAtual = e.detail;

  irParaView("aluno-detalhe");
  document.getElementById("alunoNomeTitulo").textContent = alunoAtual.nome;

  const obsBox = document.getElementById("alunoObservacoesBox");
  if (alunoAtual.observacoes) {
    document.getElementById("alunoObservacoesTexto").textContent = alunoAtual.observacoes;
    obsBox.hidden = false;
  } else {
    obsBox.hidden = true;
  }

  document.getElementById("treinoForm").hidden = true;
  document.getElementById("copiarTreinoBox").hidden = true;
  document.getElementById("aplicarPlanoBox").hidden = true;

  carregarTreinos(alunoAtual.id);
  carregarExecucoes(alunoAtual.id);
});

document.getElementById("voltarAlunosBtn").addEventListener("click", () => irParaView("alunos"));

// ---------- Tabs do detalhe ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== `panel-${tab.dataset.tab}`));
  });
});

// ---------- Treinos (múltiplos, com histórico e cópia) ----------

const CATALOGO_TREINO_DATALIST = "catalogoExercicios";

document.getElementById("addExercicioBtn").addEventListener("click", () => {
  document.getElementById("exerciciosList").appendChild(criarLinhaExercicio(CATALOGO_TREINO_DATALIST));
});

function abrirFormTreino(treino = null) {
  const treinoForm = document.getElementById("treinoForm");
  const exerciciosList = document.getElementById("exerciciosList");
  exerciciosList.innerHTML = "";
  treinoForm.reset();
  treinoForm.elements.treinoId.value = treino ? treino.id : "";
  if (treino) {
    treinoForm.elements.nome.value = treino.nome || "";
    (treino.exercicios || []).forEach((ex) => exerciciosList.appendChild(criarLinhaExercicio(CATALOGO_TREINO_DATALIST, ex)));
  }
  if (exerciciosList.children.length === 0) {
    exerciciosList.appendChild(criarLinhaExercicio(CATALOGO_TREINO_DATALIST));
  }
  document.getElementById("copiarTreinoBox").hidden = true;
  document.getElementById("aplicarPlanoBox").hidden = true;
  treinoForm.hidden = false;
}

document.getElementById("novoTreinoBtn").addEventListener("click", () => abrirFormTreino());
document.getElementById("cancelarTreinoBtn").addEventListener("click", () => {
  document.getElementById("treinoForm").hidden = true;
});

document.getElementById("treinoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!alunoAtual) return;

  const form = e.target;
  const treinoId = form.elements.treinoId.value;
  const exercicios = lerExerciciosDoContainer(document.getElementById("exerciciosList"));

  const treinosCol = collection(alunoRef(alunoAtual.id), "treinos");

  if (treinoId) {
    await updateDoc(doc(treinosCol, treinoId), {
      nome: form.elements.nome.value.trim(),
      exercicios,
      atualizadoEm: serverTimestamp(),
    });
  } else {
    const novoRef = await addDoc(treinosCol, {
      nome: form.elements.nome.value.trim(),
      exercicios,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    // Se for o primeiro treino do aluno, já ativa automaticamente.
    if (!alunoAtual.treinoAtivoId) {
      await updateDoc(alunoRef(alunoAtual.id), { treinoAtivoId: novoRef.id });
      alunoAtual.treinoAtivoId = novoRef.id;
    }
  }

  form.hidden = true;
});

function renderTreinosList(alunoId) {
  const lista = document.getElementById("treinosLista");
  const empty = document.getElementById("treinosEmpty");

  lista.innerHTML = "";
  empty.hidden = treinosCache.length > 0;

  treinosCache.forEach((treino) => {
    const ativo = treino.id === alunoAtual?.treinoAtivoId;
    const card = document.createElement("div");
    card.className = "treino-card" + (ativo ? " is-ativo" : "");
    card.innerHTML = `
      <div class="treino-card__info">
        <strong>${escapeHtml(treino.nome)} ${ativo ? "⭐" : ""}</strong>
        <span class="treino-card__meta">${(treino.exercicios || []).length} exercício(s)${ativo ? " · treino ativo do aluno" : ""}</span>
      </div>
      <div class="treino-card__actions">
        ${ativo ? "" : `<button type="button" class="btn btn--ghost" data-action="ativar">Ativar</button>`}
        <button type="button" class="btn btn--ghost" data-action="editar">Editar</button>
        <button type="button" class="btn btn--ghost" data-action="copiar">Copiar p/ outro aluno</button>
        <button type="button" class="link-btn link-btn--danger" data-action="excluir">Excluir</button>
      </div>
    `;

    card.querySelector('[data-action="ativar"]')?.addEventListener("click", () => {
      updateDoc(alunoRef(alunoId), { treinoAtivoId: treino.id });
    });

    card.querySelector('[data-action="editar"]').addEventListener("click", () => abrirFormTreino(treino));

    card.querySelector('[data-action="copiar"]').addEventListener("click", () => abrirCopiarTreino(treino));

    card.querySelector('[data-action="excluir"]').addEventListener("click", async () => {
      if (!confirm(`Excluir o treino "${treino.nome}"? Essa ação não pode ser desfeita.`)) return;
      await deleteDoc(doc(alunoRef(alunoId), "treinos", treino.id));
      if (treino.id === alunoAtual.treinoAtivoId) {
        await updateDoc(alunoRef(alunoId), { treinoAtivoId: null });
      }
    });

    lista.appendChild(card);
  });
}

function carregarTreinos(alunoId) {
  if (unsubTreinos) unsubTreinos();
  if (unsubAlunoDoc) unsubAlunoDoc();

  const q = query(collection(alunoRef(alunoId), "treinos"), orderBy("criadoEm", "desc"));
  unsubTreinos = onSnapshot(q, (snap) => {
    treinosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTreinosList(alunoId);
  });

  // Escuta o próprio documento do aluno para refletir na hora qual treino
  // está ativo (ex: logo após clicar em "Ativar" ou excluir o treino ativo).
  unsubAlunoDoc = onSnapshot(alunoRef(alunoId), (snap) => {
    if (!snap.exists() || !alunoAtual) return;
    alunoAtual = { id: alunoId, ...snap.data() };
    renderTreinosList(alunoId);
  });
}

let treinoParaCopiar = null;

function abrirCopiarTreino(treino) {
  treinoParaCopiar = treino;
  const select = document.getElementById("copiarTreinoSelect");
  select.innerHTML = state.alunosCache
    .filter((a) => a.id !== alunoAtual.id)
    .map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`)
    .join("");
  document.getElementById("treinoForm").hidden = true;
  document.getElementById("aplicarPlanoBox").hidden = true;
  document.getElementById("copiarTreinoBox").hidden = false;
}

document.getElementById("cancelarCopiaBtn").addEventListener("click", () => {
  document.getElementById("copiarTreinoBox").hidden = true;
  treinoParaCopiar = null;
});

document.getElementById("confirmarCopiaBtn").addEventListener("click", async () => {
  const destinoId = document.getElementById("copiarTreinoSelect").value;
  if (!destinoId || !treinoParaCopiar) return;

  await addDoc(collection(alunoRef(destinoId), "treinos"), {
    nome: treinoParaCopiar.nome,
    exercicios: treinoParaCopiar.exercicios || [],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  document.getElementById("copiarTreinoBox").hidden = true;
  treinoParaCopiar = null;
  alert("Treino copiado!");
});

// ---------- Aplicar plano da biblioteca ----------

document.getElementById("aplicarPlanoBtn").addEventListener("click", () => {
  const planos = getPlanosCache();
  const select = document.getElementById("aplicarPlanoSelect");
  select.innerHTML = planos
    .map((p) => `<option value="${p.id}">${escapeHtml(p.nome)} (${escapeHtml(p.grupoMuscular || "")})</option>`)
    .join("");
  document.getElementById("treinoForm").hidden = true;
  document.getElementById("copiarTreinoBox").hidden = true;
  document.getElementById("aplicarPlanoBox").hidden = false;
});

document.getElementById("cancelarAplicarPlanoBtn").addEventListener("click", () => {
  document.getElementById("aplicarPlanoBox").hidden = true;
});

document.getElementById("confirmarAplicarPlanoBtn").addEventListener("click", async () => {
  const planoId = document.getElementById("aplicarPlanoSelect").value;
  if (!planoId || !alunoAtual) return;
  const plano = getPlanosCache().find((p) => p.id === planoId);
  if (!plano) return;

  const novoRef = await addDoc(collection(alunoRef(alunoAtual.id), "treinos"), {
    nome: plano.nome,
    exercicios: plano.exercicios || [],
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  if (!alunoAtual.treinoAtivoId) {
    await updateDoc(alunoRef(alunoAtual.id), { treinoAtivoId: novoRef.id });
    alunoAtual.treinoAtivoId = novoRef.id;
  }

  document.getElementById("aplicarPlanoBox").hidden = true;
  alert("Plano aplicado!");
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

// ---------- Dashboard (Início) ----------

let ultimoCheckinPorAluno = {};

function renderDashboard() {
  const alunos = state.alunosCache;
  const ativos = alunos.filter((a) => a.status === "ativo").length;
  const inadimplentes = alunos.filter((a) => a.status === "inadimplente").length;

  document.getElementById("statAtivos").textContent = ativos;
  document.getElementById("statInadimplentes").textContent = inadimplentes;

  // Sem treinar há mais de 7 dias (baseado no último check-in)
  const seteDiasMs = 7 * 24 * 60 * 60 * 1000;
  const agora = Date.now();
  const sumidos = alunos.filter((a) => {
    if (a.status !== "ativo") return false;
    const ultimo = ultimoCheckinPorAluno[a.id];
    return !ultimo || agora - ultimo > seteDiasMs;
  }).length;
  document.getElementById("statSumidos").textContent = sumidos;

  // Vencendo esta semana (baseado no dia de vencimento recorrente)
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const vencendo = alunos.filter((a) => {
    if (!a.diaVencimento) return false;
    let diff = a.diaVencimento - diaHoje;
    if (diff < 0) diff += 30;
    return diff >= 0 && diff <= 7;
  }).length;
  document.getElementById("statVencendo").textContent = vencendo;

  // Aniversariantes do mês
  const mesAtual = hoje.getMonth() + 1;
  const aniversariantes = alunos.filter((a) => {
    if (!a.dataNascimento) return false;
    const mes = Number(a.dataNascimento.split("-")[1]);
    return mes === mesAtual;
  });
  const box = document.getElementById("aniversariantesBox");
  const listaEl = document.getElementById("aniversariantesLista");
  if (aniversariantes.length > 0) {
    box.hidden = false;
    listaEl.innerHTML = aniversariantes
      .map((a) => {
        const dia = a.dataNascimento.split("-")[2];
        return `<li>${escapeHtml(a.nome)} — dia ${dia}</li>`;
      })
      .join("");
  } else {
    box.hidden = true;
  }
}

function carregarDashboard() {
  document.addEventListener("alunos-updated", renderDashboard);

  const q = query(collection(db, "professores", state.professorId, "checkins"), orderBy("dataHora", "desc"));
  onSnapshot(q, (snap) => {
    ultimoCheckinPorAluno = {};
    snap.docs.forEach((d) => {
      const c = d.data();
      const millis = c.dataHora?.toMillis ? c.dataHora.toMillis() : 0;
      if (!ultimoCheckinPorAluno[c.alunoId] || millis > ultimoCheckinPorAluno[c.alunoId]) {
        ultimoCheckinPorAluno[c.alunoId] = millis;
      }
    });
    renderDashboard();
  });
}

// ---------- Bootstrap ----------

requireRole("professor", (usuario) => {
  state.uid = usuario.uid;
  state.role = usuario.role;
  state.professorId = usuario.professorId;
  state.nome = usuario.nome;
  document.getElementById("nomeProfessor").textContent = usuario.nome || "Professor";

  initAlunos();
  initPagamentos();
  initCheckin();
  initAparelhos();
  initExercicios();
  initPlanos();
  initAvaliacao();
  carregarDashboard();
});
