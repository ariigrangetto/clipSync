import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import Login, { formatForgotPasswordError } from "../../pages/Login.tsx";
import { AllTheProviders } from "./Providers.tsx";

const mockSignInWithEmail = vi.fn().mockResolvedValue({ error: null });
const mockSignUpWithEmail = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithGoogle = vi.fn().mockResolvedValue({ error: null });
const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

vi.mock("../../hooks/useUserToken.ts", () => ({
    useUserToken: () => ({
        user: null,
        session: null,
        token: null,
        loading: false,
        isPasswordRecovery: false,
        signInWithEmail: mockSignInWithEmail,
        signUpWithEmail: mockSignUpWithEmail,
        signInWithGoogle: mockSignInWithGoogle,
        resetPasswordForEmail: mockResetPasswordForEmail,
        updatePassword: vi.fn(),
        signOut: vi.fn(),
    }),
}));

describe("Login Page Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("login page should render all initial UI elements correctly in Log In mode", () => {
        render(<Login />, { wrapper: AllTheProviders });

        const h1Element = screen.getByRole("heading", { level: 1, name: /ClipSync/i });
        const subHeader = screen.getByText(/Capture and sync seamlessly with Supabase Auth/i);
        const headingTitle = screen.getByRole("heading", { level: 2, name: /Your note space/i });
        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const googleBtnElement = screen.getByRole("button", { name: /Continue with Google/i });
        const submitBtnElement = screen.getByRole("button", { name: /Log In/i });
        const toggleModeBtn = screen.getByRole("button", { name: /Don't have an account\? Sign up here/i });
        const forgotPasswordBtn = screen.getByRole("button", { name: /Forgot password\?/i });

        expect(h1Element).toBeInTheDocument();
        expect(subHeader).toBeInTheDocument();
        expect(headingTitle).toBeInTheDocument();
        expect(googleBtnElement).toBeInTheDocument();
        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(submitBtnElement).toBeInTheDocument();
        expect(toggleModeBtn).toBeInTheDocument();
        expect(forgotPasswordBtn).toBeInTheDocument();
    });

    test("should toggle between Log In and Sign Up modes", () => {
        render(<Login />, { wrapper: AllTheProviders });

        const toggleModeBtn = screen.getByRole("button", { name: /Don't have an account\? Sign up here/i });

        fireEvent.click(toggleModeBtn);

        expect(screen.getByRole("heading", { level: 2, name: /Create an account in ClipSync/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Already have an account\? Sign in here/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Already have an account\? Sign in here/i }));

        expect(screen.getByRole("heading", { level: 2, name: /Your note space/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Log In/i })).toBeInTheDocument();
    });

    test("submit button should be disabled when email or password is empty", () => {
        render(<Login />, { wrapper: AllTheProviders });

        const submitBtn = screen.getByRole("button", { name: /Log In/i });
        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);

        expect(submitBtn).toBeDisabled();

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        expect(submitBtn).toBeDisabled();

        fireEvent.change(passwordInput, { target: { value: "password123" } });
        expect(submitBtn).not.toBeDisabled();
    });

    test("should call signInWithEmail on form submission in Log In mode", async () => {
        render(<Login />, { wrapper: AllTheProviders });

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const submitBtn = screen.getByRole("button", { name: /Log In/i });

        fireEvent.change(emailInput, { target: { value: "user@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "secret123" } });
        fireEvent.click(submitBtn);

        expect(mockSignInWithEmail).toHaveBeenCalledWith("user@example.com", "secret123");
    });

    test("should call signUpWithEmail on form submission in Sign Up mode with 8-character minimum", async () => {
        render(<Login />, { wrapper: AllTheProviders });

        const toggleModeBtn = screen.getByRole("button", { name: /Don't have an account\? Sign up here/i });
        fireEvent.click(toggleModeBtn);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const submitBtn = screen.getByRole("button", { name: /Sign Up/i });

        // Too short
        fireEvent.change(emailInput, { target: { value: "newuser@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "short" } });
        fireEvent.click(submitBtn);
        expect(mockSignUpWithEmail).not.toHaveBeenCalled();

        // Valid length
        fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
        fireEvent.click(submitBtn);
        expect(mockSignUpWithEmail).toHaveBeenCalledWith("newuser@example.com", "newpassword123");
    });

    test("should toggle to forgot password mode and call resetPasswordForEmail, staying on screen and displaying inline success message", async () => {
        render(<Login />, { wrapper: AllTheProviders });

        const forgotPasswordBtn = screen.getByRole("button", { name: /Forgot password\?/i });
        fireEvent.click(forgotPasswordBtn);

        expect(screen.getByRole("heading", { level: 2, name: /Recover your password/i })).toBeInTheDocument();
        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const sendBtn = screen.getByRole("button", { name: /Send reset link/i });

        fireEvent.change(emailInput, { target: { value: "reset@example.com" } });
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(mockResetPasswordForEmail).toHaveBeenCalledWith("reset@example.com");
        });

        expect(screen.getByRole("heading", { level: 2, name: /Recover your password/i })).toBeInTheDocument();
        expect(screen.getByText(/Email sent! Please check your inbox for the reset link./i)).toBeInTheDocument();
    });

    test("should display friendly attempt-based error message inline when rate-limited during forgot password", async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce({
            error: {
                message: "For security purposes, you can only request this once every 60 seconds",
                status: 429,
            },
        });

        render(<Login />, { wrapper: AllTheProviders });

        const forgotPasswordBtn = screen.getByRole("button", { name: /Forgot password\?/i });
        fireEvent.click(forgotPasswordBtn);

        const emailInput = screen.getByPlaceholderText(/your@email.com/i);
        const sendBtn = screen.getByRole("button", { name: /Send reset link/i });

        fireEvent.change(emailInput, { target: { value: "reset@example.com" } });
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(mockResetPasswordForEmail).toHaveBeenCalledWith("reset@example.com");
        });

        expect(
            screen.getByText(/Too many attempts. For security reasons, please wait 60 seconds before requesting another reset link./i)
        ).toBeInTheDocument();
    });

    test("formatForgotPasswordError should correctly transform rate limit errors to explain repeated attempts", () => {
        // Specific seconds from message
        expect(
            formatForgotPasswordError({
                message: "For security purposes, you can only request this once every 60 seconds",
                status: 429,
            })
        ).toBe("Too many attempts. For security reasons, please wait 60 seconds before requesting another reset link.");

        // Generic rate limit without seconds
        expect(
            formatForgotPasswordError({
                message: "Email rate limit exceeded",
                status: 429,
            })
        ).toBe("Too many attempts. For security reasons, please wait a minute before requesting another reset link.");

        // Code matching
        expect(
            formatForgotPasswordError({
                message: "Unexpected error",
                code: "over_email_send_rate_limit",
            })
        ).toBe("Too many attempts. For security reasons, please wait a minute before requesting another reset link.");

        // Non-rate limit error
        expect(
            formatForgotPasswordError({
                message: "User not found",
            })
        ).toBe("User not found");
    });

    test("should call signInWithGoogle when Google sign in button is clicked", async () => {
        render(<Login />, { wrapper: AllTheProviders });

        const googleBtn = screen.getByRole("button", { name: /Continue with Google/i });
        fireEvent.click(googleBtn);

        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
});
