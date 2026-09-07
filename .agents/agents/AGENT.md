# Agente de Desarrollo para ClipSync

## 🎯 Objetivo General
Desarrollar, mantener y escalar el proyecto **ClipSync**, garantizando una arquitectura limpia, tipado estricto, alta cobertura de pruebas y una experiencia de usuario moderna y fluida.

---

## 📝 Descripción general del proyecto
- **ClipSync** es una aplicación web y extensión de navegador que permite guardar, organizar y sincronizar notas en tiempo real entre múltiples dispositivos.
- Modos de uso:
  1. **Extensión para navegadores:** Permite seleccionar textos de cualquier página web y guardarlos de manera automática o mediante un botón flotante con indicador de estado (color visible = habilitado).
  2. **Aplicación web responsiva:** Dashboard completo para buscar, gestionar, categorizar, editar, marcar como favoritas y sincronizar notas.
- **Autenticación y Sesión:**
  - Soporte de autenticación de usuarios mediante Supabase (email/contraseña y Google OAuth).
  - Gestión de sesión y tokens (`useUserToken`, `authContext.tsx`, `ProtectedRoute.tsx`) con sincronización persistente en `localStorage` y `chrome.storage` para la extensión.
- **Lógica de notas y fuentes (URL):**
  - Los textos seleccionados se agrupan en la misma nota siempre que pertenezcan a la misma fuente/URL (`source`).
  - Si la URL de origen cambia, se crea una nueva nota diferenciada, incluso dentro de la misma categoría y usuario.
- **Diseño:** Sistema Dark Mode completo en toda la interfaz con tokens de color consistentes y Tailwind CSS v4.

---

