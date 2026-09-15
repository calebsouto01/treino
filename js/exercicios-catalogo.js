// Catálogo de exercícios comuns, com sugestões padrão de séries/repetições/
// descanso. O professor pode escolher um destes ou digitar um exercício
// livre — o catálogo é só pra agilizar, não é obrigatório.
export const CATALOGO_EXERCICIOS = [
  { nome: "Supino reto", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Supino inclinado", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Supino declinado", grupo: "Peito", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Crucifixo", grupo: "Peito", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Crossover", grupo: "Peito", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Flexão de braço", grupo: "Peito", series: 3, repeticoes: "até a falha", descanso: "45s" },

  { nome: "Puxada frente", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Puxada atrás", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Remada curvada", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Remada baixa", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Remada unilateral", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Barra fixa", grupo: "Costas", series: 3, repeticoes: "até a falha", descanso: "60s" },
  { nome: "Pulldown", grupo: "Costas", series: 3, repeticoes: "10-12", descanso: "45s" },

  { nome: "Agachamento livre", grupo: "Pernas", series: 4, repeticoes: "8-10", descanso: "90s" },
  { nome: "Agachamento no smith", grupo: "Pernas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Leg press", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "60s" },
  { nome: "Cadeira extensora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Mesa flexora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Cadeira flexora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Avanço (afundo)", grupo: "Pernas", series: 3, repeticoes: "10-12 cada perna", descanso: "60s" },
  { nome: "Stiff", grupo: "Pernas", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Panturrilha em pé", grupo: "Pernas", series: 4, repeticoes: "15-20", descanso: "30s" },
  { nome: "Panturrilha sentado", grupo: "Pernas", series: 4, repeticoes: "15-20", descanso: "30s" },
  { nome: "Cadeira adutora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "30s" },
  { nome: "Cadeira abdutora", grupo: "Pernas", series: 3, repeticoes: "12-15", descanso: "30s" },

  { nome: "Desenvolvimento com halteres", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Desenvolvimento máquina", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "60s" },
  { nome: "Elevação lateral", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Elevação frontal", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Encolhimento (trapézio)", grupo: "Ombro", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Remada alta", grupo: "Ombro", series: 3, repeticoes: "10-12", descanso: "45s" },

  { nome: "Rosca direta", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Rosca alternada", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Rosca martelo", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Rosca scott", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Tríceps corda", grupo: "Braço", series: 3, repeticoes: "12-15", descanso: "45s" },
  { nome: "Tríceps testa", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Tríceps francês", grupo: "Braço", series: 3, repeticoes: "10-12", descanso: "45s" },
  { nome: "Mergulho no banco", grupo: "Braço", series: 3, repeticoes: "até a falha", descanso: "45s" },

  { nome: "Abdominal supra", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s" },
  { nome: "Abdominal infra", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s" },
  { nome: "Abdominal oblíquo", grupo: "Abdômen", series: 3, repeticoes: "15-20 cada lado", descanso: "30s" },
  { nome: "Prancha", grupo: "Abdômen", series: 3, repeticoes: "30-60s", descanso: "30s" },
  { nome: "Elevação de pernas", grupo: "Abdômen", series: 3, repeticoes: "15-20", descanso: "30s" },

  { nome: "Esteira", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-" },
  { nome: "Bicicleta ergométrica", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-" },
  { nome: "Elíptico", grupo: "Cardio", series: 1, repeticoes: "20-30 min", descanso: "-" },
  { nome: "HIIT", grupo: "Cardio", series: 1, repeticoes: "15-20 min", descanso: "-" },
  { nome: "Pular corda", grupo: "Cardio", series: 3, repeticoes: "2 min", descanso: "60s" },
];

export function buscarExercicioPorNome(nome) {
  const alvo = nome.trim().toLowerCase();
  return CATALOGO_EXERCICIOS.find((ex) => ex.nome.toLowerCase() === alvo) || null;
}
