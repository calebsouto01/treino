# Academia SaaS

Sistema para personal trainers, com **2 papéis** — **professor** e **aluno**
— inspirado nas funcionalidades do MFIT Personal (prescrição de treino,
avaliação física, execução com feedback obrigatório, evolução).

## Papéis

- **Professor**: painel Início com resumo (ativos, inadimplentes, sumidos há
  +7 dias, mensalidades vencendo, aniversariantes); cadastra seus alunos (com
  login próprio, busca/filtro por status e observações privadas); mantém uma
  **biblioteca de planos de treino reutilizáveis** organizados por grupo
  muscular (Mod A, Mod B...) e **aplica um plano pra qualquer aluno** com um
  clique, além de continuar podendo montar treinos avulsos por aluno com
  histórico (não sobrescreve o anterior) e marcar qual está ativo; registra
  avaliação física (peso, altura, IMC, medidas) numa tela própria (escolhe o
  aluno, depois vê/lança a avaliação); controla mensalidades (com resumo de
  recebido no mês e cobrança rápida via WhatsApp) e check-in; acompanha o
  histórico de execuções/feedback de cada aluno. Na prescrição, o campo de
  exercício sugere nomes tanto da **biblioteca fixa pré-cadastrada**
  (`js/exercicios-catalogo.js`) quanto dos **exercícios próprios do
  professor** (cadastro editável, cada um com grupo muscular, aparelho
  vinculado e séries/repetições/descanso padrão) e preenche esses campos
  automaticamente — mas continua aceitando texto livre. Os aparelhos também
  têm cadastro próprio, reaproveitado no campo "aparelho" de cada exercício.

  O menu do professor é organizado em grupos: **Alunos** (Cadastrar,
  Avaliação), **Treinos** (Treinos — lista de planos por grupo muscular,
  Criar planos, Exercícios, Aparelhos), **Pagamentos** (Visão geral) e
  **Check-in** (Registrar).

  No cadastro do aluno, além dos dados básicos, o professor define
  **objetivo** (hipertrofia/emagrecimento/condicionamento), **nível de
  experiência**, **frequência semanal** desejada e **restrições/lesões**
  (por articulação). Com isso, o botão **"🤖 Gerar treino automático"** (na
  aba Treino do detalhe do aluno) monta sozinho a divisão de treino
  adequada — reaproveitando a mesma biblioteca de exercícios — e abre pra
  revisão no formulário de treino já existente antes de salvar. Ver
  "Geração automática de treino" abaixo.
- **Aluno**: vê o treino atual, executa e **precisa dar feedback para
  concluir** (mesma lógica do MFIT: se tem feedback, o treino foi feito),
  acompanha histórico, gráfico de evolução de peso e faz seu próprio
  check-in.

Na tela inicial (`index.html`) a pessoa escolhe primeiro "Sou Professor" ou
"Sou Aluno" e só depois vê o formulário de login — só o professor tem opção
de "Criar conta"; o aluno recebe e-mail/senha do próprio professor.

## Stack

