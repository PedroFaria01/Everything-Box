# Caixa de Tudo

Central de ferramentas desktop para Windows. Hoje inclui um **Auto Clicker** completo; a arquitetura já está preparada para receber novas ferramentas (gerador de texto, conversor de arquivos, ferramentas de imagem, gravador de macros, temporizador, gerenciador de snippets) sem precisar reestruturar o projeto.

## Tecnologias utilizadas

| Camada | Tecnologia | Versão |
|---|---|---|
| App shell | Electron | ^31.7.5 |
| Bundler Electron+Vite | electron-vite | ^2.3.0 |
| UI | React + TypeScript | React 18 / TS 5 |
| Componentes | HeroUI (`@heroui/react`) | ^2.6.11 |
| Estilo | Tailwind CSS | ^3.4.15 |
| Estado global | Zustand | ^5.0.1 |
| Persistência | electron-store | 8.2.0 (fixado em versão CJS) |
| Automação de mouse | `@nut-tree-fork/nut-js` | ^4.2.6 |
| Empacotamento | electron-builder | ^24.13.3 |

### Por que `@nut-tree-fork/nut-js` e não `robotjs`?

`robotjs` está sem manutenção há anos e quebra com versões recentes de Node/Electron (módulo nativo desatualizado). O projeto original `nut-tree/nut.js` reduziu o ritmo de releases; `@nut-tree-fork` é a continuação mantida pela comunidade, publica binários nativos pré-compilados para Windows/Linux/macOS (pacotes `@nut-tree-fork/libnut-win32`, `-linux`, `-darwin`) e é compatível com o Node usado pelo Electron 31 sem precisar recompilar nada manualmente.

### Por que `electron-store@8.2.0` e não a versão mais recente?

A partir da v9, `electron-store` passou a ser um pacote **ESM-only**. Isso obrigaria todo o processo `main` do Electron a rodar como ES Module, complicando a integração com `electron-vite` e o restante do projeto (que usa CommonJS no `main`). A v8.2.0 é a última versão totalmente compatível com CommonJS e cobre 100% do que este projeto precisa (get/set com defaults).

## Requisitos

- Windows 10/11 (para rodar o app e gerar o instalador oficial) ou Linux/macOS para desenvolvimento
- Node.js 20 ou superior
- npm 10+

## Como instalar as dependências

```bash
npm install
```

O `postinstall` roda automaticamente `electron-builder install-app-deps`, que garante que o módulo nativo do `nut-js` seja recompilado/vinculado corretamente para a versão do Electron usada.

## Como executar em desenvolvimento

```bash
npm run dev
```

Isso abre a janela do Electron com hot-reload do React via Vite.

## Como gerar o executável

```bash
npm run build       # gera apenas os bundles (main/preload/renderer) em ./out
npm run build:win   # gera o instalador e a versão portátil do Windows
```

`npm run build:win` primeiro roda o build acima e depois o `electron-builder --win`.

### Onde encontrar o instalador

Após `npm run build:win`, os arquivos aparecem em `./release`:

- `Caixa de Tudo Setup 1.0.0.exe` — instalador NSIS (permite escolher pasta de instalação, cria atalhos no Menu Iniciar e na Área de Trabalho).
- `Caixa de Tudo 1.0.0.exe` — versão portátil, não precisa instalar.

### Gerando o build Windows a partir de Linux/macOS

O `electron-builder` consegue empacotar para Windows a partir de Linux, mas depende do **Wine** para assinar/editar recursos do `.exe` (ex.: ícone, versão). Se aparecer o erro `wine is required`, instale:

```bash
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install wine wine32:i386
```

Isso já foi testado neste projeto: o build Windows completo (instalador + portátil) foi gerado com sucesso em um ambiente Linux com Wine instalado.

## Estrutura das pastas

```
src/
  main/                    # Processo principal do Electron
    index.ts               # Ciclo de vida da janela, tray, before-quit
    auto-clicker/          # Motor de cliques (nut-js) + validações
    shortcuts/             # Registro/validação de atalhos globais (globalShortcut)
    store/                 # Persistência local (electron-store)
    ipc/                   # Handlers dos canais IPC
    tray/                  # Ícone e menu da bandeja do sistema
  preload/
    index.ts               # contextBridge -> window.desktopAPI
    index.d.ts              # Tipagem global do window.desktopAPI
  renderer/
    index.html
    src/
      components/          # Header, Sidebar, StatusIndicator (genéricos)
      layouts/             # MainLayout
      pages/               # Dashboard, Settings
      tools/
        auto-clicker/      # AutoClickerPage, AutoClickerCard, ShortcutCapture
      hooks/                # useAutoClicker (liga UI <-> IPC <-> store)
      store/                # Estado global (zustand)
      services/             # Wrapper fino sobre window.desktopAPI
      types/                # Tipos compartilhados entre main/preload/renderer
resources/
  icon.png / icon.ico       # Ícone provisório (placeholder), substitua antes de publicar
```

## Como adicionar uma nova ferramenta

A navegação e a arquitetura já estão preparadas. Para adicionar, por exemplo, um "Temporizador":

