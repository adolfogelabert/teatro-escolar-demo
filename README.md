# 🎭 Teatro Escolar · Demo React

**Sistema oficial de asignación de asientos y boletería para la temporada de teatro escolar 2026.**

Construido con **React 19 + Vite 6 + TypeScript**, persistencia en `localStorage` y flujo de **reserva por consignación bancaria** con expiración automática a 48 horas.

[DEMO EN VIVO (GitHub Pages)](https://TU-USUARIO.github.io/teatro-escolar-demo/) · [Reportar un issue](https://github.com/TU-USUARIO/teatro-escolar-demo/issues)

---

## ✨ Características

- 🪑 **Mapa interactivo del teatro**: Platea central, 1°/2°/3° Balcón y Palcos laterales
- 🎟️ **Selector de función**: Preescolar, Primaria y Bachillerato con gestión de inventario independiente
- 🛡️ **Panel administrativo**: ajuste de precio, simulación de lleno, listado de reservas activas y reseteo de función
- 🏦 **Reserva por consignación bancaria**: asienta los datos del cliente, genera código único y libera los asientos tras **48 horas** sin confirmación
- 📧 **Correo personalizado**: resumen, datos para consignar y código de referencia
- 📲 **Recibo con QR**: generado client-side con la librería `qrcode`
- 🎉 **Confetti al confirmar la reserva** (`canvas-confetti`)
- 💾 **Persistencia del carrito y reservas** entre recargas (`localStorage`)
- ⏱️ **Limpieza automática**: las reservas vencidas liberan los asientos cada 15 segundos
- ⚡ **Build estático** listo para **GitHub Pages** o **XAMPP/Apache**

## 🛠️ Stack técnico

| Capa | Tecnología |
| --- | --- |
| UI Framework | **React 19** (functional components + hooks) |
| Lenguaje | **TypeScript 5.8** |
| Build tool | **Vite 6** |
| Estilos | **Tailwind CSS 4** (vía `@tailwindcss/vite`) |
| Iconos | **lucide-react** |
| QR | **qrcode** |
| Confetti | **canvas-confetti** |
| Pago demo | Reserva por **consignación bancaria** simulada |
| Deploy | **GitHub Pages** vía **GitHub Actions** y **XAMPP** |

## 🛡️ Sistema de reserva por consignación

El proyecto **ya no** simula una pasarela de pagos tradicional. En su lugar:

1. El cliente selecciona los asientos en el plano del teatro.
2. Completa un formulario con sus datos (sin tarjeta).
3. Se genera una **reserva** con un código único (`RES-XXXXXX`) y un **código de referencia de pago** (`TEATRO-2026-PRI-123456`).
4. Los asientos pasan a estado **Reservado** (morado) por **48 horas**.
5. El cliente recibe un **correo simulado** con los datos para consignar en la cuenta del colegio.
6. Si en 48 horas no se confirma el pago, los **asientos vuelven automáticamente** a `Disponible` (verde).
7. El panel administrativo permite **confirmar la consignación manualmente** (simulación) para mover los asientos a `Ocupado` (rojo).

> ⚠️ **Modo demo**: para esta prueba la reserva expira en **45 segundos** (en vez de 48 horas) con el fin de poder verificar visualmente la liberación automática.

## 🔐 Códigos de color de los asientos

| Color | Estado | Significado |
| --- | --- | --- |
| 🟢 Verde (`#4CAF50`) | Disponible | Puede ser seleccionado |
| 🟡 Amarillo (`#FFEB3B`) | Seleccionado | En el carrito de reserva |
| 🟣 Morado (`#7C3AED`) | Reservado | Consignación pendiente (48h) |
| 🔴 Rojo (`#F44336`) | Ocupado | Consignación confirmada |
| ⚫ Gris (`#757575`) | Bloqueado | Palcos y filas A y B de Platea |

## 📂 Estructura del proyecto

```
.
├── src/
│   ├── App.tsx                      # Componente raíz y orquestador de estado
│   ├── main.tsx                     # Punto de entrada (createRoot)
│   ├── types.ts                     # Tipos (Seat, Reservation, SeatStatus…)
│   ├── index.css                    # Estilos globales Tailwind
│   ├── data/
│   │   ├── eventsData.ts            # Definición de funciones e inventarios
│   │   ├── reservations.ts          # Lógica de reservas con expiración 48h
│   │   └── theaterData.ts           # Generación de la estructura del teatro
│   └── components/
│       ├── Header.tsx               # Cabecera institucional
│       ├── TheaterMap.tsx           # Mapa visual del teatro
│       ├── CartSidebar.tsx          # Resumen de la reserva
│       ├── ReservationModal.tsx     # Formulario de reserva
│       ├── TicketReceiptModal.tsx   # Comprobante con instrucciones + QR
│       ├── AdminPanel.tsx           # Panel de taquillera + listado de reservas
│       └── InfoModal.tsx            # Ayuda y guía
├── .github/workflows/deploy.yml     # Auto-deploy a GitHub Pages
├── scripts/                         # Automatizaciones de build/deploy
├── templates/                       # Templates HTML (source-index.html)
├── vite.config.ts                   # Configuración Vite (base: './')
├── index.html                       # HTML base (template para Vite)
└── package.json
```

## 🚀 Desarrollo local

**Prerrequisitos:** Node.js ≥ 18 (o [Bun](https://bun.sh)).

```bash
npm install
npm run dev          # http://localhost:3000 (Vite dev server)
npm run build        # genera ./dist
npm run preview      # sirve el build en http://localhost:4173
npm run lint         # type-check con tsc --noEmit
```

### Scripts de despliegue

| Comando | Descripción |
|---|---|
| `npm run build` | Solo build a `./dist/` |
| `npm run build:gh-pages` | Build con `base=/teatro-escolar-demo/` |
| `npm run build:deploy-ftp` | Build + sincroniza con `./deploy-ftp/` |
| `npm run deploy:xampp` | Build + sincroniza con `C:\xampp\htdocs\teatro_2\` |
| `npm run dev` | Restaura el `index.html` fuente + Vite dev server |

## 🌐 Despliegue

### XAMPP / Apache (proyecto en `htdocs`)

Si tu proyecto vive en `C:\xampp\htdocs\teatro_2\`, simplemente:

```bash
npm run deploy:xampp
```

Y abre `http://localhost/teatro_2/`. El script sincroniza `dist/` → `htdocs/` automáticamente y restaura el `index.html` fuente cuando vuelves a `npm run dev`.

### GitHub Pages

1. Sube el código a un repositorio nuevo en GitHub (ej. `teatro-escolar-demo`).
2. En **Settings → Pages**, establece **Source** como **GitHub Actions**.
3. Haz `git push` a `main`. El workflow compilará con `npm run build` y publicará el `dist/`.
4. Tu demo quedará disponible en `https://<TU-USUARIO>.github.io/teatro-escolar-demo/`.

### Hosting FTP tradicional

```bash
npm run build:deploy-ftp
```

Copia el contenido a `./deploy-ftp/` (incluyendo `.htaccess`) listo para subir vía FTP.

## 🎬 Flujo de la demo (5 minutos)

1. **Header**: muestra el conmutador de funciones (Preescolar / Primaria / Bachillerato).
2. **Mapa del Teatro**: haz zoom y filtra por zona. Los asientos morados están **reservados**.
3. **Selección**: clic en cualquier asiento verde → pasa a amarillo.
4. **Carrito lateral**: revisa el total a consignar y elimina asientos con la ✕.
5. **Reserva**: clic en **"Reservar y pagar por consignación"** → completa el formulario → confirma.
6. **Comprobante**: aparece el modal con código QR, datos del banco, referencia de pago y botón para imprimir.
7. **Taquilla / Admin** (botón en el header):
   - Cambia el precio de la boleta.
   - Simula lleno (≈ 65% ocupado) o resetea función.
   - Marca manualmente la consignación como recibida.
   - Visualiza todas las reservas activas con su tiempo restante.
8. **Auto-limpieza**: si no confirmas en el plazo (45s en demo, 48h en producción), los asientos vuelven a estar disponibles automáticamente.

## 📜 Licencia

MIT © 2026 — Colegio Mayor · **Demo educativa**.

---

<div align="center">
  Hecho con ❤️ usando React, Vite y TypeScript.
  Demo lista para presentar 🚀
</div>
