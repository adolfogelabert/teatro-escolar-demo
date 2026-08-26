<div align="center">

# 🎭 Teatro Escolar · Demo React

**Sistema oficial de asignación de asientos y boletería para la temporada de teatro escolar 2026.**

Construido con **React 19 + Vite 6 + TypeScript**, persistencia en `localStorage` y simulación de la pasarela transaccional Davivienda.

[DEMO EN VIVO (GitHub Pages)](https://TU-USUARIO.github.io/teatro-escolar-demo/) · [Reportar un issue](https://github.com/TU-USUARIO/teatro-escolar-demo/issues)

</div>

---

## ✨ Características

- 🪑 **Mapa interactivo del teatro**: Platea central (20 filas × 16 asientos), 1°/2°/3° Balcón y Palcos laterales
- 🎟️ **Selector de función**: Preescolar, Primaria y Bachillerato con gestión de inventario independiente
- 🛡️ **Panel administrativo**: ajuste de precio, simulación de lleno y reseteo de función
- 💳 **Pasarela Davivienda simulada**: DaviPlata · PSE · Tarjeta
- 📲 **Recibo con QR**: generado client-side con la librería `qrcode`
- 🎉 **Confetti al pago aprobado** (`canvas-confetti`)
- 💾 **Persistencia del carrito** entre recargas (`localStorage`)
- ⚡ **Build estático** listo para **GitHub Pages**

## 🛠️ Stack técnico

| Capa | Tecnología |
| --- | --- |
| UI Framework | **React 19** (functional components + hooks) |
| Lenguaje | **TypeScript 5.8** |
| Build tool | **Vite 6** |
| Estilos | **Tailwind CSS 4** (vía `@tailwindcss/vite`) |
| Iconos | **lucide-react** |
| Animaciones | **motion** (Framer Motion) |
| QR | **qrcode** |
| Pago demo | Pasarela **Davivienda** simulada |
| Deploy | **GitHub Pages** vía **GitHub Actions** |

El footer de la aplicación muestra los badges de **React 19 · Vite 6 · TypeScript** para confirmar visualmente el stack durante la demo.

## 📂 Estructura del proyecto

```
.
├── src/
│   ├── App.tsx                      # Componente raíz y orquestador de estado
│   ├── main.tsx                     # Punto de entrada (createRoot)
│   ├── types.ts                     # Tipos (Seat, Presentation, SeatStatus…)
│   ├── index.css                    # Estilos globales Tailwind
│   ├── data/
│   │   ├── eventsData.ts            # Definición de funciones e inventarios
│   │   └── theaterData.ts           # Generación de la estructura del teatro
│   └── components/
│       ├── Header.tsx               # Cabecera institucional
│       ├── TheaterMap.tsx           # Mapa visual del teatro
│       ├── CartSidebar.tsx          # Resumen de compra
│       ├── DaviviendaModal.tsx      # Pasarela de pago simulada
│       ├── TicketReceiptModal.tsx   # Recibo con QR
│       ├── AdminPanel.tsx           # Panel de taquillera
│       └── InfoModal.tsx            # Ayuda y guía
├── .github/workflows/deploy.yml     # Auto-deploy a GitHub Pages
├── vite.config.ts                   # Configuración Vite (base: './')
├── index.html                       # HTML base
└── package.json
```

## 🚀 Desarrollo local

**Prerrequisitos:** [Bun](https://bun.sh) (o Node.js ≥ 18).

```bash
bun install
bun run dev          # http://localhost:3000
bun run build        # genera ./dist
bun run preview      # sirve el build en http://localhost:4173
bun run lint         # type-check con tsc --noEmit
```

## 🌐 Despliegue en GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy.yml` que se ejecuta en cada `push` a la rama `main`/`master`.

### Setup en 5 pasos

1. **Sube el código a un repositorio nuevo** en GitHub (ej. `teatro-escolar-demo`).
2. En **Settings → Pages**, establece **Source** como **GitHub Actions**.
3. Haz `git push` a `main`. El workflow compilará con `bun run build` y publicará el `dist/`.
4. Espera 1-2 minutos. Tu demo quedará disponible en:
   ```
   https://<TU-USUARIO>.github.io/teatro-escolar-demo/
   ```
5. Edita el enlace del badge al inicio de este README con tu usuario.

> 💡 Si renombrarás el repositorio, ajusta la variable `VITE_BASE_URL` en el workflow o usa el script `npm run build:gh-pages`.

### Configurar el base path manualmente

Por defecto `vite.config.ts` usa `base: './'` (rutas relativas), lo que permite que la app funcione **tanto en проекто pages (`/teatro-escolar-demo/`) como en user pages (`/`) sin tocadas extra**.

Si quieres forzar una ruta absoluta (recomendado para SEO y estabilidad):

```bash
VITE_BASE_URL=/teatro-escolar-demo/ bun run build
```

## 🎬 Flujo de la demo (5 minutos)

1. **Header**: muestra el conmutador de funciones (Preescolar / Primaria / Bachillerato).
2. **Mapa del Teatro**: haz zoom (botones 🔍+/-) y filtra por zona (Platea, 1°/2°/3° Balcón).
3. **Selección**: clic en cualquier asiento verde → pasa a amarillo (★ seleccionado).
4. **Carrito lateral**: revisa los totales y elimina asientos con la ✕.
5. **Pago**: clic en **"Pagar con Davivienda"** → elige DaviPlata/PSE/Tarjeta → confirma.
6. **Recibo**: aparece el modal verde con código QR impreso (botón 🖨️ Imprimir).
7. **Panel Admin** (botón `Taquilla / Admin` en el header superior):
   - Cambia el precio de la boleta (se guarda en `localStorage`).
   - `Simular lleno` (≈ 65% ocupado) o `Reiniciar función`.
8. **Footer**: enseña los badges **React 19 · Vite 6 · TypeScript** y la nota *"Demo desplegada vía GitHub Pages & GitHub Actions"*.

## 📜 Licencia

MIT © 2026 — Colegio Mayor · Demo educativa. **Davivienda** es marca registrada usada únicamente con fines demostrativos.

---

<div align="center">
  <sub>Hecho con ❤️ usando React, Vite y TypeScript. Demo lista para presentar 🚀</sub>
</div>
