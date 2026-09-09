import { useRouteError, Link, isRouteErrorResponse } from "react-router";
import { FlowerIcon } from "../components/Icons.tsx";

export default function ErrorPage() {
    const error = useRouteError();

    let statusCode = "404";
    let statusText = "Page not found";
    let errorMessage = "We're sorry, the page you are looking for does not exist or has been moved.";

    if (isRouteErrorResponse(error)) {
        statusCode = error.status.toString();
        statusText = error.statusText || statusText;
    } else if (error instanceof Error) {
        statusCode = "500";
        statusText = "Internal Server Error";
        errorMessage = "An unexpected error ocurred. Please try again later.";
        console.error("Unhandle Application Error:", error);
    }

    return (
        <div className="min-h-screen bg-petal-bg text-petal-text flex flex-col justify-between items-center p-4 sm:p-6 font-body select-none">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-petal-green-light/40 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-petal-tag-2/50 blur-3xl" />
            </div>
            <header className="w-full max-w-5xl flex items-center justify-between py-3 sm:py-4 relative z-10">
                <Link role="link" to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-petal-green text-white flex items-center justify-center shadow-xs logo-flower">
                        <FlowerIcon size={20} />
                    </div>
                    <div>
                        <span className="font-display font-semibold text-lg leading-none block text-petal-text">
                            ClipSync
                        </span>
                        <span className="text-[10px] text-petal-muted uppercase tracking-wider font-medium">
                            Knowledge Base
                        </span>
                    </div>
                </Link>
            </header>
            <main className="relative z-10 max-w-lg w-full text-center my-auto py-6 sm:py-10">
                <div className="bg-[#181B19]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-petal-border shadow-lg relative overflow-hidden">
                    <div className="relative mb-6 inline-block">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-petal-green-light text-petal-green flex items-center justify-center mx-auto shadow-inner transition-transform hover:scale-105 duration-300">
                            <FlowerIcon size={48} className="logo-flower" />
                        </div>
                        <span className="absolute -bottom-2 -right-2 bg-petal-green text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            {statusCode}
                        </span>
                    </div>
                    <h1 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-petal-text mb-3 leading-tight">
                        {statusText}
                    </h1>

                    <p className="text-sm text-petal-muted leading-relaxed mb-8 max-w-sm mx-auto">
                        {errorMessage}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-petal-green text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-petal-green-hover transition-all duration-150 shadow-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Return home
                        </Link>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E2220] text-petal-text text-sm font-medium px-5 py-3 rounded-xl border border-petal-border hover:bg-[#252A27] transition-all duration-150 cursor-pointer"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            Retry
                        </button>
                    </div>
                </div>
            </main>
            <footer className="relative z-10 text-xs text-petal-muted py-4">
                ClipSync &copy; {new Date().getFullYear()} — All rights reserved.
            </footer>
        </div>
    );
}