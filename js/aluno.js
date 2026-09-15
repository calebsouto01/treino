import { auth, db } from "./firebase-config.js";
import { state } from "./state.js";
import { requireRole } from "./guard.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  collection,
  addDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function alunoRef() {
  return doc(db, "professores", state.professorId, "alunos", state.uid);
}

// ---------- Navegação ----------

const views = document.querySelectorAll(".view");
document.querySelectorAll(".sidebar__link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".sidebar__link").forEach((l) => l.classList.remove("is-active"));
    link.classList.add("is-active");
    const target = link.dataset.view;
    views.forEach((v) => (v.hidden = v.id !== `view-${target}`));
  });
});

// ---------- Meu treino ----------

let treinoAtual = null;

async function carregarTreino() {
  const snap = await getDoc(doc(alunoRef(), "treinos", "atual"));
  const semTreino = document.getElementById("semTreino");
  const container = document.getElementById("exerciciosExecucao");
  const finalizarForm = document.getElementById("finalizarForm");
  container.innerHTML = "";

  if (!snap.exists() || !(snap.data().exercicios || []).length) {
    semTreino.hidden = false;
    finalizarForm.hidden = true;
    document.getElementById("treinoNomeTitulo").textContent = "Meu treino";
    treinoAtual = null;
    return;
  }

  treinoAtual = snap.data();
  semTreino.hidden = true;
  finalizarForm.hidden = false;
  document.getElementById("treinoNomeTitulo").textContent = treinoAtual.nome || "Meu treino";

  treinoAtual.exercicios.forEach((ex, i) => {
    const card = document.createElement("div");
    card.className = "exercicio-card";
    card.innerHTML = `
      <input type="checkbox" data-idx="${i}" class="exercicio-feito">
      <div class="exercicio-card__info">
        <strong>${escapeHtml(ex.nome)}</strong>
        <span class="exercicio-card__meta">${ex.series}x${escapeHtml(ex.repeticoes)} · carga sugerida: ${escapeHtml(ex.carga || "-")} · descanso: ${escapeHtml(ex.descanso || "-")}</span>
      </div>
      <label>Carga usada<input type="text" class="carga-usada" placeholder="${escapeHtml(ex.carga || "kg")}"></label>
    `;
    const checkbox = card.querySelector(".exercicio-feito");
    checkbox.addEventListener("change", () => card.classList.toggle("is-done", checkbox.checked));
    container.appendChild(card);
  });
}

document.getElementById("finalizarForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!treinoAtual) return;

  const data = new FormData(e.target);
  const exerciciosFeitos = Array.from(document.querySelectorAll("#exerciciosExecucao .exercicio-card")).map((card, i) => ({
    nome: treinoAtual.exercicios[i].nome,
    feito: card.querySelector(".exercicio-feito").checked,
    cargaUsada: card.querySelector(".carga-usada").value.trim(),
  }));

  await addDoc(collection(alunoRef(), "execucoes"), {
    treinoNome: treinoAtual.nome,
    exerciciosFeitos,
    feedback: data.get("feedback").trim(),
    nota: Number(data.get("nota")),
    data: serverTimestamp(),
  });

  alert("Treino concluído! Bom trabalho 💪");
  e.target.reset();
  document.querySelectorAll("#exerciciosExecucao .exercicio-card").forEach((card) => {
    card.classList.remove("is-done");
    card.querySelector(".exercicio-feito").checked = false;
    card.querySelector(".carga-usada").value = "";
  });
});

// ---------- Histórico ----------

function carregarHistorico() {
  const tbody = document.getElementById("historicoTbody");
  const empty = document.getElementById("historicoEmpty");

  const q = query(collection(alunoRef(), "execucoes"), orderBy("data", "desc"));
  onSnapshot(q, (snap) => {
    const execucoes = snap.docs.map((d) => d.data());
    tbody.innerHTML = "";
    empty.hidden = execucoes.length > 0;

    execucoes.forEach((ex) => {
      const data = ex.data?.toDate ? ex.data.toDate().toLocaleDateString("pt-BR") : "-";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data}</td>
        <td>${escapeHtml(ex.treinoNome || "-")}</td>
        <td>${"⭐".repeat(ex.nota || 0)}</td>
        <td>${escapeHtml(ex.feedback || "-")}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ---------- Evolução ----------

function desenharGrafico(pontos) {
  const box = document.getElementById("graficoEvolucao");
  const empty = document.getElementById("evolucaoEmpty");

  if (pontos.length === 0) {
    box.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const w = 600;
  const h = 220;
  const pad = 30;
  const pesos = pontos.map((p) => p.peso);
  const min = Math.min(...pesos) - 1;
  const max = Math.max(...pesos) + 1;

  const coords = pontos.map((p, i) => {
    const x = pad + (i / Math.max(pontos.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((p.peso - min) / (max - min || 1)) * (h - pad * 2);
    return { x, y, peso: p.peso };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const pontosSvg = coords
    .map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="#6c5ce7"></circle>`)
    .join("");
  const labels = coords
    .map((c) => `<text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" font-size="11" text-anchor="middle" fill="#1f2333">${c.peso}</text>`)
    .join("");

  box.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}">
      <path d="${pathD}" fill="none" stroke="#6c5ce7" stroke-width="2.5"></path>
      ${pontosSvg}
      ${labels}
    </svg>
  `;
}

function carregarEvolucao() {
  const q = query(collection(alunoRef(), "evolucao"), orderBy("data", "asc"));
  onSnapshot(q, (snap) => {
    const pontos = snap.docs.map((d) => d.data());
    desenharGrafico(pontos);
  });
}

document.getElementById("pesoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  await addDoc(collection(alunoRef(), "evolucao"), {
    peso: Number(data.get("peso")),
    data: serverTimestamp(),
  });
  e.target.reset();
});

// ---------- Check-in ----------

document.getElementById("checkinBtn").addEventListener("click", async () => {
  await addDoc(collection(db, "professores", state.professorId, "checkins"), {
    alunoId: state.uid,
    alunoNome: state.nome,
    dataHora: serverTimestamp(),
  });
});

function carregarMeusCheckins() {
  const tbody = document.getElementById("meusCheckinsTbody");
  const empty = document.getElementById("meusCheckinsEmpty");

  const q = query(collection(db, "professores", state.professorId, "checkins"), where("alunoId", "==", state.uid));
  onSnapshot(q, (snap) => {
    const checkins = snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.dataHora?.toMillis?.() || 0) - (a.dataHora?.toMillis?.() || 0))
      .slice(0, 20);

    tbody.innerHTML = "";
    empty.hidden = checkins.length > 0;

    checkins.forEach((c) => {
      const dt = c.dataHora?.toDate ? c.dataHora.toDate() : null;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dt ? dt.toLocaleDateString("pt-BR") : "-"}</td>
        <td>${dt ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ---------- Bootstrap ----------

requireRole("aluno", (usuario) => {
  state.uid = usuario.uid;
  state.role = usuario.role;
  state.professorId = usuario.professorId;
  state.nome = usuario.nome;
  document.getElementById("nomeAluno").textContent = usuario.nome || "Aluno";

  carregarTreino();
  carregarHistorico();
  carregarEvolucao();
  carregarMeusCheckins();
});
