import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { features } from '@/data/featureData'

export function HomePage() {
    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Vite React Starter</h1>
                <p className="text-gray-600 max-w-2xl text-base sm:text-lg">
                    Minimal, modern, and ready for real work: Vite + React + TS + TailwindCSS + shadcn/ui + React-Router-DOM.
                    A clean baseline so you can build features—not wiring.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button asChild size="lg">
                        <Link to="/features">Explore Features</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link to="/about">About Template</Link>
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">What you get</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Essential tooling and a scalable structure.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="grid gap-3 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                        {features.map((f) => (
                            <li key={f.title} className="flex items-start gap-2">
                                <span className="mt-0.5 h-2 w-2 rounded-full bg-gray-900" />
                                <span className="font-medium">{f.title}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}