## 🛠️ Stack Tecnológico y Contexto
- **Core & Framework:** React 19, TypeScript 6.0, Vite 8.1
- **Compilador & Optimización:** Babel React Compiler (`babel-plugin-react-compiler`)
- **Enrutamiento:** React Router DOM 7.18
- **Estilos & UI:** Tailwind CSS v4, Lucide React (iconos)
- **Backend & Base de Datos:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`) con PostgreSQL y Row Level Security (RLS)
- **Extensión de Navegador:** Chrome Extension Manifest V3 (`public/manifest.json`, `public/content.js`, `public/content.css`)
- **Testing Unitario:** Vitest 4.1, React Testing Library, JSDOM
- **Testing End-to-End:** Playwright (`@playwright/test`)
- **Calidad de Código:** ESLint 10, TypeScript-ESLint

---

## 🧩 Estructura de la Aplicación y Cobertura

### 📄 Páginas (`src/pages/`)
- [x] **`Login.tsx`**: Autenticación de usuarios (login/registro con email/password y Google OAuth). *(Tests Unitarios & E2E OK)*
- [x] **`Dashboard.tsx`**: Panel principal, listado y gestión de notas, barra de búsqueda y filtros por categoría. *(Tests Unitarios & E2E OK)*
- [x] **`NoteDetail.tsx`**: Vista individual de nota, edición en tiempo real, favoritos, copia al portapapeles y eliminación. *(Tests Unitarios & E2E OK)*
- [x] **`ErrorPage.tsx`**: Gestión de rutas 404 y errores globales con redirección a inicio. *(Tests Unitarios & E2E OK)*

### 🧱 Componentes UI (`src/components/`)
- [x] **`NoteCard.tsx`**: Tarjeta resumen de nota con tags de categoría, fecha y acciones directas. *(Tests Unitarios & E2E OK)*
- [x] **`AddNoteModal.tsx`**: Modal interactivo para creación manual de notas. *(Tests Unitarios & E2E OK)*
- [x] **`FloatingSelectionButton.tsx`**: Botón flotante para activar/desactivar la captura automática y rápida. *(E2E OK)*
- [x] **`TagsColor.tsx`**: Selector visual de etiquetas con paletas de colores dinámicas.
- [x] **`Icons.tsx`**: Biblioteca de íconos SVG reutilizables de la aplicación.
- [x] **`ProtectedRoute.tsx`**: Envoltorio de protección de rutas que verifica la autenticación antes de permitir el acceso.

### 🌐 Contextos y Estado Global (`src/context/`)
- [x] **`authContext.tsx`**: Manejo global de autenticación, ciclo de vida (`onAuthStateChange`), persistencia de sesión (`localStorage` / `chrome.storage`) y logout.
- [x] **`notesContext.tsx`**: Estado global de notas, ordenamiento, filtrado y suscripción en tiempo real con Supabase.

### 🪝 Hooks Personalizados (`src/hooks/`)
- [x] **`useNotes.tsx`**: Consumo directo del contexto de notas con tipado seguro.
- [x] **`useNotification.tsx`**: Sistema de notificaciones toast accesibles mediante Shadow DOM abierto.
- [x] **`useUserToken.ts`**: Gestión y persistencia segura de tokens de usuario.

### 🗄️ Servicios y Conexión Supabase (`src/lib/`, `src/service/`)
- [x] **`src/lib/supabase.ts`**: Inicialización del cliente Supabase con variables de entorno.
- [x] **`src/service/supabase.ts`**: Lógica de base de datos aislada (consultas tipadas, CRUD de notas y sanitización).

### 🔌 Extensión de Navegador (`public/`)
- [x] **`manifest.json`**: Manifiesto de Chrome Extension Manifest V3.
- [x] **`content.js`**: Inyección de lógica para captura de texto seleccionado en la web.
- [x] **`content.css`**: Estilos aislados para la interfaz inyectada en sitios web.

---

## 📋 Reglas y Buenas Prácticas

### 1. Código y Estructura
- Mantener tipado estricto en TypeScript sin utilizar `any`. EVITAR A TODA COSTA.
- Separar estrictamente la lógica de presentación de los servicios (`src/service/supabase.ts`) y contextos (`src/context/`).
- Nombrado explícito y semántico para componentes, funciones, tipos e interfaces.
- Utilizar `types/note.ts` para todas las definiciones de datos de notas.

### 2. Manejo de Estado y Datos
- Utilizar `authContext.tsx` para cualquier dato o verificación relacionada con el usuario y sesión.
- Utilizar `notesContext.tsx` para el estado global de notas y sincronización reactiva.
- Manejar adecuadamente estados de carga (`loading`), errores, estados vacíos (`empty state`) y desuscripción de canales Realtime (`supabase.channel().unsubscribe()`).

### 3. Seguridad y Base de Datos (RLS)
- Todo consumo de datos debe realizarse con el usuario autenticado.
- Respetar las directrices de `DATABASE-AGENT.md`: RLS habilitado, filtros obligatorios por usuario y cierre de conexiones.

### 4. Diseño y Experiencia de Usuario (UI/UX)
- Mantener una estética moderna, limpia y responsive orientada a **Dark Mode**.
- Respetar los tokens globales de color en `index.css` e `index.html` (evitar colores por defecto del navegador).
- Proporcionar feedback visual en todas las interacciones (estados hover, focus, disabled, modales, toasts de notificación y esqueletos de carga).

---

## ⛔ Restricciones (Lo que NO se debe hacer)
- **NO utilizar `any`** bajo ninguna circunstancia en TypeScript.
- **NO modificar respuestas de Supabase sin validar y tipar** adecuadamente los datos.
- **NO utilizar librerías o frameworks externos adicionales** sin solicitud explícita.
- **NO dejar `console.log`** o código muerto tras completar una funcionalidad.
- **NO cambiar la firma de métodos globales** de los contextos sin actualizar todos los archivos impactados.
- **NO intervenir en otros archivos** no relacionados con la tarea solicitada.
- **NO clasificar una tarea como completada ("done")** hasta que pase exitosamente el build, lint y los tests correspondientes.

---

## 🧪 Verificación y Comandos
- **Servidor de desarrollo**: `npm run dev`
- **Build de producción**: `npm run build`
- **Análisis de linter**: `npm run lint`
- **Tests unitarios**: `npm run test` (o `npx vitest run`)
- **Tests End-to-End (Headless)**: `npx playwright test`
- **Tests End-to-End (UI interactiva)**: `npx playwright test --ui`
- **Reporte de Playwright**: `npx playwright show-report`

---

## 📝 Instrucciones de Ejecución / Workflow
1. **Inspeccionar**: Leer los componentes, contextos y pruebas relacionadas antes de efectuar cambios.
2. **Implementar**: Modificar el código respetando la arquitectura, Dark Mode y buenas prácticas del proyecto.
3. **Validar**: Confirmar que no haya errores de compilación (`build`), linter (`lint`), ni regresiones en tests unitarios (`vitest`) y E2E (`playwright`).
4. **Retroalimentar**: Reportar cambios realizados, resultados de verificación y posibles áreas de mejora.

---

## 💢 Documentos Clasificados y Referencias
- **Pruebas unitarias e integración**: `src/__test__/unit/TEST-AGENT.md` (Requerido al trabajar en tests unitarios con Vitest).
- **Pruebas End-to-End**: `e2e/TEST-E2E-AGENT.md` (Requerido al trabajar con Playwright y Page Object Models).
- **Base de datos y seguridad**: `src/service/DATABASE-AGENT.md` (Requerido al modificar esquemas, consultas o políticas RLS de Supabase).
- **CI/CD Pipeline**: `.github/workflows/playwright.yml` (Flujo automatizado de pruebas en GitHub Actions).

---

## 💌 Al inicio de CADA sesión
- Leer `PROGRESS.MD` para conocer el estado actual y los últimos commits.
- Leer `.agents/agents/AGENT.md` para refrescar reglas, arquitectura y restricciones.
- Continuar desde la sección **"Siguientes pasos"** de `PROGRESS.MD`.

---

## 💻 Al final de CADA sesión
- Ejecutar la verificación completa: `npm run lint`, `npx vitest run` y `npx playwright test`.
- Actualizar `PROGRESS.MD` con las tareas terminadas, estado de pruebas y próximos pasos.
- Realizar commit descriptivo con convención (ej. `feat:`, `fix:`, `test:`, `docs:`).

---

## 🤖 Guía del Agente
Cuando trabajes en este repositorio:
1. **Verificación continua:** Asegurar que `npm run lint`, `npx vitest run` y `npx playwright test` se ejecuten limpiamente antes de dar una tarea por cerrada.
2. **Mantenimiento y sincronización:** Al completar un siguiente paso o añadir una nueva feature/componente, mantener sincronizados tanto `PROGRESS.MD` como `.agents/agents/AGENT.md`.

