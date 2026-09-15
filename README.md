# Academia SaaS

MVP de sistema para gestão de academias, com cadastro de alunos, controle de
mensalidades e check-in de frequência. Multi-tenant: cada conta criada em
"Criar conta" vira uma academia isolada (seus dados não aparecem para outras
academias).

## Stack

- HTML/CSS/JS puro (sem build step) + [Firebase](https://firebase.google.com)
  - **Authentication** (e-mail/senha) para login dos administradores
  - **Firestore** para dados (alunos, pagamentos, check-ins)

## Estrutura de dados (Firestore)

```
usuarios/{uid}                → { nome, email, academiaId, role }
academias/{academiaId}        → { nome, donoUid, criadoEm }
  /alunos/{alunoId}           → { nome, telefone, email, plano, status, diaVencimento }
  /pagamentos/{pagamentoId}   → { alunoId, alunoNome, valor, mesReferencia, forma, registradoEm }
  /checkins/{checkinId}       → { alunoId, alunoNome, dataHora }
```

As regras em `firestore.rules` garantem que um usuário só lê/escreve dados da
própria academia (`academias/{academiaId}` onde `academiaId` bate com o
`usuarios/{uid}.academiaId` do usuário logado).

## Rodando localmente

Como não há build step, basta servir os arquivos estáticos, por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules
```

O projeto já está configurado em `.firebaserc` para o Firebase project
`assistente-67362`.

## Próximos passos sugeridos

- Convidar funcionários/professores para uma academia (hoje só o dono tem acesso)
- Alertas automáticos de inadimplência (Cloud Functions)
- Relatórios financeiros mensais
- App mobile ou PWA para check-in
