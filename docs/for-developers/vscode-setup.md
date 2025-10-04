# VS Code Insiders Setup Guide

Guía completa para aprovechar las extensiones y herramientas disponibles en VS Code Insiders para este proyecto.

## 🛠️ Extensiones Instaladas

### AI & Code Assistance (8)

| Extensión                                                              | Uso en este Proyecto                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| **Claude Code** (`anthropic.claude-code`)                              | Asistencia AI principal, generación de código, debugging |
| **GitHub Copilot** (`github.copilot`)                                  | Autocompletado inteligente, sugerencias contextuales     |
| **GitHub Copilot Chat** (`github.copilot-chat`)                        | Chat interactivo para problemas complejos                |
| **Gemini Code Assist** (`google.geminicodeassist`)                     | Alternativa Google AI para coding                        |
| **Gemini CLI** (`google.gemini-cli-vscode-ide-companion`)              | Comandos CLI con AI                                      |
| **Azure GitHub Copilot** (`ms-azuretools.vscode-azure-github-copilot`) | Integración Azure + Copilot                              |

**Recomendación de Uso:**

- **Claude Code:** Para refactorings complejos, arquitectura, documentación
- **GitHub Copilot:** Para autocompletado rápido en desarrollo día a día
- **Gemini:** Para segunda opinión en decisiones técnicas

---

### Git & Version Control (6)

| Extensión                                                      | Uso                                     |
| -------------------------------------------------------------- | --------------------------------------- |
| **GitLens** (`eamodio.gitlens`)                                | Blame, history, comparaciones avanzadas |
| **Git History** (`donjayamanne.githistory`)                    | Visualización histórica de commits      |
| **Git Graph** (`mhutchie.git-graph`)                           | Gráfico interactivo de branches         |
| **GitHub Pull Requests** (`github.vscode-pull-request-github`) | Gestión de PRs desde VS Code            |
| **GitHub Actions** (`github.vscode-github-actions`)            | Ver y ejecutar workflows                |
| **Remote Hub** (`github.remotehub`)                            | Navegar repos remotos sin clonar        |

**Flujo Recomendado:**

1. **Git Graph:** Ver estado global del repo
2. **GitLens:** Investigar quién/cuándo/por qué de cada línea
3. **GitHub PRs:** Crear y revisar PRs sin salir del editor
4. **GitHub Actions:** Monitor de CI/CD en tiempo real

---

### Linting & Formatting (5)

| Extensión                                                   | Configuración                          |
| ----------------------------------------------------------- | -------------------------------------- |
| **ESLint** (`dbaeumer.vscode-eslint`)                       | ✅ Configurado en `eslint.config.mjs`  |
| **Prettier** (`esbenp.prettier-vscode`)                     | ✅ Configurado en `.prettierrc`        |
| **EditorConfig** (`editorconfig.editorconfig`)              | ✅ Configurado en `.editorconfig`      |
| **Markdown Lint** (`davidanson.vscode-markdownlint`)        | ✅ Configurado en `.markdownlint.json` |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | ✅ Para `apps/web`                     |

**Settings recomendadas (`.vscode/settings.json`):**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[markdown]": {
    "editor.defaultFormatter": "davidanson.vscode-markdownlint"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

### Docker & Containers (2)

| Extensión                                                   | Uso                     |
| ----------------------------------------------------------- | ----------------------- |
| **Docker** (`ms-azuretools.vscode-docker`)                  | Gestión de contenedores |
| **Remote - Containers** (`ms-azuretools.vscode-containers`) | Dev containers          |

**Comandos útiles:**

- `Docker: Compose Up` - Levantar `docker-compose.yml`
- `Docker: Logs` - Ver logs de contenedores
- `Docker: Prune System` - Limpiar recursos no usados

---

### Testing & Debugging (3)

| Extensión                                                      | Configuración                |
| -------------------------------------------------------------- | ---------------------------- |
| **Jest Runner** (`firsttris.vscode-jest-runner`)               | Run/debug tests individuales |
| **Edge DevTools** (`ms-edgedevtools.vscode-edge-devtools`)     | Debugging web                |
| **Firefox DevTools** (`firefox-devtools.vscode-firefox-debug`) | Debugging Firefox            |

**Launch config recomendada (`.vscode/launch.json`):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter=@brisa/api", "test"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Next.js",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter=@brisa/web", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

### Azure & Cloud (12)

| Extensión                                                            | Uso en Proyecto                       |
| -------------------------------------------------------------------- | ------------------------------------- |
| **Azure MCP Server** (`ms-azuretools.vscode-azure-mcp-server`)       | **MCP tools para Azure**              |
| **Azure App Service**                                                | Deploy apps                           |
| **Azure Functions**                                                  | Serverless                            |
| **Azure Storage**                                                    | Blob storage (para CleanScore images) |
| **Azure Container Apps**                                             | Container deployment                  |
| **Kubernetes Tools** (`ms-kubernetes-tools.vscode-kubernetes-tools`) | K8s management                        |

**Configuración MCP Azure:**
Ver sección "MCP Tools" más abajo.

