import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [hasUrl, setHasUrl] = useState(false);

    useEffect(() => {
        async function checkSetup() {
            const url = await SecureStore.getItemAsync('instance_url');
            setHasUrl(!!url);
            setIsReady(true);
        }
        checkSetup();
    }, []);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
                <ActivityIndicator size="large" color="#3b60c1" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#3b60c1',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '900',
                },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ title: 'Conectar Portal', headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}
