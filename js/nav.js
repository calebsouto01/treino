// Troca a view visível e marca o item de menu correspondente como ativo.
// Compartilhado entre professor.js, planos.js e avaliacao.js pra evitar
// import circular (planos.js/avaliacao.js precisam navegar de volta pra
// outras telas sem importar professor.js).
export function irParaView(viewId) {
  document.querySelectorAll(".view").forEach((v) => {
    v.hidden = v.id !== `view-${viewId}`;
  });
  document.querySelectorAll(".sidebar__link, .sidebar__sublink").forEach((l) => {
    l.classList.toggle("is-active", l.dataset.view === viewId);
  });
}