---

### Otros Utilitarios (8)

| Extensión                               | Uso                              |
| --------------------------------------- | -------------------------------- |
| **TODO Tree** (`gruntfuggly.todo-tree`) | Ver todos los TODOs/FIXMEs       |
| **Path IntelliSense**                   | Autocompletado de rutas          |
| **npm IntelliSense**                    | Autocompletado de imports        |
| **Auto Rename Tag**                     | HTML/JSX tag renaming            |
| **Language Pack ES**                    | UI en español                    |
| **PHP Tools** (4 extensiones)           | Para scripts PHP si es necesario |
| **Go** (`golang.go`)                    | Si usas Go tooling               |

---

## 🔌 MCP (Model Context Protocol) Tools

### ¿Qué es MCP?

MCP permite a las extensiones AI (como Claude Code) acceder a herramientas y datos externos de forma estructurada.

### MCP Server Instalado

**Azure MCP Server** (`ms-azuretools.vsce-azure-mcp-server`)

Proporciona acceso a recursos Azure:

- Azure subscriptions
- Resource groups
- App Services
- Storage accounts
- Databases
- Functions

### Configurar Azure MCP

1. **Instalar Azure CLI** (si no está):

   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Login en Azure:**

   ```bash
   az login
   az account list --output table
   az account set --subscription <subscription-id>
   ```

3. **Habilitar MCP en VS Code:**
   - Cmd/Ctrl + Shift + P
   - Buscar "MCP: Configure"
   - Seleccionar "Azure MCP Server"

4. **Verificar conexión:**
   - Abrir Claude Code
   - Preguntar: "List my Azure resources"
   - Debería mostrar subscriptions/resource groups

### Otros MCP Servers Disponibles

Puedes instalar MCP servers adicionales:

**Chrome DevTools MCP** (recomendado para testing):

```bash
# Instalar
npx @modelcontextprotocol/create-server chrome-devtools

# Configurar en Claude Code settings
# ~/.claude/config.json
{
  "mcpServers": {
    "chrome": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
    }
  }
}
```

**Filesystem MCP** (lectura/escritura de archivos):

```bash
npx @modelcontextprotocol/create-server filesystem

# Configurar con scope limitado
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/ubuntu-workstation/Escritorio/brisa-cubana-clean-intelligence"
      ]
    }
  }
}
```

**GitHub MCP** (gestión de repos, PRs, issues):

```bash
npx @modelcontextprotocol/create-server github

# Requiere GitHub token
export GITHUB_TOKEN=ghp_...
```

---

## 🎨 Workspace Recommendations

Crear `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "anthropic.claude-code",
    "github.copilot",
    "github.copilot-chat",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "eamodio.gitlens",
    "ms-azuretools.vscode-docker",
    "firsttris.vscode-jest-runner",
    "bradlc.vscode-tailwindcss",
    "davidanson.vscode-markdownlint",
    "gruntfuggly.todo-tree",
    "mhutchie.git-graph"
  ]
}
```

---

## ⚙️ Tasks Configuration

Crear `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev: Start All",
      "type": "shell",
      "command": "pnpm dev",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Test: Run All",
      "type": "shell",
      "command": "pnpm test",
      "problemMatcher": []
    },
    {
      "label": "Lint: Check All",
      "type": "shell",
      "command": "pnpm lint",
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "Docs: Serve",
      "type": "shell",
      "command": "make serve",
      "problemMatcher": []
    },
    {
      "label": "Docker: Compose Up",
      "type": "shell",
      "command": "docker compose up -d",
      "problemMatcher": []
    },
    {
      "label": "DB: Reset",
      "type": "shell",
      "command": "pnpm db:reset",
      "problemMatcher": []
    }
  ]
}
```

**Uso:**

- `Cmd/Ctrl + Shift + B` → Ejecuta tarea por defecto (Dev: Start All)
- `Cmd/Ctrl + Shift + P` → "Tasks: Run Task" → Seleccionar

---

## 🔍 Snippets Útiles

Crear `.vscode/snippets.code-snippets`:

```json
{
  "Hono Route": {
    "prefix": "hono-route",
    "body": [
      "import { Hono } from 'hono'",
      "import { requireAuth } from '../middleware/auth'",
      "",
      "const ${1:route} = new Hono()",
      "",
      "${1:route}.get('/', requireAuth(), async (c) => {",
      "  ${2:// Implementation}",
      "  return c.json({ ok: true })",
      "})",
      "",
      "export default ${1:route}"
    ]
  },
  "React Server Component": {
    "prefix": "rsc",
    "body": [
      "interface ${1:Component}Props {",
      "  ${2:prop}: ${3:string}",
      "}",
      "",
      "export default async function ${1:Component}({ ${2:prop} }: ${1:Component}Props) {",
      "  ${4:// Fetch data server-side}",
      "  ",
      "  return (",
      "    <div>",
      "      ${5:// JSX}",
      "    </div>",
      "  )",
      "}"
    ]
  },
  "Vitest Test": {
    "prefix": "vitest-test",
    "body": [
      "import { describe, it, expect, vi } from 'vitest'",
      "",
      "describe('${1:TestSuite}', () => {",
      "  it('should ${2:description}', async () => {",
      "    ${3:// Arrange}",
      "    ",
      "    ${4:// Act}",
      "    ",
      "    ${5:// Assert}",
      "    expect(${6:actual}).toBe(${7:expected})",
      "  })",
      "})"
    ]
  }
}
```

