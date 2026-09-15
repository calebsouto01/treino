import { db } from "./firebase-config.js";
import { state } from "./state.js";
import { escapeHtml } from "./alunos.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

function checkinsCol() {
  return collection(db, "professores", state.professorId, "checkins");
}

function populateAlunoSelect(select) {
  const selecionado = select.value;
  select.innerHTML = state.alunosCache
    .map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`)
    .join("");
  if (selecionado) select.value = selecionado;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

export function initCheckin() {
  const form = document.getElementById("checkinForm");
  const alunoSelect = document.getElementById("checkinAlunoSelect");
  const tbody = document.getElementById("checkinTbody");
  const empty = document.getElementById("checkinEmpty");

  populateAlunoSelect(alunoSelect);
  document.addEventListener("alunos-updated", () => populateAlunoSelect(alunoSelect));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const alunoId = data.get("alunoId");
    if (!alunoId) return;

    const aluno = state.alunosCache.find((a) => a.id === alunoId);

    await addDoc(checkinsCol(), {
      alunoId,
      alunoNome: aluno ? aluno.nome : "",
      dataHora: serverTimestamp(),
    });
  });

  const hojeQuery = query(
    checkinsCol(),
    where("dataHora", ">=", startOfToday()),
    orderBy("dataHora", "desc")
  );

  onSnapshot(hojeQuery, (snap) => {
    const checkins = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderCheckins(checkins, tbody, empty);
  });
}

function renderCheckins(checkins, tbody, empty) {
  tbody.innerHTML = "";
  empty.hidden = checkins.length > 0;

  checkins.forEach((c) => {
    const hora = c.dataHora?.toDate
      ? c.dataHora.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(c.alunoNome)}</td><td>${hora}</td>`;
    tbody.appendChild(tr);
  });
}
