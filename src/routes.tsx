/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router";
import { lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const Login = lazy(() => import("./pages/Login.tsx"));
const NoteDetail = lazy(() => import("./pages/NoteDetail.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ErrorPage = lazy(() => import("./pages/ErrorPage.tsx"));
const ExtensionPopup = lazy(() => import("./pages/ExtensionPopup.tsx"));

const isExtension =
    typeof window !== "undefined" &&
    (window.location.protocol === "chrome-extension:" ||
        window.location.pathname.endsWith("/index.html") ||
        window.location.pathname === "/index.html");

const isFullDashboard =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "dashboard";

const defaultElement = isExtension && !isFullDashboard ? (
    <ExtensionPopup />
) : (
    <ProtectedRoute>
        <Dashboard />
    </ProtectedRoute>
);

export const Router = createBrowserRouter([
    {
        path: "/popup",
        element: <ExtensionPopup />,
        errorElement: <ErrorPage />
    },
    {
        path: "/index.html",
        element: defaultElement,
        errorElement: <ErrorPage />
    },
    {
        path: "/login",
        element: <Login />,
        errorElement: <ErrorPage />
    },
    {
        path: "/",
        element: defaultElement,
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
        element: isExtension && !isFullDashboard ? <ExtensionPopup /> : <ErrorPage />
    }
]);


