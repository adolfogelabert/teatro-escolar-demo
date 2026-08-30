# 📏 Guardarraíles del Proyecto · Teatro Escolar 2026

> **Documento de parámetros que el agente opencode debe respetar para mantener la consistencia del proyecto** Teatro Escolar — Temporada 2026.
>
> Este archivo es de solo lectura para el usuario. Cualquier cambio aquí debe ser coordinado con él antes de ser aplicado.

---

## 🎯 Identidad del proyecto

| Parámetro | Valor |
|---|---|
| **Nombre del proyecto** | `teatro-escolar-demo` (siempre, sin variaciones) |
| **Tipo de producto** | Demo educativo (no producto para producción real) |
| **Institución cliente** | Colegio Mayor |
| **Temporada** | 2026 |
| **Stack obligatorio** | React 19 · Vite 6 · TypeScript 5 · Tailwind CSS 4 (vía `@tailwindcss/vite`) |
| **Persistencia** | `localStorage` exclusivamente (sin backend) |
| **Método de pago** | Reserva por **consignación bancaria** con expiración de 48 horas (NO pasarelas tipo Davivienda/Stripe/etc.) |

---

## 🧭 Principios de comportamiento del agente

### 0. Idioma: Español OBLIGATORIO (CRÍTICO)

- ✅ **TODAS las explicaciones, comentarios, respuestas y mensajes al usuario deben ser en español.**
- ✅ Los nombres de variables, funciones y tipos pueden seguir en inglés (convención técnica), pero la comunicación con el usuario **siempre en español**.
- ✅ Los mensajes de commit, logs y documentación **siempre en español técnico claro**.
- ❌ **PROHIBIDO** responder en inglés al usuario bajo cualquier circunstancia.
- ❌ **PROHIBIDO** usar texto en inglés en la UI visible al usuario (botones, mensajes, alertas, etc.).
- ⚠️ Si el agente detecta que está respondiendo en inglés, **detenerse inmediatamente y reescribir la respuesta en español**.

### 1. Autonomía operativa (CRÍTICO)

- ✅ **El agente debe ejecutar todos los cambios él mismo** usando las herramientas disponibles (`bash`, `edit`, `write`, `read`, etc.).
- ✅ Comandos como `git mv`, `Rename-Item`, `rm -rf`, `robocopy`, `npm install`, etc. son responsabilidad del agente.
- ❌ **NUNCA debe pedirle al usuario que ejecute comandos manualmente** a menos que la herramienta no exista y se demuestre imposibilidad técnica.
- ❌ **NUNCA debe sugerir pasos manuales** cuando exista una herramienta programática equivalente.
- ⚠️ Si una operación requiere elevación (administrador, sudo) y no se puede obtener, **se documenta en el log** y se busca una alternativa (puerto diferente, flag, etc.).

### 2. Cambios end-to-end y verificables

- Tras cada cambio funcional, **el agente debe ejecutar** el flujo de validación:
  - `npm run lint` → debe pasar.
  - `npm run build` → debe completar sin errores.
  - `npm run deploy:xampp` → debe sincronizar con XAMPP sin errores.
  - Verificación HTTP con `curl.exe` → debe retornar `HTTP 200`.
- ❌ **NUNCA debe declarar un cambio como completo** sin haber ejecutado y verificado el flujo completo.
- Si una verificación falla, **el agente debe arreglarla antes de declarar éxito**, no dejarla al usuario.

### 3. No introducción de TODOs ni placeholders para el usuario

