// Catálogo de exercícios comuns, com sugestões padrão de séries/repetições/
// descanso e as articulações que cada um sobrecarrega (usado pelo gerador
// automático de treino pra filtrar exercícios conforme restrições do aluno).
// O professor pode escolher um destes ou digitar um exercício livre — o
// catálogo é só pra agilizar, não é obrigatório.
export const CATALOGO_EXERCICIOS = [
  { nome: "Supino reto", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro", "cotovelo"] },
  { nome: "Supino inclinado", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro", "cotovelo"] },
  { nome: "Supino declinado", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro", "cotovelo"] },
  { nome: "Crucifixo", grupo: "Peito", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Crossover", grupo: "Peito", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Flexão de braço", grupo: "Peito", series: 3, repeticoes: "até a falha", descanso: "45s", articulacoes: ["ombro", "cotovelo", "punho"] },

  { nome: "Puxada frente", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro"] },
  { nome: "Puxada atrás", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro"] },
  { nome: "Remada curvada", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["lombar", "ombro"] },
  { nome: "Remada baixa", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["lombar"] },
  { nome: "Remada unilateral", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Barra fixa", grupo: "Costas", series: 3, repeticoes: "até a falha", descanso: "60s", articulacoes: ["ombro"] },
  { nome: "Pulldown", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["ombro"] },

  { nome: "Agachamento livre", grupo: "Pernas", series: 4, repeticoes: "8-10", descanso: "90s", articulacoes: ["joelho", "lombar"] },
  { nome: "Agachamento no smith", grupo: "Pernas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["joelho"] },
  { nome: "Leg press", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "60s", articulacoes: ["joelho"] },
  { nome: "Cadeira extensora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["joelho"] },
  { nome: "Mesa flexora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["joelho"] },
  { nome: "Cadeira flexora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["joelho"] },
  { nome: "Avanço (afundo)", grupo: "Pernas", series: 3, repeticoes: "10-12 cada perna", descanso: "60s", articulacoes: ["joelho"] },
  { nome: "Stiff", grupo: "Pernas", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["lombar"] },
  { nome: "Panturrilha em pé", grupo: "Pernas", series: 4, repeticoes: "15-20", descanso: "30s", articulacoes: ["tornozelo"] },
  { nome: "Panturrilha sentado", grupo: "Pernas", series: 4, repeticoes: "15-20", descanso: "30s", articulacoes: ["tornozelo"] },
  { nome: "Cadeira adutora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "30s", articulacoes: ["quadril"] },
  { nome: "Cadeira abdutora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "30s", articulacoes: ["quadril"] },

  { nome: "Desenvolvimento com halteres", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro"] },
  { nome: "Desenvolvimento máquina", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "60s", articulacoes: ["ombro"] },
  { nome: "Elevação lateral", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Elevação frontal", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Encolhimento (trapézio)", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["ombro"] },
  { nome: "Remada alta", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["ombro", "punho"] },

  { nome: "Rosca direta", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo", "punho"] },
  { nome: "Rosca alternada", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo", "punho"] },
  { nome: "Rosca martelo", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo", "punho"] },
  { nome: "Rosca scott", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo"] },
  { nome: "Tríceps corda", grupo: "Braço", series: 3, repeticoes: "12-15", descanso: "45s", articulacoes: ["cotovelo"] },
  { nome: "Tríceps testa", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo", "ombro"] },
  { nome: "Tríceps francês", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s", articulacoes: ["cotovelo", "ombro"] },
  { nome: "Mergulho no banco", grupo: "Braço", series: 3, repeticoes: "até a falha", descanso: "45s", articulacoes: ["ombro", "cotovelo", "punho"] },

  { nome: "Abdominal supra", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s", articulacoes: ["lombar"] },
  { nome: "Abdominal infra", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s", articulacoes: ["lombar"] },
  { nome: "Abdominal oblíquo", grupo: "Abdômen", series: 3, repeticoes: "15-20 cada lado", descanso: "30s", articulacoes: ["lombar"] },
  { nome: "Prancha", grupo: "Abdômen", series: 3, repeticoes: "30-60s", descanso: "30s", articulacoes: ["ombro", "punho"] },
  { nome: "Elevação de pernas", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s", articulacoes: ["lombar", "quadril"] },

  { nome: "Esteira", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-", articulacoes: ["joelho", "tornozelo"] },
  { nome: "Bicicleta ergométrica", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-", articulacoes: ["joelho"] },
  { nome: "Elíptico", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-", articulacoes: ["joelho", "tornozelo"] },
  { nome: "HIIT", grupo: "Cardio", series: 1, repeticoes: "15-20 min", descanso: "-", articulacoes: ["joelho", "tornozelo"] },
  { nome: "Pular corda", grupo: "Cardio", series: 3, repeticoes: "2 min", descanso: "60s", articulacoes: ["tornozelo", "joelho"] },
];

export function buscarExercicioPorNome(nome) {
  const alvo = nome.trim().toLowerCase();
  return CATALOGO_EXERCICIOS.find((ex) => ex.nome.toLowerCase() === alvo) || null;
}

// Grupos usados tanto no cadastro de exercícios quanto no de planos, pra
// manter as duas telas com a mesma categorização.
export const GRUPOS_MUSCULARES = ["Peito", "Costas", "Pernas", "Ombro", "Braço", "Abdômen", "Cardio", "Corpo inteiro"];

// Articulações usadas no cadastro de exercícios (o que aquele exercício
// sobrecarrega) e nas restrições do aluno (o que evitar) — o gerador
// automático de treino cruza as duas listas pra filtrar exercícios.
export const ARTICULACOES = ["joelho", "ombro", "lombar", "punho", "tornozelo", "quadril", "cotovelo"];
