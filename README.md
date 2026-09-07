# 📝 ClipSync

> **Block de notas inteligente y sincronizado en tiempo real** disponible como **Web Application** y **Extensión de Navegador Google Chrome (Manifest V3)**, potenciado por React 19, Tailwind CSS v4 y Supabase.

---

## ⚡ Características Principales

- 🔄 **Sincronización en Tiempo Real**: Base de datos PostgreSQL con suscripciones a cambios instantáneos mediante Supabase Realtime.
- 🔌 **Extensión de Navegador (Chrome MV3)**: Captura texto seleccionado de cualquier página web y sincronízalo automáticamente o con un clic.
- 🏷️ **Gestión y Organización Avanzada**: Filtrado por categorías dinámicas, etiquetas personalizadas con paleta de colores, favoritos y búsqueda instantánea en tiempo real.
- 🔐 **Autenticación Segura**: Integración con Supabase Auth vía Google OAuth o Correo Electrónico y Contraseña.
- 🎨 **Diseño Moderno & Dark Mode**: Estilos minimalistas y accesibles diseñados sobre Tailwind CSS v4.
- 🧪 **Calidad de Código y Pruebas**: Cobertura completa con pruebas unitarias (Vitest + Testing Library) y pruebas End-to-End (Playwright).
- 🚀 **Integración y Despliegue Continuo**: Pipeline automatizado de validación y empaquetado de la extensión en GitHub Actions.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, React Router 7 |
| **Estilos** | Tailwind CSS v4, Lucide Icons |
| **Backend & DB** | Supabase (PostgreSQL, Realtime, Auth, RLS) |
| **Tooling & Build** | Vite 8, Rolldown Babel Plugin (React Compiler) |
| **Testing** | Vitest, React Testing Library, Playwright E2E |
| **Extensión** | Chrome Manifest V3 (Content Script + Storage API) |

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Prerrequisitos
- **Node.js**: Versión 20 o superior.
- **npm**: Versión 10 o superior.

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/ariigrangetto/clipSync.git
cd clipSync
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env` y añade tus credenciales de Supabase:
```bash
cp .env.example .env
```
Edita `.env`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica-anon
```

### 3. Ejecutar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## 🧪 Comandos y Scripts

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite. |
| `npm run build` | Valida tipos de TypeScript (`tsc -b`) y compila para producción (`vite build`). |
| `npm run lint` | Analiza el código con ESLint 10 y reglas de React. |
| `npm run test` | Ejecuta las pruebas unitarias con Vitest. |
| `npx playwright test` | Ejecuta la suite de pruebas End-to-End en navegadores reales. |
| `npm run preview` | Previsualiza localmente el build generado en `dist/`. |

---

## 🔌 Instalación de la Extensión en Chrome

1. Compila la aplicación:
   ```bash
   npm run build
   ```
2. Abre Google Chrome y navega a `chrome://extensions/`.
3. Activa la casilla **Modo de desarrollador** (Developer mode) en la esquina superior derecha.
4. Haz clic en **Cargar descomprimida** (Load unpacked) y selecciona la carpeta `dist/` de este proyecto.
5. ¡Listo! El ícono de ClipSync aparecerá en tu barra de extensiones.

---

## 🌐 Despliegue en Producción (Vercel)

1. Conecta el repositorio a tu cuenta de **Vercel**.
2. En la configuración del proyecto en Vercel (**Settings > Environment Variables**), agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. El archivo `vercel.json` incluido en el repositorio gestionará automáticamente las reescrituras para el enrutamiento de la SPA.
4. En el panel de **Supabase**:
   - Ve a **Authentication > URL Configuration**.
   - En **Site URL**, coloca el dominio público de tu despliegue (ej. `https://tu-app.vercel.app`).
   - En **Redirect URLs**, añade la URL pública y `http://localhost:5173` para desarrollo.
