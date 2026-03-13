import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initSupabase } from '../lib/supabase';

export default function Index() {
    const [isReady, setIsReady] = useState(false);
    const [hasUrl, setHasUrl] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        async function checkSetup() {
            try {
                const url = await SecureStore.getItemAsync('instance_url');
                if (url) {
                    setHasUrl(true);
                    const supabase = await initSupabase();
                    if (supabase) {
                        const { data: { user } } = await supabase.auth.getUser();
                        setHasSession(!!user);
                    }
                }
            } catch (err) {
                console.error("Setup check error:", err);
            } finally {
                setIsReady(true);
            }
        }
        checkSetup();
    }, []);

    if (!isReady) return null;

    if (!hasUrl) {
        return <Redirect href="/setup" />;
    }

    if (!hasSession) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(tabs)" />;
}
