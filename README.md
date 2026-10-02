# 🍽️ DEVORA — Guia Gastronômico

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

Maria Eduarda Rodrigues Ferreira - M32