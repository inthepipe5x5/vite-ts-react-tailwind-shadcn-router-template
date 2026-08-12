//query client for react-query
import { QueryClient } from '@tanstack/react-query';


export const defaultConfig = {
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
}
const qc = new QueryClient(defaultConfig);
export default qc;