import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseAnonKeyDefault = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

let supabase;

export const initSupabase = async () => {
    if (supabase) return supabase;

    const discoveredUrl = await SecureStore.getItemAsync('supabase_url');
    const discoveredKey = await SecureStore.getItemAsync('supabase_anon_key');
    const portalUrl = await SecureStore.getItemAsync('instance_url');

    if (!discoveredUrl || !portalUrl) return null;

    supabase = createClient(discoveredUrl, discoveredKey || supabaseAnonKeyDefault, {
        global: {
            headers: { 'ngrok-skip-browser-warning': 'true' },
        },
        auth: {
            storage: {
                getItem: (key) => SecureStore.getItemAsync(key),
                setItem: (key, value) => SecureStore.setItemAsync(key, value),
                removeItem: (key) => SecureStore.deleteItemAsync(key),
            },
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
    return supabase;
};

export const getSupabase = () => {
    return supabase;
};

// Add a helper to force re-init (e.g. after changing URL)
export const resetSupabase = () => {
    supabase = null;
};