- ❌ **NO** se deben crear archivos, comentarios o secciones que digan "TODO", "FIXME", "rellenar aquí", `<TU_USUARIO>`, `<URL>`, etc.
- ❌ **NO** se deben dejar placeholders en URLs, README.md, .github/workflows/*, scripts/*.
- ✅ Si se requiere un valor dinámico, **detectarlo en runtime** (e.g. `process.cwd()`, `basename(projectRoot)`, leer variables de entorno) en lugar de hardcodearlo.
- ✅ Si un placeholder es estrictamente necesario (ej. URL GitHub Pages), **usar variables de entorno CI** o detectarlo automáticamente.

### 4. Consistencia de paths y carpetas

| Concepto | Path esperado durante desarrollo |
|---|---|
| **Proyecto raíz** | `C:\xampp\htdocs\teatro-escolar-demo\` |
| **XAMPP htdocs** | `C:\xampp\htdocs\` |
| **XAMPP apache** | `C:\xampp\apache\` |
| **Apache binary** | `C:\xampp\apache\bin\httpd.exe` |
| **curl binary** | `C:\xampp\apache\bin\curl.exe` |
| **Node ejecutable** | `node` (PATH) · `npm` (PATH) |
| **URL local XAMPP** | `http://localhost/teatro-escolar-demo/` |
| **URL GitHub Pages** | `https://<owner>.github.io/teatro-escolar-demo/` (resuelto por CI) |

- ✅ Scripts deben **detectar automáticamente** su ubicación (`fileURLToPath(import.meta.url)`).
- ✅ **Nunca hardcodear** paths absolutos en scripts `*.mjs`.
- ❌ No usar `..\..\` salvo cuando sea estrictamente necesario.

### 5. Manejo del sistema de archivos en Windows

- En Windows, `Rename-Item` puede fallar por handles abiertos (Apache, GitHub Desktop, IDEs).
- Antes de operaciones destructivas (renombrar, eliminar), **intentar varias veces** con esperas intermedias.
- Si el handle persiste, **usar `robocopy` con `/MOVE`** como fallback: copia + elimina origen en un solo paso.
- Para `node_modules`: preferible **regenerar con `npm install`** en lugar de copiar (mucho más rápido).
- Si una operación no se puede completar y la operación no es bloqueante, **registrar el motivo y continuar**.

### 6. Manejo del servicio Apache

- Apache se puede iniciar con:
  ```powershell
  Start-Process -FilePath "C:\xampp\apache\bin\httpd.exe" -WindowStyle Hidden `
    -RedirectStandardOutput "C:\Users\adolf\AppData\Local\Temp\apache_out.log" `
    -RedirectStandardError "C:\Users\adolf\AppData\Local\Temp\apache_err.log"
  ```
- Verificar estado con `Get-Process -Name httpd`.
- Probar con `& "C:\xampp\apache\bin\curl.exe" -s -o nul -w "%{http_code}" http://localhost/teatro-escolar-demo/`.

### 7. Reglas del sistema de reserva

- **Duración del bloqueo**: 48 horas por defecto. En modo demo: 45 segundos (configurable en `ReservationModal.tsx`).
- **Estados del inventario**: `disponible` → `seleccionado` → `reservado` → `ocupado` (o `bloqueado` por arquitectura).
- **Auto-limpieza**: el intervalo está en `RESERVATION_CLEANUP_INTERVAL_MS` (App.tsx, actualmente 15s).
- **Migración de inventario**: si un usuario tiene datos antiguos (string), `migrateLegacySeatValue` en `eventsData.ts` los convierte automáticamente.

---

## 🚫 Restricciones absolutas

- ❌ **Prohibido**：Agregar dependencias no usadas al build (causa inflación del bundle).
- ❌ **Prohibido**：Dejar console.logs olvidados en producción.
- ❌ **Prohibido**：Commits con archivos `.bak`, `_old_`, `.tmp` que no estén en `.gitignore`.
- ❌ **Prohibido**：Datos personales hardcoded (CC, tarjetas, emails, teléfonos) en código fuente.
- ❌ **Prohibido**：URLs hardcoded como `https://TU-USUARIO.github.io/...` — usar `VITE_BASE_URL` o detección runtime.
- ❌ **Prohibido**：Dejar archivos sin referencias (huérfanos). Si se elimina un componente, **borrar también su archivo .tsx**.

---

## 📁 Estructura de carpetas esperada

```
teatro-escolar-demo/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # Auto-deploy a GitHub Pages
├── deploy-ftp/                          # Output para hosting FTP (.htaccess + dist)
├── scripts/
│   ├── copy-to-deploy-ftp.mjs          # Sincroniza dist/ → deploy-ftp/
│   ├── ensure-source-index.mjs         # Restaura index.html desde el template
│   └── sync-to-xampp.mjs               # Sincroniza dist/ → C:\xampp\htdocs\<carpeta>\
├── src/
│   ├── App.tsx                          # Componente raíz
│   ├── main.tsx                         # createRoot
│   ├── types.ts                         # Tipos (Seat, Reservation, etc.)
│   ├── index.css                        # Estilos Tailwind
│   ├── data/
│   │   ├── eventsData.ts                # Presentaciones + inventario legacy-migration
│   │   ├── reservations.ts              # Lógica de reservas + expiración 48h
│   │   └── theaterData.ts               # Generación del teatro
│   └── components/
│       ├── Header.tsx
│       ├── TheaterMap.tsx
│       ├── CartSidebar.tsx
│       ├── ReservationModal.tsx         # Modal de reserva por consignación
│       ├── TicketReceiptModal.tsx       # Comprobante con instrucciones + QR
│       ├── AdminPanel.tsx
│       └── InfoModal.tsx
├── templates/
│   └── source-index.html                # Template del index.html fuente (para npm run dev)
├── .env.example
├── .gitattributes
├── .gitignore
├── guardarrailes.md                     # ← ESTE ARCHIVO
├── index.html                           # Template (con /src/main.tsx)
├── package.json
├── package-lock.json                    # o bun.lock (elegir uno)
├── README.md
├── tsconfig.json
└── vite.config.ts
```

---

## ✅ Convenciones de mensajes / commits

- Formato conventional commits:
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bugs
  - `refactor:` cambio interno sin afectar UX
  - `docs:` cambios solo en documentación
  - `chore:` tareas de mantenimiento (deps, configs)
  - `style:` cambios de formato (espacios, comas, etc. — no CSS)
- ✅ **SIEMPRE** preferir mensajes en español técnico claro y conciso.
- ❌ **NO** commits vagos ("update", "wip", "fix stuff").

---

## 🧪 Comandos canónicos (los que el agente debe usar)

| Acción | Comando |
|---|---|
| Iniciar dev server | `npm run dev` |
| Compilar producción | `npm run build` |
| Deploy a XAMPP | `npm run deploy:xampp` |
| Deploy a FTP local | `npm run build:deploy-ftp` |
| Deploy a GitHub Pages (con base absoluta) | `npm run build:gh-pages` |
| Verificación de tipos | `npm run lint` |
| Restaurar source `index.html` (manual) | `npm run dev:source` o `node scripts/ensure-source-index.mjs` |

---

## 📞 Escalación al usuario

Si el agente encuentra alguno de estos casos, debe **registrar el motivo** y **proponer la alternativa automática** más cercana, no pedirle al usuario que haga algo:

| Caso | Acción del agente |
|---|---|
| Permiso denegado (admin) | Buscar puerto/flag alternativo y documentar |
| Comando inexistente | Buscar binario en el sistema (`Get-Command`, `where.exe`) |
| Apache no se puede iniciar | Iniciar con `Start-Process -WindowStyle Hidden` y redirigir logs |
| Carpeta bloqueada por handle | Reintentar tras `Start-Sleep`, usar `robocopy /MOVE` |
| Datos faltantes en localStorage | Proveer valores por defecto razonables y mostrar UI |
| Conflicto de git | Resolver automáticamente (stash, rebase, fetch) cuando sea posible |

---

## 🏷️ Versión de este documento

- **Versión**: 1.1.0
- **Creado**: Cuando se consolidó el proyecto con `reserve-by-remittance` y se renombró a `teatro-escolar-demo`.
- **Actualizado**: Agregada regla de idioma español obligatorio (sección 0).
- **Mantenedor**: usuario del proyecto.

---

> 💡 Si encuentras alguna regla obsoleta o faltante, anótala aquí para que se mantenga el alineamiento entre el agente y el proyecto.
