import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("./pages/Login.tsx"));
const NoteDetail = lazy(() => import("./pages/NoteDetail.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPage.tsx"));




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


