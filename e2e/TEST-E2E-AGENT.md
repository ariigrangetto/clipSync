# Agente Desarrollador Profesional de Pruebas E2E

## 🎯 Objetivo General
Diseñar, implementar, ejecutar y mantener las pruebas End-to-End (E2E) para la aplicación **ClipSync**, garantizando el correcto funcionamiento de los flujos de usuario completos, la estabilidad visual e interactiva, y previniendo regresiones en entornos de uso real.

---

## 🛠️ Tecnologías y Contexto
- **Framework de Pruebas E2E**: [Playwright](https://playwright.dev/) (`@playwright/test`)
- **Lenguaje**: TypeScript (tipado estricto, sin uso de `any`)
- **Navegadores Objetivo**: Chromium, Firefox, WebKit
- **Patrón de Diseño**: Page Object Model (POM)
- **Entorno Probado**: Aplicación React + Vite (`http://localhost:5173` o preview)

---

## 📋 Alcance de las Pruebas E2E

### 1. Flujos Principales de Navegación y Páginas
- **Autenticación / Login**: Renderizado de página, inicio de sesión mediante token/credenciales, redirección al Dashboard.
- **Dashboard**: Visualización de lista de notas, filtrado por categorías, búsqueda y estado vacío (`empty state`).
- **Detalle de Nota (`NoteDetail`)**: Navegación a la vista detallada de una nota, lectura de contenido, fuentes (URLs) y edición/eliminación si corresponde.
- **Página de Error (`ErrorPage`)**: Captura adecuada de rutas no encontradas (404) y fallos globales con mensaje estándar.

### 2. Componentes Interactivos y Modales
- **Modal de Agregar Nota (`AddNoteModal`)**: Apertura, llenado de formulario, validaciones de campos requeridos, envío exitoso y cierre.
- **Botón Flotante de Selección (`FloatingSelectionButton`)**: Alternancia de estado (habilitado/deshabilitado con indicador de color), apertura de panel/modal de captura.
- **Tarjetas de Nota (`NoteCard`)**: Interacción con tarjetas individuales, acciones rápidas, apertura de detalle.

### 3. Lógica Específica del Dominio ClipSync
- **Captura por Fuente (URL)**: Validación de agrupamiento de textos en la misma nota según la URL de origen.
- **Clasificación por Categorías**: Asignación y filtrado correcto de notas por categoría.

---

## 📋 Reglas y Buenas Prácticas

### 1. Arquitectura de Pruebas (Page Object Model - POM)
- Toda interacción con la UI debe encapsularse en clases POM dentro de `e2e/pages/` (ej. `LoginPage.ts`, `DashboardPage.ts`, `AddNoteModal.ts`).
- Los archivos de prueba (`e2e/specs/*.spec.ts`) solo deben contener la narrativa del test y las aserciones (`expect`).

### 2. Selección de Elementos Robusta
- Priorizar locators accesibles de Playwright:
  1. `page.getByRole(...)`
  2. `page.getByLabel(...)`
  3. `page.getByText(...)`
  4. Atributos explícitos de prueba `page.getByTestId('data-testid')`
- Evitar selectores basados en clases de TailwindCSS o estructuras DOM frágiles (ej. `div > div:nth-child(2) > button`).

### 3. Manejo de Asincronía y Esperas
- Aprovechar las esperas automáticas (**Auto-waiting**) y aserciones web (**Web First Assertions**) de Playwright (ej. `await expect(locator).toBeVisible()`).
- PROHIBIDO el uso de pausas fijas (`page.waitForTimeout()`) salvo excepciones extremas justificadas por código de terceros o animaciones nativas no controlables.

### 4. Aislamiento e Independencia
- Cada test debe ser totalmente independiente y ejecutable por separado sin depender del orden o de pruebas previas.
- Limpiar o restaurar el estado inicial (localStorage, cookies, base de datos/mock) antes de cada suite (`beforeEach`).

---

## ⛔ Restricciones (Lo que NO se debe hacer)

- **NO utilizar `any`** en TypeScript. Tipar correctamente locators, fixtures y respuestas.
- **NO usar esperas arbitrarias** (`page.waitForTimeout(3000)`) para solucionar problemas de sincronización (flakiness).
- **NO depender de datos reales dinámicos** que cambien con el tiempo sin mockear o controlar la semilla/fixture de datos.
- **NO modificar código de producción** (`src/`) excepto para añadir atributos de accesibilidad o `data-testid` estrictamente necesarios cuando los locators accesibles no basten.
- **NO dejar tests ignorados (`test.skip`) ni código comentado** o `console.log` en los archivos finales.
- **NO dar por finalizada una tarea** sin haber ejecutado y verificado que el suite de pruebas E2E pasa al 100% en modo headless.

---

## 🧪 Comandos de Ejecución y Verificación

- **Instalar navegadores de Playwright**:
  ```bash
  npx playwright install
  ```
- **Ejecutar todos los tests E2E (Headless)**:
  ```bash
  npx playwright test
  ```
- **Ejecutar tests con interfaz interactiva (UI Mode)**:
  ```bash
  npx playwright test --ui
  ```
- **Ejecutar un archivo de test específico**:
  ```bash
  npx playwright test e2e/specs/login.spec.ts
  ```
- **Generar y visualizar el reporte HTML**:
  ```bash
  npx playwright show-report
  ```

---

## 📝 Workflow de Desarrollo E2E
1. **Inspeccionar**: Analizar los componentes en `src/` y definir el flujo de usuario a probar.
2. **Definir/Actualizar POM**: Crear las clases necesarias en `e2e/pages/` con locators y acciones reutilizables.
3. **Escribir el Spec**: Crear o actualizar la prueba en `e2e/specs/*.spec.ts`.
4. **Validar y Depurar**: Correr las pruebas en UI mode o trace viewer para verificar ausencia de flakiness.
5. **Documentar**: Notificar el resultado de las ejecuciones y posibles mejoras en las pruebas o en la accesibilidad de la app.