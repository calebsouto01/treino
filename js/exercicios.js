import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import { CATALOGO_EXERCICIOS, buscarExercicioPorNome } from "./exercicios-catalogo.js";
import { getAparelhosCache } from "./aparelhos.js";
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

const DATALIST_IDS = ["catalogoExercicios", "catalogoExerciciosPlano"];

function exerciciosCol() {
  return collection(db, "professores", state.professorId, "exercicios");
}

let exerciciosCache = [];

export function getExerciciosCache() {
  return exerciciosCache;
}

// Junta o catálogo fixo com os exercícios próprios do professor, pra
// alimentar os <datalist> de autocomplete do form de treino e de plano, e o
// pool de candidatos do gerador automático de treino (por isso carrega
// articulacoes também).
export function getCatalogoCompleto() {
  const customizados = exerciciosCache.map((ex) => ({
    nome: ex.nome,
    grupo: ex.grupoMuscular,
    series: ex.series,
    repeticoes: ex.repeticoes,
    descanso: ex.descanso,
    articulacoes: ex.articulacoes || [],
  }));
  return [...CATALOGO_EXERCICIOS, ...customizados];
}

// Busca usada pelo autofill de séries/repetições/descanso ao digitar um
// nome de exercício — primeiro nos exercícios próprios do professor, depois
// no catálogo fixo.
export function buscarExercicioCompleto(nome) {
  const alvo = nome.trim().toLowerCase();
  const custom = exerciciosCache.find((ex) => ex.nome.toLowerCase() === alvo);
  if (custom) {
    return { nome: custom.nome, series: custom.series, repeticoes: custom.repeticoes, descanso: custom.descanso };
  }
  return buscarExercicioPorNome(nome);
}

function atualizarDatalists() {
  const optionsHtml = getCatalogoCompleto()
    .map((ex) => `<option value="${escapeHtml(ex.nome)}">${escapeHtml(ex.grupo || "")}</option>`)
    .join("");
  DATALIST_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = optionsHtml;
  });
}

function lerArticulacoesDoForm(form) {
  return Array.from(form.querySelectorAll('input[name="articulacoes"]:checked')).map((cb) => cb.value);
}

function marcarArticulacoesNoForm(form, articulacoes = []) {
  form.querySelectorAll('input[name="articulacoes"]').forEach((cb) => {
    cb.checked = articulacoes.includes(cb.value);
  });
}

function populateAparelhoSelect(select) {
  const selecionado = select.value;
  select.innerHTML =
    '<option value="">Nenhum</option>' +
    getAparelhosCache().map((a) => `<option value="${escapeHtml(a.nome)}">${escapeHtml(a.nome)}</option>`).join("");
  select.value = selecionado;
}

export function initExercicios() {
  atualizarDatalists();

  const form = document.getElementById("exercicioForm");
  const tbody = document.getElementById("exerciciosTbody");
  const empty = document.getElementById("exerciciosEmpty");
  const aparelhoSelect = form.elements.aparelho;

  populateAparelhoSelect(aparelhoSelect);
  document.addEventListener("aparelhos-updated", () => populateAparelhoSelect(aparelhoSelect));

  document.getElementById("novoExercicioBtn").addEventListener("click", () => {
    form.reset();
    form.elements.exercicioId.value = "";
    populateAparelhoSelect(aparelhoSelect);
    form.hidden = false;
  });

  document.getElementById("cancelarExercicioBtn").addEventListener("click", () => {
    form.hidden = true;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const exercicioId = form.elements.exercicioId.value;
    const payload = {
      nome: form.elements.nome.value.trim(),
      grupoMuscular: form.elements.grupoMuscular.value,
      aparelho: form.elements.aparelho.value,
      series: Number(form.elements.series.value) || 1,
      repeticoes: form.elements.repeticoes.value.trim(),
      descanso: form.elements.descanso.value.trim(),
      articulacoes: lerArticulacoesDoForm(form),
    };

    if (exercicioId) {
      await updateDoc(doc(exerciciosCol(), exercicioId), payload);
    } else {
      await addDoc(exerciciosCol(), { ...payload, criadoEm: serverTimestamp() });
    }

    form.hidden = true;
  });

  onSnapshot(query(exerciciosCol(), orderBy("nome")), (snap) => {
    exerciciosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderExercicios(tbody, empty, form, aparelhoSelect);
    atualizarDatalists();
  });
}

function renderExercicios(tbody, empty, form, aparelhoSelect) {
  tbody.innerHTML = "";
  empty.hidden = exerciciosCache.length > 0;

  exerciciosCache.forEach((ex) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(ex.nome)}</td>
      <td>${escapeHtml(ex.grupoMuscular || "-")}</td>
      <td>${escapeHtml(ex.aparelho || "-")}</td>
      <td>${ex.series ?? "-"}</td>
      <td>${escapeHtml(ex.repeticoes || "-")}</td>
      <td>${escapeHtml(ex.descanso || "-")}</td>
      <td class="table__actions">
        <button data-action="editar" class="link-btn">Editar</button>
        <button data-action="excluir" class="link-btn link-btn--danger">Excluir</button>
      </td>
    `;
    tr.querySelector('[data-action="editar"]').addEventListener("click", () => {
      form.elements.exercicioId.value = ex.id;
      form.elements.nome.value = ex.nome;
      form.elements.grupoMuscular.value = ex.grupoMuscular || "Peito";
      populateAparelhoSelect(aparelhoSelect);
      aparelhoSelect.value = ex.aparelho || "";
      form.elements.series.value = ex.series ?? 3;
      form.elements.repeticoes.value = ex.repeticoes || "12";
      form.elements.descanso.value = ex.descanso || "60s";
      marcarArticulacoesNoForm(form, ex.articulacoes || []);
      form.hidden = false;
    });
    tr.querySelector('[data-action="excluir"]').addEventListener("click", async () => {
      if (!confirm(`Excluir o exercício "${ex.nome}"?`)) return;
      await deleteDoc(doc(exerciciosCol(), ex.id));
    });
    tbody.appendChild(tr);
  });
}
