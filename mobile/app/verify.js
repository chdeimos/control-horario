import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase } from '../lib/supabase';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, Check } from 'lucide-react-native';

export default function VerifyScreen() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [fetchingSettings, setFetchingSettings] = useState(true);
    const [platformSettings, setPlatformSettings] = useState({
        name: 'CONTROL HORARIO',
        logo: null
    });

    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setFetchingSettings(true);
        try {
            let supabase = getSupabase() || await initSupabase();
            if (!supabase) {
                setFetchingSettings(false);
                return;
            }

            const { data } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['app_name', 'saas_logo_app']);

            if (data && data.length > 0) {
                const settingsMap = data.reduce((acc, item) => {
                    acc[item.key] = item.value;
                    return acc;
                }, {});

                let finalLogo = settingsMap.saas_logo_app;
                if (finalLogo && finalLogo.trim() !== '') {
                    try {
                        const sbUrl = await SecureStore.getItemAsync('supabase_url');
                        if (sbUrl && (finalLogo.includes('127.0.0.1') || finalLogo.includes('localhost'))) {
                            finalLogo = finalLogo.replace(/http:\/\/(127\.0\.0\.1|localhost):54321/g, sbUrl);
                        }
                    } catch (e) { }
                }

                setPlatformSettings({
                    name: settingsMap.app_name || 'CONTROL HORARIO',
                    logo: (finalLogo && finalLogo.trim() !== '') ? finalLogo : null
                });
            }
        } catch (err) {
            console.error("Error fetching platform settings:", err);
        } finally {
            setFetchingSettings(false);
        }
    };

    const handleVerify = async () => {
        if (!email || !token) return;
        setLoading(true);

        try {
            const supabase = getSupabase() || await initSupabase();

            const cleanEmail = email.trim();
            const cleanToken = token.trim();

            const types = ['signup', 'invite', 'recovery'];
            let lastError = null;

            for (const type of types) {
                const { data, error } = await supabase.auth.verifyOtp({
                    email: cleanEmail,
                    token: cleanToken,
                    type
                });

                if (!error && data.session) {
                    setSuccess(true);
                    setTimeout(() => {
                        router.replace('/(tabs)');
                    }, 2000);
                    return;
                }
                lastError = error;
            }

            throw new Error(lastError?.message || 'El código no es válido o ha caducado.');
        } catch (error) {
            Alert.alert('Error de Verificación', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.inner}>
                    <View style={styles.successContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: '#10b981', shadowColor: '#10b981' }]}>
                            <Check size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>¡CORREO VERIFICADO!</Text>
                        <Text style={styles.subtitle}>Tu identidad ha sido confirmada correctamente. Redirigiendo...</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.inner}>
                <View style={styles.header}>
                    {fetchingSettings ? (
                        <ActivityIndicator size="small" color="#3b60c1" style={{ marginBottom: 20 }} />
                    ) : (
                        <>
                            {platformSettings.logo ? (
                                <Image
                                    source={{ uri: platformSettings.logo }}
                                    style={styles.platformLogo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text style={styles.title}>{platformSettings.name}</Text>
                            )}
                        </>
                    )}
                    <View style={styles.securityBadge}>
                        <ShieldCheck size={16} color="#3b60c1" />
                        <Text style={styles.securityText}>SECURITY GATEWAY</Text>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.textCenter}>
                        <Text style={styles.formTitle}>VERIFICAR ACCESO</Text>
                        <Text style={styles.formSubtitle}>Introduce el código de 6 dígitos que has recibido por email</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.iconWrapper}>
                            <Mail size={20} color="#94a3b8" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#64748b"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.inputCode}
                            placeholder="000000"
                            placeholderTextColor="#475569"
                            value={token}
                            onChangeText={(val) => setToken(val.replace(/\D/g, '').substring(0, 6))}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!email || token.length < 6) ? styles.buttonDisabled : null]}
                        onPress={handleVerify}
                        disabled={!email || token.length < 6 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>CONFIRMAR IDENTIDAD</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/login')}
                        style={styles.backLink}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <ArrowLeft size={14} color="#64748b" />
                            <Text style={styles.backLinkText}>Volver al login</Text>
                        </View>
                    </TouchableOpacity>
                </View>
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
        alignItems: 'center',
    },
    platformLogo: {
        width: '100%',
        height: 60,
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        backgroundColor: 'rgba(59, 96, 193, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 96, 193, 0.2)',
    },
    securityText: {
        fontSize: 10,
        color: '#3b60c1',
        fontWeight: '900',
        letterSpacing: 2,
    },
    formContainer: {
        backgroundColor: '#1e293b',
    },
    textCenter: {
        alignItems: 'center',
        marginBottom: 30,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        marginBottom: 5,
    },
    formSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 60,
        marginBottom: 15,
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
    inputCode: {
        flex: 1,
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#3b60c1',
        height: 64,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
        shadowColor: '#3b60c1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    backLink: {
        marginTop: 30,
        alignItems: 'center',
    },
    backLinkText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '700',
    },
    successContainer: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '700',
        marginTop: 5,
        textAlign: 'center',
        letterSpacing: 0.5,
        lineHeight: 20,
        maxWidth: 250,
    },
});
