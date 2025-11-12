import { NavLink, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Navigation() {
    return (
        <header className="bg-gray-800 text-white p-4 shadow-lg">
            <nav className="container mx-auto flex flex-wrap items-center justify-between gap-2">
                <Link to="/" className="text-xl font-bold hover:text-gray-300 transition-colors shrink-0">
                    Vite Template
                </Link>
                <div className="flex flex-wrap gap-1 md:gap-2 w-full md:w-auto">
                    {[
                        { to: '/', label: 'Home' },
                        { to: '/features', label: 'Features' },
                        { to: '/about', label: 'About' },
                    ].map((i) => (
                        <NavLink key={i.to} to={i.to} className={({ isActive }) =>
                            `inline-block rounded-md ${isActive ? 'bg-white/10' : ''}`
                        }>
                            {({ isActive }) => (
                                <Button variant="ghost" className={`text-white hover:bg-gray-700 ${isActive ? 'bg-white/10' : ''}`}>
                                    {i.label}
                                </Button>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </header>
    );
}