SIIIM 😭❤️ Vou deixar com cara de projeto de verdade, bonitinho e sem ficar exageradamente formal. É só **copiar tudo e colar no `README.md`**.

````markdown
# 🍽️ DEVORA — Guia Gastronômico

<p align="center">
  <strong>Um guia gastronômico simples e funcional para explorar pratos e categorias.</strong>
</p>

---

## 📖 Sobre o projeto

O **DEVORA** é uma aplicação web desenvolvida para a disciplina de **Desenvolvimento Web 1 (DW1)**.

A ideia do projeto é criar um **guia gastronômico**, onde é possível organizar e consultar informações sobre diferentes pratos, categorias, medidas e usuários.

O sistema foi desenvolvido utilizando **JavaScript, Node.js, Express, PostgreSQL, HTML5 e CSS**, seguindo a arquitetura **Cliente/Servidor** e o padrão **MVC (Model-View-Controller)**.

---

## 🎯 Objetivo

O principal objetivo do projeto é colocar em prática os conteúdos estudados durante a disciplina, desenvolvendo uma aplicação web conectada a um banco de dados.

Entre os conceitos utilizados estão:

- Arquitetura Cliente/Servidor;
- Padrão MVC;
- Operações CRUD;
- Criação e utilização de rotas;
- Controllers;
- Banco de dados PostgreSQL;
- JavaScript no frontend e backend;
- HTML5 semântico;
- CSS;
- Git e GitHub.

---

## 🍕 Sobre o DEVORA

O DEVORA foi pensado como um guia gastronômico para organizar diferentes tipos de pratos.

Entre os pratos cadastrados no sistema estão:

- 🍕 Pizza Margherita
- 🍕 Pizza Calabresa
- 🍝 Lasanha Bolonhesa
- 🍝 Fettuccine Alfredo
- 🍝 Nhoque ao Molho
- 🍔 Hambúrguer Artesanal
- 🍟 Batata Frita
- 🥟 Coxinha de Frango
- 🥟 Pastel de Queijo
- 🥘 Escondidinho de Carne
- 🍚 Risoto de Frango

### 🏷️ Categorias

Os pratos são organizados em diferentes categorias gastronômicas:

- Pizzas
- Massas
- Hambúrgueres
- Porções
- Salgados
- Lanches
- Carnes
- Acompanhamentos
- Pratos Executivos
- Risotos
- Sobremesas
- Bebidas

---

## 💻 Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização da aplicação |
| JavaScript | Funcionalidades do sistema |
| Node.js | Backend |
| Express | Servidor e rotas |
| PostgreSQL | Banco de dados |
| Git | Versionamento |
| GitHub | Repositório do projeto |

---

## 🏗️ Arquitetura do projeto

O projeto utiliza a arquitetura **Cliente/Servidor**.

### 🎨 Frontend

O frontend é responsável pela interface que o usuário utiliza para acessar e visualizar as informações do sistema.

Foi desenvolvido utilizando:

- HTML5;
- CSS;
- JavaScript.

### ⚙️ Backend

O backend é responsável pelo processamento das requisições e pela comunicação com o banco de dados.

Foi desenvolvido utilizando:

- Node.js;
- Express;
- PostgreSQL.

### 🧩 MVC

O projeto também utiliza o padrão **MVC (Model-View-Controller)**, organizando as responsabilidades da aplicação.

- **Routes:** responsáveis pelas rotas;
- **Controllers:** responsáveis pela lógica das operações;
- **Database:** responsável pela conexão com o PostgreSQL;
- **Views:** responsáveis pelas páginas apresentadas ao usuário.

---

## 📂 Estrutura do projeto

```text
guia_gastronomico/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── database.js
│   └── server.js
│
├── frontend/
│   ├── categoria/
│   ├── medida/
│   ├── menu/
│   ├── pratos/
│   └── usuário/
│
├── imagens/
│
├── index.html
├── guia_gastronomico.sql
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
````

---

## 🗄️ Banco de dados

O projeto utiliza o **PostgreSQL** com o banco:

```text
guia_gastronomico
```

O banco possui tabelas utilizadas para armazenar e relacionar os dados da aplicação, como:

* `usuario`
* `categoria`
* `medida`
* `prato`
* `cliente`
* `funcionario`
* `pedido`
* `pagamento`
* `forma_pagamento`

As tabelas possuem **chaves primárias e estrangeiras**, permitindo o relacionamento entre diferentes informações do sistema.

---

## 🔄 CRUD

O projeto utiliza operações **CRUD** para o gerenciamento dos dados.

| Operação | Significado     |
| -------- | --------------- |
| CREATE   | Cadastrar dados |
| READ     | Consultar dados |
| UPDATE   | Alterar dados   |
| DELETE   | Excluir dados   |

Essas operações são realizadas através das rotas do backend e conectadas ao banco de dados PostgreSQL.

---

## 🖼️ Imagens

O projeto possui uma pasta específica para armazenar as imagens utilizadas na aplicação:

```text
imagens/
```

As imagens podem ser associadas aos pratos cadastrados no guia gastronômico.

---

## 🚀 Como executar o projeto

### 1. Instalar as dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

### 2. Configurar o PostgreSQL

Crie um banco de dados chamado:

```text
guia_gastronomico
```

Depois, execute o arquivo:

```text
guia_gastronomico.sql
```

para criar as tabelas e inserir os dados iniciais.

### 3. Configurar o `.env`

Na pasta `backend`, crie um arquivo `.env` com suas configurações do PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUA_SENHA
DB_NAME=guia_gastronomico
PORT=3000
```

> ⚠️ O arquivo `.env` não deve ser enviado para o GitHub.

### 4. Iniciar o servidor

Execute:

```bash
node backend/server.js
```

O sistema estará disponível em:

```text
http://localhost:3000
```

---

## 🔐 Segurança

Para evitar o envio de informações sensíveis ao GitHub, o projeto utiliza um arquivo `.gitignore`.

Entre os arquivos ignorados estão:

```text
node_modules/
.env
```

Dessa forma, informações como a senha utilizada para conexão com o banco de dados não ficam disponíveis no repositório.

---

## 👩‍💻 Desenvolvimento

Este projeto foi **desenvolvido por Maria Eduarda Rodrigues Ferreira**, como atividade acadêmica da disciplina de **Desenvolvimento Web 1 (DW1)**.

Durante o desenvolvimento foram aplicados conhecimentos de desenvolvimento frontend, backend, banco de dados, arquitetura Cliente/Servidor, padrão MVC e versionamento com Git e GitHub.

---

## 📚 Projeto acadêmico

**Projeto:** DEVORA — Guia Gastronômico
**Disciplina:** Desenvolvimento Web 1 — DW1
**Ano:** 2026
**Desenvolvido por:** **Maria Eduarda Rodrigues Ferreira**

---

DEVORA — Explore, escolha e devore!
