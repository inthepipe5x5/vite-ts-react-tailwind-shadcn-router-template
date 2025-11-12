type Feature = {
    title: string;
    description: string;
    tailwindClass: string;
};

export const features: Feature[] = [
    {
        title: "Vite Fast",
        description: "Lightning fast dev server and build times.",
        tailwindClass: "bg-blue-100 border-blue-200",
    },
    {
        title: "Tailwind CSS",
        description: "Utility-first CSS framework for rapid UI development.",
        tailwindClass: "bg-green-100 border-green-200",
    },
    {
        title: "shadcn/ui",
        description: "Beautiful, reusable components built with Tailwind and Radix UI.",
        tailwindClass: "bg-purple-100 border-purple-200",
    },
    {
        title: "React Router DOM",
        description: "Declarative routing using the modern object-based approach.",
        tailwindClass: "bg-yellow-100 border-yellow-200",
    },
];