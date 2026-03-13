import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase } from '../../lib/supabase';
import * as Location from 'expo-location';
import { Play, Square, MapPin, Clock, History, Calendar, LogOut } from 'lucide-react-native';

export default function FichajeTab() {
    const [loading, setLoading] = useState(false);
    const [activeEntry, setActiveEntry] = useState(null);
    const [elapsed, setElapsed] = useState('00:00:00');
    const [user, setUser] = useState(null);
    const [onVacation, setOnVacation] = useState(false);
    const [company, setCompany] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [profile, setProfile] = useState(null);
    const [nextVacation, setNextVacation] = useState(null);
    const [todayHours, setTodayHours] = useState('00:00');
    const [vacationDays, setVacationDays] = useState(0);
    const [personalDays, setPersonalDays] = useState(0);
    const timerRef = useRef(null);
    const router = useRouter();

    const handleLogout = async () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salir",
                    style: "destructive",
                    onPress: async () => {
                        const supabase = getSupabase();
                        if (supabase) await supabase.auth.signOut();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    useEffect(() => {
        checkStatus();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const checkStatus = async () => {
        let supabase = getSupabase();
        if (!supabase) {
            supabase = await initSupabase();
        }
        if (!supabase) return;

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error("Error getting user:", userError);
            return;
        }
        setUser(user);

        if (user) {
            try {
                // 1. Perfil (Mismo fetch que time-off.js)
                const { data: profileData, error: profError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profError) console.error("Error cargando perfil:", profError);

                if (profileData) {
                    setProfile(profileData);

                    // Cargar Empresa (Columnas correctas según esquema)
                    if (profileData.company_id) {
                        const { data: compData, error: compError } = await supabase
                            .from('companies')
                            .select('name, logo_app_url, logo_web_url')
                            .eq('id', profileData.company_id)
                            .maybeSingle();

                        if (compError) console.error("Error cargando empresa:", compError);

                        if (compData) {
                            let finalLogo = compData.logo_app_url || compData.logo_web_url;
                            if (finalLogo) {
                                try {
                                    const sbUrl = await SecureStore.getItemAsync('supabase_url');
                                    // Si es una URL local, traducirla para el dispositivo físico/emulador
                                    if (sbUrl && (finalLogo.includes('127.0.0.1') || finalLogo.includes('localhost'))) {
                                        finalLogo = finalLogo.replace(/http:\/\/(127\.0\.0\.1|localhost):54321/g, sbUrl);
                                    }
                                } catch (e) { }
                            }
                            setCompany({ ...compData, logo_url: finalLogo });
                        }
                    }

                    // Cargar Horarios
                    const { data: schedData } = await supabase
                        .from('work_schedules')
                        .select('*')
                        .eq('profile_id', user.id);

                    if (schedData) {
                        const dayOfWeek = [7, 1, 2, 3, 4, 5, 6][new Date().getDay()];
                        setSchedule(schedData.find(s => s.day_of_week === dayOfWeek));
                    }

                    // Calcular balances dinámicamente (Sincronizado con time-off.js)
                    const { data: reqs } = await supabase
                        .from('time_off_requests')
                        .select('*')
                        .eq('user_id', user.id);

                    let usedVacation = 0;
                    let usedPersonal = 0;

                    if (reqs) {
                        const approved = reqs.filter(r => r.status === 'approved');
                        approved.forEach(r => {
                            const days = Math.ceil(Math.abs(new Date(r.end_date) - new Date(r.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                            if (r.request_type === 'vacation') usedVacation += days;
                            else if (r.request_type === 'personal') usedPersonal += days;
                        });

                        // Próxima/Actual (Sincronizado)
                        const todayStr = new Date().toLocaleDateString('en-CA');
                        const upcoming = approved.filter(r => r.end_date >= todayStr);
                        upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
                        const current = upcoming.find(v => v.start_date <= todayStr && v.end_date >= todayStr);
                        const next = upcoming.find(v => v.start_date > todayStr);
                        setNextVacation(current || next);
                        setOnVacation(!!current);
                    }

                    setVacationDays((profileData?.total_vacation_days || 0) - usedVacation);
                    setPersonalDays((profileData?.total_personal_days || 0) - usedPersonal);
                } else {
                    setVacationDays(0);
                    setPersonalDays(0);
                }

                // 2. Fichaje Activo (CRÍTICO)
                const { data: active } = await supabase
                    .from('time_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .is('clock_out', null)
                    .maybeSingle();

                setActiveEntry(active);
                if (active) {
                    startTimer(active.clock_in);
                }

                // 3. Horas de hoy y Vacaciones (Independiente del perfil)
                const today = new Date().toLocaleDateString('en-CA');

                const { data: todayEntries } = await supabase
                    .from('time_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('clock_in', today + 'T00:00:00');

                if (todayEntries) {
                    let totalSec = 0;
                    todayEntries.forEach(entry => {
                        if (entry.clock_out) {
                            totalSec += (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 1000;
                        } else if (active && entry.id === active.id) {
                            totalSec += (new Date().getTime() - new Date(active.clock_in).getTime()) / 1000;
                        }
                    });
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    setTodayHours(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }


            } catch (err) {
                console.error("Critical error in checkStatus:", err);
            }
        }
    };

    const startTimer = (startTime) => {
        if (timerRef.current) clearInterval(timerRef.current);

        const start = new Date(startTime).getTime();
        timerRef.current = setInterval(() => {
            const now = new Date().getTime();
            const diff = now - start;

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setElapsed(
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `
            );
        }, 1000);
    };

    const handleClockIn = async () => {
        if (onVacation) {
            Alert.alert('Acceso Denegado', 'No puedes fichar mientras estás en un periodo de vacaciones o ausencia aprobado.');
            return;
        }
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Es obligatorio el acceso al GPS para realizar el fichaje.');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;

            const supabase = getSupabase();
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();

            const { data: newEntry, error } = await supabase.from('time_entries').insert({
                user_id: user.id,
                company_id: profile.company_id,
                clock_in: new Date().toISOString(),
                origin: 'mobile_app',
                gps_lat: latitude,
                gps_long: longitude,
            }).select().single();

            if (error) throw error;

            setActiveEntry(newEntry);
            startTimer(newEntry.clock_in);
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo iniciar la jornada');
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requiere GPS para cerrar la jornada.');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;

            const supabase = getSupabase();
            const { error } = await supabase
                .from('time_entries')
                .update({
                    clock_out: new Date().toISOString(),
                    // We could add out-gps if we had columns for it, but the schema has gps_lat/long which usually refers to the event.
                    // Actually, schema usually stores start coords. We'll stick to it.
                })
                .eq('id', activeEntry.id);

            if (error) throw error;

            setActiveEntry(null);
            setElapsed('00:00:00');
            if (timerRef.current) clearInterval(timerRef.current);
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo finalizar la jornada');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 1. Header con Logo y Saludo */}
            <View style={styles.header}>
                <View style={styles.branding}>
                    {company?.logo_url ? (
                        <Image source={{ uri: company.logo_url }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <Text style={styles.companyName}>{company?.name || 'CONTROLPRO'}</Text>
                    )}
                </View>
                <Text style={styles.greeting}>
                    ¡Hola, {(profile?.full_name || user?.user_metadata?.full_name || user?.email || 'usuario').split(' ')[0].split('@')[0]}! 👋
                </Text>
            </View>

            {/* 2. Franja Azul de Estado */}
            <View style={styles.statusStrip}>
                <Text style={styles.dateText}>
                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                </Text>
                <View style={styles.divider} />
                <View style={styles.objectiveRow}>
                    <Clock size={14} color="#fff" />
                    <Text style={styles.objectiveText}>
                        {(() => {
                            if (!schedule) return 'SIN TURNO HOY';
                            if (profile?.schedule_type === 'fixed') {
                                const start = schedule.start_time?.substring(0, 5);
                                const end = schedule.end_time?.substring(0, 5);
                                let range = `${start} a ${end}`;
                                if (schedule.start_time_2 && schedule.end_time_2) {
                                    range += ` / ${schedule.start_time_2.substring(0, 5)} a ${schedule.end_time_2.substring(0, 5)}`;
                                }
                                return range;
                            }
                            // Flexible or fallback
                            return `OBJETIVO: ${schedule.target_total_hours || 8} HORAS`;
                        })()}
                    </Text>
                </View>
            </View>

            {/* 3. Sección Oscura: Contador y Botón */}
            <View style={styles.timerSection}>
                <Text style={styles.statusLabel}>{activeEntry ? 'EN CURSO' : 'DESACTIVADO'}</Text>
                <Text style={styles.timerLarge}>{elapsed}</Text>

                <TouchableOpacity
                    style={[styles.actionButton, activeEntry ? styles.btnStop : styles.btnStart]}
                    onPress={activeEntry ? handleClockOut : handleClockIn}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <View style={styles.btnIconBg}>
                                {activeEntry ? <Square size={16} color="#f0114b" fill="#f0114b" /> : <Play size={16} color="#3b60c1" fill="#3b60c1" />}
                            </View>
                            <Text style={styles.btnLabel}>
                                {activeEntry ? 'FINALIZAR JORNADA' : 'INICIAR JORNADA'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.geoRow}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.geoText}>GEOLOCALIZACIÓN REQUERIDA</Text>
                </View>
            </View>

            {/* 4. Tarjetas Informativas */}
            <View style={styles.infoSection}>
                {nextVacation && (
                    <View style={styles.mainCard}>
                        <Text style={styles.cardInfoLabel}>PRÓXIMAS VACACIONES</Text>
                        <Text style={styles.cardInfoValue}>
                            {nextVacation.start_date <= new Date().toISOString().split('T')[0]
                                ? `En curso (hasta ${new Date(nextVacation.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
                                : new Date(nextVacation.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                )}

                <View style={styles.smallCardsRow}>
                    <View style={styles.smallCard}>
                        <Text style={styles.smallLabel}>HORAS HOY</Text>
                        <Text style={styles.smallValue}>{todayHours}<Text style={styles.smallUnit}> HRS</Text></Text>
                    </View>
                    <View style={styles.smallCard}>
                        <Text style={styles.smallLabel}>VACACIONES</Text>
                        <Text style={styles.smallValue}>{vacationDays}<Text style={styles.smallUnit}> DÍAS</Text></Text>
                    </View>
                    <View style={styles.smallCard}>
                        <Text style={styles.smallLabel}>DÍAS LIBRES</Text>
                        <Text style={styles.smallValue}>{personalDays}<Text style={styles.smallUnit}> DÍAS</Text></Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        alignItems: 'center',
    },
    branding: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    logo: {
        height: 30,
        width: 130,
    },
    companyName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -1,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    statusStrip: {
        backgroundColor: '#3b51a3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 15,
    },
    dateText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 1,
    },
    divider: {
        width: 1,
        height: 15,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    objectiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    objectiveText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    timerSection: {
        backgroundColor: '#1e293b',
        paddingVertical: 30,
        alignItems: 'center',
    },
    statusLabel: {
        color: '#3b60c1',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 5,
    },
    timerLarge: {
        color: '#fff',
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: -2,
        marginBottom: 20,
    },
    actionButton: {
        width: '85%',
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 15,
    },
    btnStart: {
        backgroundColor: '#3b60c1',
    },
    btnStop: {
        backgroundColor: '#f0114b',
    },
    btnIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    geoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    geoText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    infoSection: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        padding: 15,
    },
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardInfoLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },
    cardInfoValue: {
        color: '#1e293b',
        fontSize: 22,
        fontWeight: '900',
    },
    smallCardsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    smallCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    smallLabel: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    smallValue: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: '900',
    },
    smallUnit: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '700',
    }
});
