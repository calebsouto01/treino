import { buscarExercicioPorNome } from "./exercicios-catalogo.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Linha de exercício reutilizada tanto no form de treino (aluno-detalhe)
// quanto no form de plano (biblioteca de planos). datalistId aponta pro
// <datalist> com as sugestões do catálogo daquela tela.
export function criarLinhaExercicio(datalistId, ex = {}) {
  const row = document.createElement("div");
  row.className = "exercicio-row";
  row.innerHTML = `
    <label>Exercício<input type="text" data-field="nome" list="${datalistId}" placeholder="Digite ou escolha da lista" value="${escapeHtml(ex.nome || "")}" required></label>
    <label>Séries<input type="number" min="1" data-field="series" value="${ex.series ?? 3}" required></label>
    <label>Repetições<input type="text" data-field="repeticoes" value="${escapeHtml(ex.repeticoes || "12")}" required></label>
    <label>Carga<input type="text" data-field="carga" value="${escapeHtml(ex.carga || "")}" placeholder="Ex: 20kg"></label>
    <label>Descanso<input type="text" data-field="descanso" value="${escapeHtml(ex.descanso || "60s")}"></label>
    <label>Vídeo (opcional)<input type="url" data-field="videoUrl" value="${escapeHtml(ex.videoUrl || "")}" placeholder="https://..."></label>
    <button type="button" class="remove-exercicio" title="Remover">✕</button>
  `;
  row.querySelector(".remove-exercicio").addEventListener("click", () => row.remove());

  row.querySelector('[data-field="nome"]').addEventListener("change", (e) => {
    const doCatalogo = buscarExercicioPorNome(e.target.value);
    if (!doCatalogo) return;
    row.querySelector('[data-field="series"]').value = doCatalogo.series;
    row.querySelector('[data-field="repeticoes"]').value = doCatalogo.repeticoes;
    row.querySelector('[data-field="descanso"]').value = doCatalogo.descanso;
  });

  return row;
}

export function lerExerciciosDoContainer(containerEl) {
  return Array.from(containerEl.querySelectorAll(".exercicio-row")).map((row) => ({
    nome: row.querySelector('[data-field="nome"]').value.trim(),
    series: Number(row.querySelector('[data-field="series"]').value) || 1,
    repeticoes: row.querySelector('[data-field="repeticoes"]').value.trim(),
    carga: row.querySelector('[data-field="carga"]').value.trim(),
    descanso: row.querySelector('[data-field="descanso"]').value.trim(),
    videoUrl: row.querySelector('[data-field="videoUrl"]').value.trim(),
  }));
}
