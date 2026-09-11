# 📝 ClipSync

[English](README_EN.md) | [Español](README.md)

> **Smart, real-time synchronized notepad** available as a **Web Application** and **Google Chrome Browser Extension (Manifest V3)**, powered by React 19, Tailwind CSS v4, and Supabase.

---

## ⚡ Key Features

- 🔄 **Real-Time Synchronization**: PostgreSQL database with instant change subscriptions via Supabase Realtime.
- 🔌 **Browser Extension (Chrome MV3)**: Capture selected text from any web page and sync it automatically or with a single click.
- 🏷️ **Advanced Management & Organization**: Dynamic category filtering, custom tags with a color palette, favorites, and instant real-time search.
- 🔐 **Secure Authentication**: Supabase Auth integration via Google OAuth or Email and Password.
- 🎨 **Modern Design & Dark Mode**: Minimalist, accessible design styled with Tailwind CSS v4.
- 🧪 **Code Quality & Testing**: Full test coverage with unit tests (Vitest + Testing Library) and End-to-End tests (Playwright).
- 🚀 **Continuous Integration & Deployment**: Automated pipeline for validation, testing, and extension packaging via GitHub Actions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, React Router 7 |
| **Styling** | Tailwind CSS v4, Lucide Icons |
| **Backend & DB** | Supabase (PostgreSQL, Realtime, Auth, RLS) |
| **Tooling & Build** | Vite 8, Rolldown Babel Plugin (React Compiler) |
| **Testing** | Vitest, React Testing Library, Playwright E2E |
| **Extension** | Chrome Manifest V3 (Content Script + Storage API) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: Version 20 or higher.
- **npm**: Version 10 or higher.

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/ariigrangetto/clipSync.git
cd clipSync
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` and set your Supabase credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

### 3. Start Development Server
```bash
npm run dev
```
The web application will be available at `http://localhost:5173`.

---

## 🧪 Commands & Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server with Vite. |
| `npm run build` | Validates TypeScript types (`tsc -b`) and builds for production (`vite build`). |
| `npm run lint` | Lints code using ESLint 10 and React rules. |
| `npm run test` | Runs unit tests with Vitest. |
| `npx playwright test` | Executes the End-to-End test suite across real browsers. |
| `npm run preview` | Locally previews the production build from `dist/`. |

---

## 🔌 Installing the Chrome Extension

1. Build the application:
   ```bash
   npm run build
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable the **Developer mode** toggle in the top right corner.
4. Click on **Load unpacked** and select the `dist/` directory from this project.
5. You're done! The ClipSync icon will now appear in your browser's extensions toolbar.
