import { MemoryRouter } from "react-router-dom";
import NotesProvider from "../../context/notesContext.tsx";

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MemoryRouter>
            <NotesProvider>
                {children}
            </NotesProvider>
        </MemoryRouter>
    )
};