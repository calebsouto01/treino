import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function alunoRef(alunoId) {
  return doc(db, "professores", state.professorId, "alunos", alunoId);
}

function calcularImc(peso, altura) {
  if (!peso || !altura) return "-";
  return (peso / (altura * altura)).toFixed(1);
}

function populateAlunoSelect(select) {
  const selecionado = select.value;
  select.innerHTML =
    '<option value="">Selecione um aluno...</option>' +
    state.alunosCache.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join("");
  select.value = selecionado;
}

let unsubAvaliacoes = null;

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

export function initAvaliacao() {
  const select = document.getElementById("avaliacaoAlunoSelect");
  const conteudo = document.getElementById("avaliacaoConteudo");
  const semAluno = document.getElementById("avaliacaoSemAluno");
  const form = document.getElementById("avaliacaoForm");

  let alunoSelecionadoId = null;

  populateAlunoSelect(select);
  document.addEventListener("alunos-updated", () => populateAlunoSelect(select));

  select.addEventListener("change", () => {
    alunoSelecionadoId = select.value || null;
    if (!alunoSelecionadoId) {
      if (unsubAvaliacoes) unsubAvaliacoes();
      conteudo.hidden = true;
      semAluno.hidden = false;
      return;
    }
    conteudo.hidden = false;
    semAluno.hidden = true;
    carregarAvaliacoes(alunoSelecionadoId);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!alunoSelecionadoId) return;
    const data = new FormData(form);

    await addDoc(collection(alunoRef(alunoSelecionadoId), "avaliacoes"), {
      peso: Number(data.get("peso")),
      altura: Number(data.get("altura")),
      cintura: data.get("cintura") ? Number(data.get("cintura")) : null,
      quadril: data.get("quadril") ? Number(data.get("quadril")) : null,
      braco: data.get("braco") ? Number(data.get("braco")) : null,
      coxa: data.get("coxa") ? Number(data.get("coxa")) : null,
      observacoes: data.get("observacoes").trim(),
      data: serverTimestamp(),
    });

    form.reset();
  });
}
