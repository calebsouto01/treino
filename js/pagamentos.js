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
  return collection(db, "professores", state.professorId, "pagamentos");
}

function alunosCol() {
  return collection(db, "professores", state.professorId, "alunos");
}

function populateAlunoSelect(select) {
  const selecionado = select.value;
  select.innerHTML = state.alunosCache
    .map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`)
    .join("");
  if (selecionado) select.value = selecionado;
}

function renderInadimplentes() {
  const inadimplentes = state.alunosCache.filter((a) => a.status === "inadimplente");
  document.getElementById("statInadimplentesFin").textContent = inadimplentes.length;

  const container = document.getElementById("inadimplentesLista");
  if (inadimplentes.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML =
    '<h3 class="section-subtitle">Alunos inadimplentes</h3>' +
    '<ul class="simple-list">' +
    inadimplentes
      .map((a) => {
        const telefone = (a.telefone || "").replace(/\D/g, "");
        const texto = encodeURIComponent(`Olá ${a.nome}! Tudo bem? Passando pra lembrar que sua mensalidade está em aberto. Pode verificar pra mim?`);
        const link = telefone
          ? `<a class="whatsapp-link" target="_blank" rel="noopener" href="https://wa.me/55${telefone}?text=${texto}">Cobrar via WhatsApp</a>`
          : "";
        return `<li>${escapeHtml(a.nome)} ${link}</li>`;
      })
      .join("") +
    "</ul>";
}

export function initPagamentos() {
  const form = document.getElementById("pagamentoForm");
  const alunoSelect = document.getElementById("pagamentoAlunoSelect");
  const tbody = document.getElementById("pagamentosTbody");
  const empty = document.getElementById("pagamentosEmpty");

  populateAlunoSelect(alunoSelect);
  renderInadimplentes();
  document.addEventListener("alunos-updated", () => {
    populateAlunoSelect(alunoSelect);
    renderInadimplentes();
  });

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
    renderRecebidoMes(pagamentos);
  });
}

function renderRecebidoMes(pagamentos) {
  const agora = new Date();
  const total = pagamentos
    .filter((p) => {
      const d = p.registradoEm?.toDate ? p.registradoEm.toDate() : null;
      return d && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    })
    .reduce((soma, p) => soma + (Number(p.valor) || 0), 0);

  document.getElementById("statRecebidoMes").textContent = "R$ " + total.toFixed(2).replace(".", ",");
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
