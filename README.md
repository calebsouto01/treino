# Academia SaaS

Sistema para personal trainers, com **2 papéis** — **professor** e **aluno**
— inspirado nas funcionalidades do MFIT Personal (prescrição de treino,
avaliação física, execução com feedback obrigatório, evolução).

## Papéis

- **Professor**: cadastra seus alunos (com login próprio), prescreve treino
  (exercícios com séries/repetições/carga/descanso), registra avaliação
  física (peso, altura, IMC, medidas), controla mensalidades e check-in, e
  acompanha o histórico de execuções/feedback de cada aluno.
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
  /alunos/{alunoUid} → { nome, telefone, email, plano, status, diaVencimento }
    /treinos/atual              → { nome, exercicios:[{nome,series,repeticoes,carga,descanso}] }
    /execucoes/{execId}         → { treinoNome, exerciciosFeitos:[...], feedback, nota, data }
    /avaliacoes/{avalId}        → { peso, altura, cintura, quadril, braco, coxa, observacoes, data }
    /evolucao/{evoId}           → { peso, data }
  /pagamentos/{pagamentoId}     → { alunoId, alunoNome, valor, mesReferencia, forma, registradoEm }
  /checkins/{checkinId}         → { alunoId, alunoNome, dataHora }
```

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

- Sem biblioteca de vídeos de exercícios (só texto/observações no exercício)
- Sem gateway de pagamento integrado (Pix/boleto/cartão automático) — os
  pagamentos continuam sendo registrados manualmente pelo professor
- Um único protocolo de avaliação física (peso/altura/IMC/medidas), em vez
  dos 11 protocolos de dobras cutâneas do MFIT
- Um treino "atual" por aluno (não há histórico de várias rotinas paralelas)
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

- Vídeos/links de exercícios na prescrição de treino
- Múltiplos protocolos de avaliação física (dobras cutâneas)
- Cobrança automática (Pix/cartão) integrada
- Fotos de progresso (Firebase Storage)
- Notificações (treino do dia, mensalidade a vencer)
