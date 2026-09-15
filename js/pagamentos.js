import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function pagamentosCol() {
  return collection(db, "academias", state.academiaId, "pagamentos");
}

function alunosCol() {
  return collection(db, "academias", state.academiaId, "alunos");
}

function populateAlunoSelect(select) {
  const selecionado = select.value;
  select.innerHTML = state.alunosCache
    .map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`)
    .join("");
  if (selecionado) select.value = selecionado;
}

export function initPagamentos() {
  const form = document.getElementById("pagamentoForm");
  const alunoSelect = document.getElementById("pagamentoAlunoSelect");
  const tbody = document.getElementById("pagamentosTbody");
  const empty = document.getElementById("pagamentosEmpty");

  populateAlunoSelect(alunoSelect);
  document.addEventListener("alunos-updated", () => populateAlunoSelect(alunoSelect));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const alunoId = data.get("alunoId");
    if (!alunoId) return;

    const aluno = state.alunosCache.find((a) => a.id === alunoId);

    await addDoc(pagamentosCol(), {
      alunoId,
      alunoNome: aluno ? aluno.nome : "",
      valor: Number(data.get("valor")),
      mesReferencia: data.get("mesReferencia"),
      forma: data.get("forma"),
      registradoEm: serverTimestamp(),
    });

    // marca o aluno como ativo ao registrar pagamento
    if (aluno) {
      await updateDoc(doc(alunosCol(), alunoId), { status: "ativo" });
    }

    form.reset();
  });

  onSnapshot(query(pagamentosCol(), orderBy("registradoEm", "desc")), (snap) => {
    const pagamentos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPagamentos(pagamentos, tbody, empty);
  });
}

function renderPagamentos(pagamentos, tbody, empty) {
  tbody.innerHTML = "";
  empty.hidden = pagamentos.length > 0;

  pagamentos.forEach((p) => {
    const data = p.registradoEm?.toDate ? p.registradoEm.toDate().toLocaleDateString("pt-BR") : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.alunoNome)}</td>
      <td>${escapeHtml(p.mesReferencia)}</td>
      <td>R$ ${Number(p.valor).toFixed(2).replace(".", ",")}</td>
      <td>${escapeHtml(p.forma)}</td>
      <td>${data}</td>
    `;
    tbody.appendChild(tr);
  });
}
