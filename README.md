# Academia SaaS

SaaS de gestão de academias com 3 papéis de acesso — **academia (admin)**,
**professor** e **aluno** — inspirado nas funcionalidades do MFIT Personal
(prescrição de treino, avaliação física, execução com feedback obrigatório,
evolução) adaptadas para um produto multi-tenant com gestão de múltiplos
professores por academia.

## Papéis

- **Academia (admin)**: cadastra professores e alunos, vincula aluno↔professor,
  controla mensalidades e check-in geral.
- **Professor**: vê apenas os alunos vinculados a ele, prescreve treino
  (exercícios com séries/repetições/carga/descanso), registra avaliação física
  (peso, altura, IMC, medidas) e acompanha o histórico de execuções/feedback.
- **Aluno**: vê o treino atual, executa e **precisa dar feedback para concluir**
  (mesma lógica do MFIT: se tem feedback, o treino foi feito), acompanha
  histórico, gráfico de evolução de peso e faz seu próprio check-in.

Todos os papéis fazem login pela mesma tela (`index.html`); só quem cria uma
academia (aba "Criar conta") é o admin — professores e alunos recebem o
acesso (e-mail + senha) diretamente do admin/professor, sem autocadastro.

## Stack

- HTML/CSS/JS puro (sem build step) + [Firebase](https://firebase.google.com)
  - **Authentication** (e-mail/senha)
  - **Firestore** para dados

## Estrutura de dados (Firestore)

```
usuarios/{uid} → { nome, email, academiaId, role: 'admin'|'professor'|'aluno' }

academias/{academiaId} → { nome, donoUid, criadoEm }   // {academiaId} == uid do admin dono
  /professores/{profUid}        → { nome, email, ativo, criadoEm }
  /pagamentos/{pagamentoId}     → { alunoId, alunoNome, valor, mesReferencia, forma, registradoEm }
  /checkins/{checkinId}         → { alunoId, alunoNome, dataHora }
  /alunos/{alunoUid}            → { nome, telefone, email, plano, status, diaVencimento, professorId }
    /treinos/atual              → { nome, professorId, exercicios:[{nome,series,repeticoes,carga,descanso}] }
    /execucoes/{execId}         → { treinoNome, exerciciosFeitos:[...], feedback, nota, data }
    /avaliacoes/{avalId}        → { peso, altura, cintura, quadril, braco, coxa, observacoes, data }
    /evolucao/{evoId}           → { peso, data }
```

`alunos/{alunoUid}` e `professores/{profUid}` são criados com o **próprio uid
da conta Firebase Auth da pessoa** (não um ID aleatório) — isso é o que
permite as regras de segurança restringirem cada aluno/professor aos seus
próprios dados sem precisar de lógica extra no servidor.

As regras (`firestore.rules`) implementam esse controle por papel: admin tem
acesso total à sua academia; professor só lê/edita alunos e treinos da sua
academia; aluno só lê/edita os próprios dados (treino, execuções, evolução).

### Truque de criação de conta sem deslogar

Como o SDK do Firebase Auth no navegador só mantém uma sessão ativa por vez,
criar a conta de um professor/aluno teria o efeito colateral de deslogar quem
está criando. Para evitar isso, `js/create-user.js` cria um **app Firebase
secundário temporário** (`initializeApp(config, "secundario-...")`), registra
a nova conta nele, e descarta o app — sem afetar a sessão do admin/professor
que fez a ação. É a abordagem padrão da comunidade para esse cenário sem
precisar de Cloud Functions/Admin SDK.

## Simplificações conscientes em relação ao MFIT

- Sem biblioteca de vídeos de exercícios (só texto/observações no exercício)
- Sem gateway de pagamento integrado (Pix/boleto/cartão automático) — os
  pagamentos continuam sendo registrados manualmente pelo admin
- Um único protocolo de avaliação física (peso/altura/IMC/medidas), em vez
  dos 11 protocolos de dobras cutâneas do MFIT
- Um treino "atual" por aluno (não há histórico de várias rotinas paralelas)
- Excluir um aluno/professor remove o registro no Firestore, mas não a conta
  no Firebase Authentication (precisaria do Admin SDK/Cloud Functions)

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