- HTML/CSS/JS puro (sem build step) + [Firebase](https://firebase.google.com)
  - **Authentication** (e-mail/senha)
  - **Firestore** para dados

## Estrutura de dados (Firestore)

```
usuarios/{uid} → { nome, email, role: 'professor'|'aluno', professorId }
  // para professor: professorId == uid (o próprio)
  // para aluno: professorId == uid do professor que o criou

professores/{profUid} → { nome, email, criadoEm }   // profUid == uid do professor
  /alunos/{alunoUid} → {
    nome, telefone, email, plano, status, diaVencimento,
    dataNascimento, observacoes, treinoAtivoId,
    objetivo, nivel, frequenciaSemanal, restricoes: [...]
  }
    /treinos/{treinoId}         → { nome, exercicios:[{nome,series,repeticoes,carga,descanso,videoUrl}], criadoEm }
    /execucoes/{execId}         → { treinoNome, exerciciosFeitos:[...], feedback, nota, data }
    /avaliacoes/{avalId}        → { peso, altura, cintura, quadril, braco, coxa, observacoes, data }
    /evolucao/{evoId}           → { peso, data }
  /pagamentos/{pagamentoId}     → { alunoId, alunoNome, valor, mesReferencia, forma, registradoEm }
  /checkins/{checkinId}         → { alunoId, alunoNome, dataHora }
  /planos/{planoId}             → { nome, grupoMuscular, exercicios:[{nome,series,repeticoes,carga,descanso,videoUrl}], criadoEm }
  /exercicios/{exercicioId}     → { nome, grupoMuscular, aparelho, series, repeticoes, descanso, criadoEm }
  /aparelhos/{aparelhoId}       → { nome, criadoEm }
```

`planos/{planoId}` é a **biblioteca de modelos de treino** do professor —
independente de aluno. "Aplicar plano" (em `alunos/{alunoUid}` > Treino) copia
o conteúdo de um plano pra um novo doc em `alunos/{alunoUid}/treinos`, do
mesmo jeito que "copiar treino entre alunos" já funcionava.

`exercicios/{exercicioId}` e `aparelhos/{aparelhoId}` são cadastros próprios
do professor (Treinos > Exercícios / Aparelhos). Os exercícios próprios
entram automaticamente nas sugestões de autocomplete (`js/exercicios.js`
mescla com `js/exercicios-catalogo.js`) usadas tanto no form de treino
avulso quanto no form de plano — o `aparelho` de cada exercício é um campo
de texto preenchido a partir da lista de `aparelhos`, sem exigir que o
exercício aponte pra um documento específico.

### Geração automática de treino

`js/gerador-treino.js` exporta `gerarTreinos(aluno, ultimaAvaliacao, catalogoCompleto)`,
uma função pura (sem DOM, sem Firestore) que decide:

- **divisão** pela frequência semanal (1-2x → full body; 3x → A/B/C por
  grupo; 4x → upper/lower; 5-6x → um treino por grupo muscular, usando
  `GRUPOS_MUSCULARES`);
- **volume** (séries/repetições/descanso/quantidade de exercícios por
  grupo) pelo nível de experiência;
- **ênfase** pelo objetivo (emagrecimento reduz descanso, aumenta
  repetições e acrescenta um bloco de cardio — mais longo se o IMC da
  última avaliação for alto; hipertrofia mantém volume padrão);
- **filtro de restrições**: exclui do pool qualquer exercício cuja(s)
  `articulacoes` cruze(m) com as restrições do aluno (por isso cada
  exercício do catálogo fixo e dos próprios do professor tem esse campo).

Não é IA — é um algoritmo determinístico, sem custo por geração, que roda
inteiramente no navegador. O resultado nunca é aplicado direto: abre no
mesmo form de "novo treino" que já existe pra revisão, e se gerar mais de
um treino (ex: divisão A/B/C), o próximo abre automaticamente assim que o
professor salva o anterior.

`alunos/{alunoUid}.treinoAtivoId` aponta pro treino (dentro de `treinos/`)
que o aluno está vendo atualmente — o professor pode ter vários treinos
cadastrados (histórico) e trocar qual está ativo a qualquer momento, ou
copiar um treino pronto de um aluno pra outro.

`alunos/{alunoUid}` é criado com o **próprio uid da conta Firebase Auth do
aluno** (não um ID aleatório) — isso é o que permite as regras de segurança
restringirem cada aluno aos seus próprios dados sem lógica extra no servidor.

As regras (`firestore.rules`) garantem que: o professor só acessa os
próprios `professores/{profId}/...`; o aluno só lê/edita os próprios dados
(seu registro, treino, execuções, evolução) dentro do professor a que
pertence.

### Truque de criação de conta sem deslogar

Como o SDK do Firebase Auth no navegador só mantém uma sessão ativa por vez,
criar a conta de um aluno teria o efeito colateral de deslogar o professor
que está criando. Para evitar isso, `js/create-user.js` cria um **app
Firebase secundário temporário** (`initializeApp(config, "secundario-...")`),
registra a nova conta nele, e descarta o app — sem afetar a sessão do
professor. É a abordagem padrão da comunidade para esse cenário sem precisar
de Cloud Functions/Admin SDK.

## Simplificações conscientes em relação ao MFIT

- Sem biblioteca própria de vídeos (o professor cola um link externo por
  exercício, ex: YouTube)
- Sem gateway de pagamento integrado (Pix/boleto/cartão automático) — os
  pagamentos continuam sendo registrados manualmente pelo professor
- Um único protocolo de avaliação física (peso/altura/IMC/medidas), em vez
  dos 11 protocolos de dobras cutâneas do MFIT
- "Vencendo esta semana" e "aniversariantes do mês" no dashboard são
  calculados no navegador a partir do dia/data cadastrado — não há
  notificação push nem e-mail automático ainda
- Excluir um aluno remove o registro no Firestore, mas não a conta no
  Firebase Authentication (precisaria do Admin SDK/Cloud Functions)

## Rodando localmente

```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules
```

O projeto já está configurado em `.firebaserc` para o Firebase project
`assistente-67362`. **Sempre que `firestore.rules` mudar, é preciso publicar
de novo** (`firebase deploy --only firestore:rules` ou colar manualmente em
Firebase Console → Firestore → Rules).

## Próximos passos sugeridos

- Múltiplos protocolos de avaliação física (dobras cutâneas)
- Cobrança automática (Pix/cartão) integrada
- Fotos de progresso (Firebase Storage)
- Notificações push/e-mail (treino do dia, mensalidade a vencer)
- Geração de treino via IA (exigiria Cloud Functions pra não expor chave de
  API no navegador) como alternativa/complemento ao gerador por regras
- Progressão automática do treino gerado ao longo do tempo, ajustando
  carga/reps conforme o histórico de execuções do aluno
