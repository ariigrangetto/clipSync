import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { Router } from './routes.tsx'
import { AuthProvider } from './context/authContext.tsx'
import NotesProvider from './context/notesContext.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <NotesProvider>
      <RouterProvider router={Router} />
    </NotesProvider>
  </AuthProvider>
)
