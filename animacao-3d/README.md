# Animação 3D Interativa com Angular e Three.js

Este projeto é uma aplicação Angular que demonstra uma animação 3D interativa usando Three.js, onde o usuário pode interagir com os objetos na tela usando o cursor do mouse.

## Características

- Formas 3D animadas que reagem ao movimento do mouse
- Cursor personalizado que muda de forma ao interagir com os objetos
- Efeito de expansão nos objetos ao passar o mouse sobre eles
- Animações fluidas e responsivas
- Interface limpa e imersiva

## Requisitos

- Node.js (v14 ou superior)
- Angular CLI (v16 ou superior)
- Navegador moderno com suporte a WebGL

## Instalação

1. Clone o repositório ou baixe os arquivos
2. Navegue até a pasta do projeto
3. Execute `npm install` para instalar as dependências
4. Execute `ng serve` para iniciar o servidor de desenvolvimento
5. Acesse `http://localhost:4200/` no seu navegador

## Tecnologias Utilizadas

- Angular 16+
- Three.js
- TypeScript
- SCSS

## Como funciona

A aplicação utiliza Three.js para criar várias formas geométricas 3D dispostas em um padrão circular. Quando o cursor do mouse se move pela tela, os objetos reagem com efeitos de escala, rotação e deslocamento.

O cursor do mouse padrão é substituído por um cursor personalizado que muda de tamanho e cor ao interagir com os objetos ou ao clicar na tela.

## Personalização

Você pode personalizar a animação 3D modificando os seguintes arquivos:

- `src/app/scene3d/scene3d.component.ts`: Contém a lógica da animação 3D e interação com o mouse
- `src/app/scene3d/scene3d.component.scss`: Estilos para o contêiner da cena e o cursor personalizado
- `src/styles.scss`: Estilos globais da aplicação

## Licença

Este projeto está licenciado sob a Licença MIT.
