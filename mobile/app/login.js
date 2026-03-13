import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase } from '../lib/supabase';
import { Mail, Lock, LogIn, ShieldCheck, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingSettings, setFetchingSettings] = useState(true);
    const [platformSettings, setPlatformSettings] = useState({
        name: 'CONTROL HORARIO',
        logo: null
    });

    // 2FA State
    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [verifying2FA, setVerifying2FA] = useState(false);
    const [tempUserId, setTempUserId] = useState(null);

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

            const { data, error } = await supabase
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

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);

        try {
            let supabase = getSupabase() || await initSupabase();

            // 1. Authenticate with password
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Check if 2FA is needed
            const user = authData.user;
            const { data: profile, error: profError } = await supabase
                .from('profiles')
                .select('two_factor_enabled, last_2fa_verification')
                .eq('id', user.id)
                .single();

            if (profError) throw profError;

            if (profile?.two_factor_enabled) {
                // Check TTL
                const { data: setting } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', '2fa_session_duration_hours')
                    .maybeSingle();

                const ttlHours = parseInt(setting?.value || '24');
                const lastVerif = profile.last_2fa_verification;

                let needs2FA = true;
                if (lastVerif) {
                    const diffHours = (new Date().getTime() - new Date(lastVerif).getTime()) / (1000 * 3600);
                    if (diffHours < ttlHours) {
                        needs2FA = false;
                    }
                }

                if (needs2FA) {
                    setTempUserId(user.id);
                    setShow2FA(true);
                    setLoading(false);
                    return;
                }
            }

            // No 2FA or already trusted
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert('Error de Acceso', error.message || 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (twoFactorToken.length !== 6) return;
        setVerifying2FA(true);

        try {
            const supabase = getSupabase();
            const { data, error } = await supabase.rpc('verify_2fa_token', {
                token: twoFactorToken
            });

            if (error) throw error;

            if (data.success) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Código Incorrecto', data.error || 'El código introducido no es válido.');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo verificar el código: ' + error.message);
        } finally {
            setVerifying2FA(false);
        }
    };

    if (show2FA) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <ShieldCheck size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Verificación 2FA</Text>
                        <Text style={styles.subtitle}>Introduce el código de 6 dígitos de tu aplicación de autenticación</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.iconWrapper}>
                            <KeyRound size={20} color="#94a3b8" />
                        </View>
                        <TextInput
                            style={styles.input2FA}
                            placeholder="000 000"
                            placeholderTextColor="#64748b"
                            value={twoFactorToken}
                            onChangeText={(val) => setTwoFactorToken(val.replace(/\D/g, '').substring(0, 6))}
                            keyboardType="numeric"
                            maxLength={6}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, twoFactorToken.length !== 6 ? styles.buttonDisabled : null]}
                        onPress={handleVerify2FA}
                        disabled={twoFactorToken.length !== 6 || verifying2FA}
                    >
                        {verifying2FA ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>VERIFICAR</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={async () => {
                            const supabase = getSupabase();
                            await supabase.auth.signOut();
                            setShow2FA(false);
                            setTwoFactorToken('');
                        }}
                        style={styles.backLink}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <ArrowLeft size={14} color="#64748b" />
                            <Text style={styles.backLinkText}>Volver al login</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
                    <Text style={styles.subtitle}>Panel de control horario</Text>
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
                    <View style={styles.iconWrapper}>
                        <Lock size={20} color="#94a3b8" />
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor="#64748b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (!email || !password) ? styles.buttonDisabled : null]}
                    onPress={handleLogin}
                    disabled={!email || !password || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                            <LogIn size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>SISTEMA DE VERIFICACIÓN</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                    onPress={() => router.replace('/verify')}
                    style={styles.verifyButton}
                >
                    <Mail size={16} color="#3b60c1" />
                    <Text style={styles.verifyButtonText}>ACTIVAR CON CÓDIGO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.replace('/setup')}
                    style={styles.backLink}
                >
                    <Text style={styles.backLinkText}>Cambiar servidor de empresa</Text>
                </TouchableOpacity>
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
        marginBottom: 50,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b60c1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#3b60c1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    platformLogo: {
        width: '100%',
        height: 80,
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '700',
        marginTop: 5,
        textAlign: 'center',
        letterSpacing: 0.5,
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
    input2FA: {
        flex: 1,
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 8,
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
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 40,
        marginBottom: 20,
        opacity: 0.5,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#475569',
    },
    dividerText: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    verifyButton: {
        height: 56,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(59, 96, 193, 0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    verifyButtonText: {
        color: '#3b60c1',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    backLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    backLinkText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '700',
    }
});