1. Crie a pasta `src/renderer/src/tools/temporizador/` com seus componentes (`TemporizadorPage.tsx`, etc.), seguindo o padrão de `tools/auto-clicker`.
2. Se a ferramenta precisar de lógica no processo principal (ex.: acessar o sistema operacional), crie `src/main/temporizador/index.ts` e registre os handlers correspondentes em `src/main/ipc/index.ts`.
3. Exponha as novas funções no preload (`src/preload/index.ts`) dentro do objeto `desktopAPI`, com os tipos atualizados.
4. Adicione o item na lista `NAV_ITEMS` de `src/renderer/src/components/Sidebar.tsx` (e remova da lista `FUTURE_TOOLS`).
5. Registre a nova página em `App.tsx` (`{page === 'temporizador' && <TemporizadorPage />}`).
6. Se precisar persistir configurações, estenda `AppSettings` em `src/renderer/src/types/index.ts` e ajuste os defaults.

Nenhuma outra parte do projeto precisa mudar — o IPC, o tray e o ciclo de vida da janela já são genéricos.

## Como funciona o IPC

- O **renderer** nunca acessa Node.js ou Electron diretamente (`contextIsolation: true`, `nodeIntegration: false`).
- O **preload** expõe apenas um conjunto fixo de funções via `contextBridge.exposeInMainWorld('desktopAPI', {...})`. Cada função chama `ipcRenderer.invoke(canal, payload)` e retorna uma Promise.
- O **main** registra os handlers com `ipcMain.handle(canal, ...)` em `src/main/ipc/index.ts`, valida os dados recebidos (intervalos, coordenadas, atalhos) e retorna `{ ok: true, ... }` ou `{ ok: false, error: { code, message } }`.
- Eventos que o main precisa empurrar para o renderer (status do Auto Clicker mudando, pedido de decisão ao fechar a janela) usam `webContents.send(canal, payload)` do lado do main e `ipcRenderer.on(canal, listener)` no preload, expostos como `on...` no `desktopAPI` (que devolvem uma função de "unsubscribe").

## Como funciona o atalho global

- Usa o módulo nativo `globalShortcut` do próprio Electron — não precisa de nenhuma biblioteca externa e funciona mesmo com a janela minimizada ou sem foco.
- Antes de registrar um novo atalho, o atalho anterior é sempre removido (`globalShortcut.unregister`) para nunca deixar atalhos "fantasmas" ativos.
- Se `globalShortcut.register()` retornar `false` (porque outro programa já usa aquela combinação), o main lança `ShortcutUnavailableError` e o renderer mostra um toast amigável, sem aplicar a mudança.
- O atalho escolhido é salvo via `electron-store` e re-registrado automaticamente na inicialização do app.
- Ao fechar o app (`before-quit`), todos os atalhos são removidos com `globalShortcut.unregisterAll()`.

## Possíveis problemas com bibliotecas nativas

- `@nut-tree-fork/nut-js` depende de módulos nativos (`.node`) específicos por plataforma. Os pacotes `@nut-tree-fork/libnut-win32/-linux/-darwin` já vêm com binários pré-compilados, então normalmente **não é necessário compilar nada manualmente**.
- Em alguns antivírus/EDRs corporativos, bibliotecas de automação de mouse podem ser sinalizadas por heurística (comportamento semelhante a "controle remoto"). Isso é esperado para qualquer Auto Clicker real e não é um bug do projeto.
- Se o `postinstall` (`electron-builder install-app-deps`) falhar por falta de toolchain de compilação (Python/`build-essential` no Linux, "Desktop development with C++" no Windows), isso normalmente não afeta o `nut-js` (que usa binário pronto), mas pode afetar outras dependências nativas transitivas — instale as ferramentas de build da sua plataforma se isso ocorrer.

## Instruções específicas para Windows

- O instalador NSIS gerado permite escolher a pasta de instalação e cria atalhos no Menu Iniciar e na Área de Trabalho.
- A versão portátil (`Caixa de Tudo 1.0.0.exe`) não precisa de instalação, mas grava as configurações em `%APPDATA%/caixa-de-tudo-settings.json` (via `electron-store`), então elas persistem entre execuções mesmo no modo portátil.
- No primeiro clique em "Fechar" (X), o app pergunta se você quer minimizar para a bandeja ou fechar de fato; marque "lembrar minha escolha" para não ver essa pergunta novamente (pode ser alterado depois em Configurações).
- O ícone atual (`resources/icon.png` / `resources/icon.ico`) é um **placeholder gerado programaticamente** — substitua por um ícone definitivo antes de distribuir o app publicamente.

## Limites de segurança do Auto Clicker

Para evitar consumo excessivo de CPU ou cliques descontrolados:

- Intervalo mínimo: 20 ms (equivalente a 50 cliques/segundo).
- Intervalo máximo: 60.000 ms (1 clique por minuto).
- Quantidade de cliques (modo "Quantidade"): entre 1 e 1.000.000.
- Atraso inicial: até 1 hora (3.600.000 ms).

Esses limites são aplicados tanto na interface quanto no processo principal (defesa em profundidade).
