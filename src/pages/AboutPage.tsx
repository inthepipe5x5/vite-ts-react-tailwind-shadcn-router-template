import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const principles = [
    { title: 'Fast', desc: 'Vite dev server & optimized build.' },
    { title: 'Typed', desc: 'First-class TypeScript everywhere.' },
    { title: 'Composable', desc: 'UI built from accessible primitives.' },
    { title: 'Minimal', desc: 'No clutter—add what you need.' },
]

export function AboutPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">About This Template</h1>
                <p className="text-gray-600 max-w-2xl text-base sm:text-lg">
                    A pragmatic foundation for building production React apps. It balances simplicity
                    with modern tooling, letting you scale without premature complexity.
                </p>
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Core Principles</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Design choices that shape the starter.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="grid gap-4 sm:grid-cols-2 text-sm">
                        {principles.map((p) => (
                            <li key={p.title} className="flex flex-col gap-1">
                                <span className="font-medium">{p.title}</span>
                                <span className="text-gray-500">{p.desc}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Next Ideas</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Suggested enhancements you can add.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Dark mode toggle.</li>
                        <li>API data layer (TanStack Query or fetch wrappers).</li>
                        <li>Authentication (Auth.js or JWT flow).</li>
                        <li>Testing setup (Vitest + React Testing Library).</li>
                        <li>CI pipeline (lint, typecheck, preview deploy).</li>
                    </ol>
                </CardContent>
            </Card>

            <a href="https://github.com/R0N7w7/vite-ts-react-tailwind-shadcn-router-template" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">View Source</Button>
            </a>
        </div>
    )
}