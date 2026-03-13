import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase, resetSupabase } from '../lib/supabase';
import { Globe, ArrowRight } from 'lucide-react-native';

export default function SetupScreen() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConnect = async () => {
        if (!url) return;

        setLoading(true);
        let cleanUrl = url.trim().toLowerCase();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = `https://${cleanUrl}`;
        }

        try {
            // Fase de descubrimiento: Obtener la configuración oficial del portal
            const response = await fetch(`${cleanUrl}/api/mobile/config`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (!response.ok) throw new Error('Portal no compatible');

            const config = await response.json();
            let sbUrl = config.supabaseUrl;

            // Lógica inteligente para Túneles (ngrok, cloudflared, etc.)
            const isExternalTunnel = cleanUrl.includes('ngrok-free.dev') || cleanUrl.includes('.trycloudflare.com');
            const isSbLocal = sbUrl.includes('127.0.0.1') || sbUrl.includes('localhost');

            if (isExternalTunnel && isSbLocal) {
                // Si usamos un túnel externo, redirigimos el tráfico de Supabase a través del proxy 
                // que he configurado en Next.js (supabase-proxy)
                sbUrl = `${cleanUrl}/supabase-proxy`;
            } else if (isSbLocal) {
                // Si es local (Wi-Fi), traducimos 127.0.0.1 a la IP del PC
                const portalHost = cleanUrl.split('/')[2].split(':')[0];
                sbUrl = sbUrl.replace('127.0.0.1', portalHost).replace('localhost', portalHost);
            }

            await SecureStore.setItemAsync('instance_url', cleanUrl);
            await SecureStore.setItemAsync('supabase_url', sbUrl);
            if (config.supabaseAnonKey) {
                await SecureStore.setItemAsync('supabase_anon_key', config.supabaseAnonKey);
            }

            resetSupabase();
            await initSupabase();
            router.replace('/login');
        } catch (error) {
            Alert.alert('Error de Configuración', 'No se ha podido obtener la configuración del portal. Asegúrate de que la URL es correcta y el servidor está activo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>Conecta la app con tu portal de empresa</Text>
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.iconWrapper}>
                        <Globe size={20} color="#94a3b8" />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="ej: control-horario.com"
                        placeholderTextColor="#64748b"
                        value={url}
                        onChangeText={setUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, !url ? styles.buttonDisabled : null]}
                    onPress={handleConnect}
                    disabled={!url || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>CONECTAR INSTANCIA</Text>
                            <ArrowRight size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Pregunta a tu administrador por la dirección URL de tu portal.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e293b',
    },
    inner: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 60,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#475569',
    },
    iconWrapper: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#3b60c1',
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#3b60c1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 30,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
    }
});
