import { Outlet, Link } from "@tanstack/react-router";

export function RootLayout() {
    return (
        <div>
            <header>
                <Link to="/">Bears Live — Blockchain Analysis</Link>
            </header>
            <main>
                <Outlet />
            </main>
        </div >
    )
}