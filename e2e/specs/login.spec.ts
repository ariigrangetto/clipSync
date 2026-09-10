import { test, expect } from "@playwright/test";

test.describe("Login Page E2E Tests", () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage to ensure clean unauthenticated state
        await page.addInitScript(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });
    });

    test("should display all initial login UI elements in Log In mode", async ({ page }) => {
        await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

        // Branding and header
        await expect(page).toHaveTitle(/ClipSync/);
        await expect(page.getByRole("heading", { level: 1, name: /ClipSync/i })).toBeVisible();
        await expect(page.getByText("Capture and sync seamlessly with Supabase Auth")).toBeVisible();

        // Main heading and description
        await expect(page.getByRole("heading", { level: 2, name: "Your note space" })).toBeVisible();
        await expect(
            page.getByText("Save your selections and sync your devices securely with Email or Google.")
        ).toBeVisible();

        await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();

        await expect(page.getByLabel("Email address:")).toBeVisible();
        await expect(page.getByLabel("Password:")).toBeVisible();

        await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Don't have an account? Sign up here" })
        ).toBeVisible();

        await expect(page.getByText("Supabase Security")).toBeVisible();
        await expect(page.getByText("Multi-device")).toBeVisible();
        await expect(page.getByText("Web Extension")).toBeVisible();
        await expect(page.getByText(/Secure Supabase Authentication/i)).toBeVisible();
    });

    test("should toggle between Log In and Sign Up modes", async ({ page }) => {
        await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

        const toggleToSignUpBtn = page.getByRole("button", {
            name: "Don't have an account? Sign up here",
        });
        await toggleToSignUpBtn.click();

        await expect(
            page.getByRole("heading", { level: 2, name: "Create an account in ClipSync" })
        ).toBeVisible();
        await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Already have an account? Sign in here" })
        ).toBeVisible();

        const toggleToSignInBtn = page.getByRole("button", {
            name: "Already have an account? Sign in here",
        });
        await toggleToSignInBtn.click();

        await expect(page.getByRole("heading", { level: 2, name: "Your note space" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
    });

    test("should disable submit button when fields are empty and enable when filled", async ({ page }) => {
        await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

        const submitBtn = page.getByRole("button", { name: "Log In" });
        const emailInput = page.getByLabel("Email address:");
        const passwordInput = page.getByLabel("Password:");

        await expect(submitBtn).toBeDisabled();

        await emailInput.fill("testuser@example.com");
        await expect(submitBtn).toBeDisabled();

        await passwordInput.fill("password123");
        await expect(submitBtn).toBeEnabled();

        await passwordInput.fill("");
        await expect(submitBtn).toBeDisabled();
    });

    test("should handle failed login attempt with error notification", async ({ page }) => {
        await page.route(/\/auth\/v1\//i, async (route) => {
            const url = route.request().url();
            if (url.includes("token")) {
                await route.fulfill({
                    status: 400,
                    contentType: "application/json",
                    body: JSON.stringify({
                        error: "invalid_grant",
                        error_description: "Invalid login credentials",
                        message: "Invalid login credentials",
                    }),
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({}),
                });
            }
        });

        await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

        await page.getByLabel("Email address:").fill("wrong@example.com");
        await page.getByLabel("Password:").fill("wrongpassword");

        const submitBtn = page.getByRole("button", { name: "Log In" });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // Toast notification host is attached to DOM and displays error message
        await expect(page.locator("#clipsync-toast-host")).toBeAttached();
        await expect(page.getByText("User does not exist or invalid credentials")).toBeVisible();
        await expect(page).toHaveURL("http://localhost:5173/login");
    });

    test("should handle successful login flow and redirect to dashboard", async ({ page }) => {
        const mockUser = {
            id: "e2e-user-id",
            aud: "authenticated",
            role: "authenticated",
            email: "success@example.com",
            app_metadata: { provider: "email" },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const validJwt =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdXNlci1pZCIsImVtYWlsIjoic3VjY2Vzc0BleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";

        await page.route(/\/auth\/v1\//i, async (route) => {
            const url = route.request().url();
            if (url.includes("token")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        access_token: validJwt,
                        token_type: "bearer",
                        expires_in: 3600,
                        expires_at: Math.floor(Date.now() / 1000) + 3600,
                        refresh_token: "fake-refresh-token",
                        user: mockUser,
                    }),
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(mockUser),
                });
            }
        });

        await page.route(/\/rest\/v1\/Notes/i, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([]),
            });
        });

        await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });

        await page.getByLabel("Email address:").fill("success@example.com");
        await page.getByLabel("Password:").fill("correctpassword123");

        const submitBtn = page.getByRole("button", { name: "Log In" });
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        await expect(page.locator("#clipsync-toast-host")).toBeAttached();
        await expect(page).toHaveURL("http://localhost:5173/");
    });
});