---

## 🚀 Keybindings Personalizados

Crear `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "Test: Run All"
  },
  {
    "key": "ctrl+shift+d",
    "command": "workbench.action.tasks.runTask",
    "args": "Dev: Start All"
  },
  {
    "key": "ctrl+shift+l",
    "command": "workbench.action.tasks.runTask",
    "args": "Lint: Check All"
  },
  {
    "key": "ctrl+shift+g h",
    "command": "gitlens.showQuickFileHistory"
  }
]
```

---

## 📊 Workspace Settings Completo

Crear/actualizar `.vscode/settings.json`:

```json
{
  // Editor
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.rulers": [80, 120],
  "editor.wordWrap": "on",
  "editor.bracketPairColorization.enabled": true,

  // Files
  "files.associations": {
    "*.css": "tailwindcss",
    ".env.*": "dotenv",
    "Dockerfile.*": "dockerfile"
  },
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.turbo": true
  },

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",

  // Tailwind
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },

  // ESLint
  "eslint.workingDirectories": ["./apps/web", "./apps/api", "./packages/ui"],

  // Markdown
  "[markdown]": {
    "editor.defaultFormatter": "davidanson.vscode-markdownlint",
    "editor.wordWrap": "on"
  },

  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,

  // GitLens
  "gitlens.codeLens.enabled": true,
  "gitlens.currentLine.enabled": true,

  // Docker
  "docker.showStartPage": false,

  // TODO Tree
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "HACK",
    "NOTE",
    "BUG",
    "[ ]",
    "[x]"
  ],
  "todo-tree.highlights.defaultHighlight": {
    "icon": "alert",
    "type": "text"
  },

  // Terminal
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.fontSize": 13
}
```

---

## 🎯 Flujo de Trabajo Recomendado

### 1. Inicio del Día

```bash
# Terminal en VS Code (Ctrl + `)
git pull origin main
pnpm install  # Si hay cambios en package.json
docker compose up -d
pnpm dev  # O usar Task: "Dev: Start All"
```

### 2. Durante Desarrollo

- **Cambio de Branch:** Git Graph (visualizar) → Checkout
- **Crear Feature:** `git checkout -b feature/nombre`
- **Ver Historia:** GitLens inline blame + Git Graph
- **Testing:** Jest Runner (run/debug individual tests)
- **Linting:** Auto-fix on save + `pnpm lint` antes de commit

### 3. Antes de Commit

```bash
# O usar Tasks
pnpm lint
pnpm typecheck
pnpm test
```

### 4. Crear PR

- Usar extensión **GitHub Pull Requests**
- Cmd/Ctrl + Shift + P → "GitHub Pull Requests: Create"
- Auto-completará description desde commits
- Asignar reviewers directamente

### 5. Code Review

- Extensión **GitHub Pull Requests** → Ver PRs
- Comentar inline en VS Code
- Aprobar/Request Changes sin salir del editor

---

## 🤖 Claude Code Best Practices

### Comandos Útiles

```
/edit <file>         # Editar archivo específico
/ask                 # Hacer pregunta sin cambios
/fix                 # Fix error mostrado
/test                # Generar tests para código seleccionado
/doc                 # Generar documentación
/explain             # Explicar código seleccionado
/review              # Review de código
```

### Contexto para Claude

**Siempre incluir:**

- Archivo relevante (menciónalo)
- Error completo (si aplica)
- Lo que intentaste (debugging context)

**Ejemplo:**

```
En apps/api/src/routes/bookings.ts línea 45,
estoy obteniendo el error "Cannot read property 'id' of undefined".

He verificado que:
- El middleware requireAuth() está correcto
- El userId existe en el token JWT
- La ruta tiene permisos correctos

¿Puedes revisar la lógica de autorización?
```

---

## 🔧 Troubleshooting

### ESLint no funciona

```bash
# Cmd/Ctrl + Shift + P
> ESLint: Restart ESLint Server
```

### TypeScript IntelliSense lento

```bash
# Cmd/Ctrl + Shift + P
> TypeScript: Reload Project
> TypeScript: Restart TS Server
```

### Prettier no formatea

```bash
# Verificar .prettierignore
# Reinstalar: pnpm add -D -w prettier
# Cmd/Ctrl + Shift + P
> Format Document
```

### Docker compose no aparece

```bash
# Reinstalar extensión Docker
# Verificar que docker daemon está corriendo:
docker ps
```

---

## 📚 Referencias

- [VS Code Docs](https://code.visualstudio.com/docs)
- [Claude Code Extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [GitLens Docs](https://gitlens.amod.io/)
- [MCP Specification](https://modelcontextprotocol.io/)

---

**Última actualización:** 2025-10-04
