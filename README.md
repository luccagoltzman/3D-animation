# Shader Reminder

App de lembretes com visual em **shaders** (canvas WebGL). Você escolhe um efeito visual, adiciona lembretes com data e hora e recebe notificações quando estiverem próximos.

## Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build e dev server)
- **Tailwind CSS** (estilos)
- **Radix UI** (componentes acessíveis)
- **Framer Motion** (animações)
- **Sonner** (toasts de notificação)

## Como rodar

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Desenvolvimento (abre em http://localhost:3000)
npm run dev
```

Ou use `npm start` — faz o mesmo que `npm run dev`.

## Build para produção

```bash
npm run build
```

A saída fica na pasta `build/`. Sirva com qualquer servidor estático.

## O que o app faz

- **Canvas com shaders** — clique no círculo central para abrir o painel de novo lembrete.
- **Trocar shader** — use o seletor no canto para mudar o efeito visual (preferência salva no `localStorage`).
- **Lembretes** — texto + data e hora; notificações (toasts) quando um lembrete está próximo (ex.: dentro de 5 minutos).
- **Gerenciar lembretes** — adicionar, marcar como concluído e limpar; dados persistidos no `localStorage`.

## Estrutura do projeto

- `src/App.tsx` — componente principal e estado global (shader, lembretes, sheet).
- `src/components/` — ShaderCanvas, ShaderSelector, SheetReminderInput, ReminderManager, CenterReminderDisplay, SonnerToastProvider e componentes de UI (Radix).
- `src/components/util/` — shaders e sons.
- `src/styles/` — CSS global, ajustes de Sonner e inputs.
