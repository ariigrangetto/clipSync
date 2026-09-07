/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router";
import { lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const Login = lazy(() => import("./pages/Login.tsx"));
const NoteDetail = lazy(() => import("./pages/NoteDetail.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPage.tsx"));
const ExtensionPopup = lazy(() => import("./pages/ExtensionPopup.tsx"));

const isChromeExtension =
    typeof window !== "undefined" && window.location.protocol === "chrome-extension:";

export const Router = createBrowserRouter([
    {
        path: "/popup",
        element: <ExtensionPopup />,
        errorElement: <ErrorPage />
    },
    {
        path: "/index.html",
        element: isChromeExtension ? (
            <ExtensionPopup />
        ) : (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
        errorElement: <ErrorPage />
    },
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


