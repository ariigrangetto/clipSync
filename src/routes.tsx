/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router";
import { lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

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
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
        errorElement: <ErrorPage />
    },
    {
        path: "/note/:id",
        element: (
            <ProtectedRoute>
                <NoteDetail />
            </ProtectedRoute>
        ),
        errorElement: <ErrorPage />
    },
    {
        path: "*",
        element: <ErrorPage />
    }
]);


