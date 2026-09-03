import { test, expect, describe, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorPage from "../../pages/ErrorPage.tsx";
import { isRouteErrorResponse, MemoryRouter, useRouteError } from "react-router";

vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return {
        ...actual,
        useRouteError: vi.fn(),
        isRouteErrorResponse: vi.fn(),
    }
});

describe("Error page test", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("The basic elements of the ErrorPage page should appear correctly.", () => {
        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter>
        );


        expect(screen.getByText("ClipSync")).toBeInTheDocument();
        expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
        expect(screen.getByText("404")).toBeInTheDocument();
        expect(screen.getByText("Page not found")).toBeInTheDocument();
        expect(screen.getByText("We're sorry, the page you are looking for does not exist or has been moved.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Return home" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    test("Should show error message in case isRouteErrorResponse", async () => {
        vi.mocked(isRouteErrorResponse).mockReturnValue(true);

        vi.mocked(useRouteError).mockReturnValue({
            status: 404,
            statusText: "Not Found",
        });

        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("ClipSync")).toBeInTheDocument();
        expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
        expect(screen.getByText("404")).toBeInTheDocument();
        expect(screen.getByText("Not Found")).toBeInTheDocument();
        expect(screen.getByText("We're sorry, the page you are looking for does not exist or has been moved.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Return home" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    })

    test("Should show error messages in case of Error instance", async () => {
        const error = new Error()
        vi.mocked(useRouteError).mockReturnValue(error);

        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter>
        )

        expect(screen.getByText("ClipSync")).toBeInTheDocument();
        expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
        expect(screen.getByText("500")).toBeInTheDocument();
        expect(screen.getByText("Internal Server Error")).toBeInTheDocument();
        expect(screen.getByText("An unexpected error ocurred. Please try again later.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Return home" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    })
});