import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import { GRUPOS_MUSCULARES } from "./exercicios-catalogo.js";
import { criarLinhaExercicio, lerExerciciosDoContainer } from "./exercicio-row.js";
import { irParaView } from "./nav.js";
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

const DATALIST_ID = "catalogoExerciciosPlano";

function planosCol() {
  return collection(db, "professores", state.professorId, "planos");
}

let planosCache = [];

export function getPlanosCache() {
  return planosCache;
}

export function initPlanos() {
  const form = document.getElementById("planoForm");
  const exerciciosList = document.getElementById("planoExerciciosList");

  document.getElementById("novoPlanoBtn").addEventListener("click", () => abrirFormPlano());
  document.getElementById("addExercicioPlanoBtn").addEventListener("click", () => {
    exerciciosList.appendChild(criarLinhaExercicio(DATALIST_ID));
  });
  document.getElementById("cancelarPlanoBtn").addEventListener("click", () => irParaView("treinos"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const planoId = form.elements.planoId.value;
    const payload = {
      nome: form.elements.nome.value.trim(),
      grupoMuscular: form.elements.grupoMuscular.value,
      exercicios: lerExerciciosDoContainer(exerciciosList),
      atualizadoEm: serverTimestamp(),
    };

    if (planoId) {
      await updateDoc(doc(planosCol(), planoId), payload);
    } else {
      await addDoc(planosCol(), { ...payload, criadoEm: serverTimestamp() });
    }

    irParaView("treinos");
  });

  onSnapshot(query(planosCol(), orderBy("nome")), (snap) => {
    planosCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPlanos();
  });
}

function abrirFormPlano(plano = null) {
  const form = document.getElementById("planoForm");
  const exerciciosList = document.getElementById("planoExerciciosList");
  form.reset();
  exerciciosList.innerHTML = "";
  form.elements.planoId.value = plano ? plano.id : "";
  document.getElementById("planoFormTitulo").textContent = plano ? "Editar plano" : "Criar plano";

  if (plano) {
    form.elements.nome.value = plano.nome || "";
    form.elements.grupoMuscular.value = plano.grupoMuscular || "Peito";
    (plano.exercicios || []).forEach((ex) => exerciciosList.appendChild(criarLinhaExercicio(DATALIST_ID, ex)));
  }
  if (exerciciosList.children.length === 0) {
    exerciciosList.appendChild(criarLinhaExercicio(DATALIST_ID));
  }

  irParaView("criar-plano");
}

function renderPlanos() {
  const container = document.getElementById("planosPorGrupo");
  const empty = document.getElementById("planosEmpty");
  container.innerHTML = "";
  empty.hidden = planosCache.length > 0;

  GRUPOS_MUSCULARES.forEach((grupo) => {
    const doGrupo = planosCache.filter((p) => (p.grupoMuscular || "Corpo inteiro") === grupo);
    if (doGrupo.length === 0) return;

    const secao = document.createElement("div");
    secao.innerHTML = `<h3 class="section-subtitle">${escapeHtml(grupo)}</h3>`;

    doGrupo.forEach((plano) => {
      const card = document.createElement("div");
      card.className = "treino-card";
      card.innerHTML = `
        <div class="treino-card__info">
          <strong>${escapeHtml(plano.nome)}</strong>
          <span class="treino-card__meta">${(plano.exercicios || []).length} exercício(s)</span>
        </div>
        <div class="treino-card__actions">
          <button type="button" class="btn btn--ghost" data-action="editar">Editar</button>
          <button type="button" class="link-btn link-btn--danger" data-action="excluir">Excluir</button>
        </div>
      `;
      card.querySelector('[data-action="editar"]').addEventListener("click", () => abrirFormPlano(plano));
      card.querySelector('[data-action="excluir"]').addEventListener("click", async () => {
        if (!confirm(`Excluir o plano "${plano.nome}"? Essa ação não pode ser desfeita.`)) return;
        await deleteDoc(doc(planosCol(), plano.id));
      });
      secao.appendChild(card);
    });

    container.appendChild(secao);
  });
}
