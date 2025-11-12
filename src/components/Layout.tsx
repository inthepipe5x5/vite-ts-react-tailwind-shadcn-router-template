import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navigation />

            <main className="grow container mx-auto p-4 md:p-8">
                <Outlet />
            </main>

            <footer className="bg-gray-200 p-4 text-center text-gray-600 border-t">
                {new Date().getFullYear()} | Vite React Template by @RonConCoca
            </footer>
        </div>
    );
}