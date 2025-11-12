import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { features } from '@/data/featureData'

export function FeaturesPage() {
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        if (!q) return features
        return features.filter((f) =>
            [f.title, f.description].some((v) => v.toLowerCase().includes(q))
        )
    }, [query])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Key Features</h1>
                <div className="flex items-center gap-2 w-full md:w-80">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search features..."
                        aria-label="Search features"
                    />
                    {query && (
                        <Button variant="ghost" onClick={() => setQuery('')}>Clear</Button>
                    )}
                </div>
            </div>

            <div className="text-xs sm:text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>

            {filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>No matches found</CardTitle>
                        <CardDescription>Try a different keyword.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((feature, index) => (
                        <Card key={index} className={`shadow-sm border-l-4 ${feature.tailwindClass}`}>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-gray-700">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}