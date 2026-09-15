// Gerador automático de treino: função pura, sem DOM, que decide a divisão,
// o volume e os exercícios a partir dos dados do aluno. Não salva nada no
// Firestore — quem chama recebe um array de "treinos" no mesmo formato que
// já é salvo em alunos/{id}/treinos, e decide o que fazer com eles (ex:
// abrir pra revisão antes de salvar).

const VOLUME_POR_NIVEL = {
  iniciante: { series: 3, repeticoes: "12-15", descanso: "60s", exerciciosPorGrupo: 2 },
  intermediario: { series: 3, repeticoes: "10-12", descanso: "60s", exerciciosPorGrupo: 3 },
  avancado: { series: 4, repeticoes: "8-10", descanso: "45s", exerciciosPorGrupo: 4 },
};

function calcularImc(peso, altura) {
  if (!peso || !altura) return null;
  return peso / (altura * altura);
}

function definirDivisao(frequenciaSemanal) {
  if (frequenciaSemanal <= 2) {
    return [{ nome: "Treino Full Body", grupos: ["Peito", "Costas", "Pernas", "Ombro", "Braço", "Abdômen"] }];
  }
  if (frequenciaSemanal === 3) {
    return [
      { nome: "Treino A - Peito e Braço", grupos: ["Peito", "Braço"] },
      { nome: "Treino B - Costas e Ombro", grupos: ["Costas", "Ombro"] },
      { nome: "Treino C - Pernas e Abdômen", grupos: ["Pernas", "Abdômen"] },
    ];
  }
  if (frequenciaSemanal === 4) {
    return [
      { nome: "Treino A - Superior", grupos: ["Peito", "Costas", "Ombro", "Braço"] },
      { nome: "Treino B - Inferior", grupos: ["Pernas", "Abdômen"] },
    ];
  }
  return [
    { nome: "Treino A - Peito", grupos: ["Peito"] },
    { nome: "Treino B - Costas", grupos: ["Costas"] },
    { nome: "Treino C - Pernas", grupos: ["Pernas"] },
    { nome: "Treino D - Ombro", grupos: ["Ombro"] },
    { nome: "Treino E - Braço e Abdômen", grupos: ["Braço", "Abdômen"] },
  ];
}

function montarExercicio(candidato, volume) {
  return {
    nome: candidato.nome,
    series: volume.series,
    repeticoes: volume.repeticoes,
    carga: "",
    descanso: volume.descanso,
    videoUrl: "",
  };
}

function montarCardio(candidatoCardio, imc) {
  if (!candidatoCardio) return null;
  const duracaoLonga = imc && imc >= 27;
  return {
    nome: candidatoCardio.nome,
    series: 1,
    repeticoes: duracaoLonga ? "25-30 min" : "15-20 min",
    carga: "",
    descanso: "-",
    videoUrl: "",
  };
}

export function gerarTreinos(aluno, ultimaAvaliacao, catalogoCompleto) {
  const { objetivo, nivel, frequenciaSemanal, restricoes = [] } = aluno;
  const volume = VOLUME_POR_NIVEL[nivel] || VOLUME_POR_NIVEL.intermediario;
  const imc = ultimaAvaliacao ? calcularImc(ultimaAvaliacao.peso, ultimaAvaliacao.altura) : null;

  const volumeAjustado =
    objetivo === "emagrecimento" ? { ...volume, repeticoes: "15-20", descanso: "30-45s" } : volume;

  const disponiveis = catalogoCompleto.filter(
    (ex) => !(ex.articulacoes || []).some((art) => restricoes.includes(art))
  );

  const adicionaCardio = objetivo === "emagrecimento" || objetivo === "condicionamento";
  const candidatosCardio = disponiveis.filter((ex) => ex.grupo === "Cardio");

  const divisao = definirDivisao(Number(frequenciaSemanal) || 3);

  return divisao.map((dia) => {
    const exercicios = [];

    dia.grupos.forEach((grupo) => {
      const candidatosDoGrupo = disponiveis.filter((ex) => ex.grupo === grupo);
      candidatosDoGrupo.slice(0, volumeAjustado.exerciciosPorGrupo).forEach((candidato) => {
        exercicios.push(montarExercicio(candidato, volumeAjustado));
      });
    });

    if (adicionaCardio && candidatosCardio.length > 0) {
      const cardio = montarCardio(candidatosCardio[0], imc);
      if (cardio) exercicios.push(cardio);
    }

    return {
      nome: dia.nome,
      grupoMuscular: dia.grupos[0],
      exercicios,
    };
  });
}
