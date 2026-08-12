import type { RouteObject } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { HomePage } from '../pages/HomePage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { AboutPage } from '../pages/AboutPage';
import { SchemaPage } from '../pages/schema-page';
// Define the declarative route structure
const AppRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                index: true, // Default route for '/'
                element: <HomePage />,
            },
            {
                path: 'features',
                element: <FeaturesPage />,
            },
            {
                path: 'about',
                element: <AboutPage />,
            },
            {
                path: 'schema',
                element: <SchemaPage />,
            },
            // Optional: Add a 404/Not Found route
            // {
            //    path: '*',
            //    element: <NotFoundPage />,
            // }
        ],
    },
];

export default AppRoutes;