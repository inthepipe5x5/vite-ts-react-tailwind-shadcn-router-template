export const envVariables = import.meta.env;
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.TEST;
export const envMode = import.meta.env.MODE;

export const supabaseEnv = {

    ...Object.entries(envVariables)
        .filter(([key], _, array) => {
            if (array.length === 0) {
                throw new Error(`No supabase environment variables found. Please check your .env file and ensure that the SUPABASE_ variables are set.`);
            }
            return key.includes('SUPABASE_')
        })
        .reduce((acc, [key, value]) => {
            const envKey = key.slice(key.indexOf('SUPABASE_')).toLowerCase();
            acc[envKey] = value;
            return acc;
        }, {} as Record<string, string>),
    url: import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.SUPABASE_PUBLISHABLE_KEY ?? '',
};
//throw errors if the supabase environment variables are not set correctly
if (Object.values(supabaseEnv).length < 2 || !supabaseEnv.url || !supabaseEnv.key) {
    const missingKeys = [] as string[];
    if (!supabaseEnv.url) missingKeys.push('SUPABASE_URL');
    else if (!supabaseEnv.key) missingKeys.push('SUPABASE_PUBLISHABLE_KEY');
    else if (!isProduction) console.log(`Supabase environment variables are not set correctly: Env keys: ${JSON.stringify(supabaseEnv, null, 1)}`);
    throw new Error(`Supabase environment variables are not set correctly. 
        Please check your .env file and ensure that the SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY variables are set.
        Missing keys: ${missingKeys.join(', ')}`);
}