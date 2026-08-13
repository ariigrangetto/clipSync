import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import NoteDetail from "./pages/NoteDetail.tsx";
import ErrorPage from "./pages/ErrorPage.tsx";


export const Router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
        errorElement: <ErrorPage />
    },
    {
        path: "/",
        element: <Dashboard />,
        errorElement: <ErrorPage />
    },
    {
        path: "/note/:id",
        element: <NoteDetail />,
        errorElement: <ErrorPage />
    },
    {
        path: "*",
        element: <ErrorPage />
    }
]);


