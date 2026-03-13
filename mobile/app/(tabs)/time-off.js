import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal, TextInput, Alert, ScrollView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase } from '../../lib/supabase';
import { Palmtree, Calendar, Info, Clock, CheckCircle2, XCircle, Timer, Plus, X, ArrowRight, Briefcase } from 'lucide-react-native';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TimeOffTab() {
    const [profile, setProfile] = useState(null);
    const [company, setCompany] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balances, setBalances] = useState({ vacation: 0, personal: 0, totalVacation: 30, totalPersonal: 5 });
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Request Modal State
    const [showModal, setShowModal] = useState(false);
    const [requestType, setRequestType] = useState('vacation');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    // DateTimePicker visibility
    const [showPicker, setShowPicker] = useState(null); // 'start' | 'end' | null

    const windowWidth = Dimensions.get('window').width;

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const supabase = getSupabase() || await initSupabase();
            if (!supabase) return;

            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) {
                console.log("No session found in TimeOffTab");
                return;
            }
            setUser(currentUser);

            // 1. Fetch Profile
            const { data: profData, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (profError) throw profError;

            if (profData) {
                setProfile(profData);

                // 2. Fetch Company branding
                if (profData.company_id) {
                    const { data: compData } = await supabase
                        .from('companies')
                        .select('name, logo_app_url, logo_web_url')
                        .eq('id', profData.company_id)
                        .maybeSingle();

                    if (compData) {
                        let finalLogo = compData.logo_app_url || compData.logo_web_url;
                        if (finalLogo) {
                            try {
                                const sbUrl = await SecureStore.getItemAsync('supabase_url');
                                if (sbUrl && (finalLogo.includes('127.0.0.1') || finalLogo.includes('localhost'))) {
                                    finalLogo = finalLogo.replace(/http:\/\/(127\.0\.0\.1|localhost):54321/g, sbUrl);
                                }
                            } catch (e) { }
                        }
                        setCompany({ ...compData, logo_url: finalLogo });
                    }
                }

                // 3. Fetch Requests
                const { data: reqs } = await supabase
                    .from('time_off_requests')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false });

                const currentReqs = reqs || [];
                setRequests(currentReqs);

                // 4. Calculate Balances
                const totalVac = profData.total_vacation_days ?? 30;
                const totalPers = profData.total_personal_days ?? 5;

                let usedVacation = 0;
                let usedPersonal = 0;

                currentReqs.forEach(r => {
                    if (r.status === 'approved') {
                        try {
                            const startDay = parseISO(r.start_date);
                            const endDay = parseISO(r.end_date);
                            const days = Math.ceil(Math.abs(endDay - startDay) / (1000 * 60 * 60 * 24)) + 1;
                            if (r.request_type === 'vacation') usedVacation += days;
                            else if (r.request_type === 'personal') usedPersonal += days;
                        } catch (e) {
                            console.error("Error parsing dates for request:", r.id, e);
                        }
                    }
                });

                setBalances({
                    vacation: totalVac - usedVacation,
                    personal: totalPers - usedPersonal,
                    totalVacation: totalVac,
                    totalPersonal: totalPers
                });
            }
        } catch (error) {
            console.error("Error loading time-off data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData(true);
    };

    const handleSubmitRequest = async () => {
        if (!user || !user.id) {
            Alert.alert("Error", "Sesión no encontrada. Por favor, reinicia la app.");
            return;
        }

        const today = startOfDay(new Date());
        const start = startOfDay(startDate);
        const end = startOfDay(endDate);

        if (isBefore(start, today)) {
            Alert.alert("Error", "No se pueden solicitar días en fechas pasadas.");
            return;
        }

        if (isBefore(end, start)) {
            Alert.alert("Error", "La fecha de fin no puede ser anterior a la de inicio.");
            return;
        }

        const diffTime = Math.abs(end - start);
        const newDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const limitValue = requestType === 'vacation' ? balances.vacation : requestType === 'personal' ? balances.personal : 999;

        if (newDays > limitValue && (requestType === 'vacation' || requestType === 'personal')) {
            Alert.alert("Saldo insuficiente", `Tienes ${limitValue} días disponibles y solicitas ${newDays}.`);
            return;
        }

        setSaving(true);
        try {
            const supabase = getSupabase();
            if (!supabase) throw new Error("Supabase client not initialized");

            // Overlap check
            const { data: existing } = await supabase
                .from('time_off_requests')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'rejected');

            const startDateStr = format(start, 'yyyy-MM-dd');
            const endDateStr = format(end, 'yyyy-MM-dd');

            const hasConflict = existing?.some(req => {
                return startDateStr <= req.end_date && endDateStr >= req.start_date;
            });

            if (hasConflict) {
                Alert.alert("Conflicto de fechas", "Ya existe una solicitud pendiente o aprobada para esas fechas.");
                setSaving(false);
                return;
            }

            const { error } = await supabase.from('time_off_requests').insert({
                user_id: user.id,
                company_id: profile?.company_id,
                request_type: requestType,
                start_date: startDateStr,
                end_date: endDateStr,
                reason: reason,
                status: 'pending'
            });

            if (error) {
                Alert.alert("Error", error.message);
            } else {
                Alert.alert("Éxito", "Solicitud enviada correctamente");
                setShowModal(false);
                setStartDate(new Date());
                setEndDate(new Date());
                setReason("");
                loadData();
            }
        } catch (err) {
            console.error("Submit Error:", err);
            Alert.alert("Error", "No se pudo enviar la solicitud. Intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowPicker(null);
        }
        if (selectedDate) {
            if (showPicker === 'start') {
                setStartDate(selectedDate);
                if (isBefore(endDate, selectedDate)) {
                    setEndDate(selectedDate);
                }
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return { color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle2 size={12} color="#10b981" />, label: 'APROBADA' };
            case 'rejected': return { color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={12} color="#ef4444" />, label: 'RECHAZADA' };
            default: return { color: '#f59e0b', bg: '#fffbeb', icon: <Timer size={12} color="#f59e0b" />, label: 'PENDIENTE' };
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'vacation': return 'VACACIONES';
            case 'personal': return 'ASUNTOS PROPIOS';
            case 'medical': return 'BAJA MÉDICA';
            case 'other': return 'OTROS';
            default: return 'DESCONOCIDO';
        }
    };

    const renderEntry = ({ item }) => {
        const sStyle = getStatusStyle(item.status);
        let startD, endD;
        try {
            startD = parseISO(item.start_date);
            endD = parseISO(item.end_date);
        } catch (e) {
            return null;
        }
        const diffD = Math.ceil(Math.abs(endD - startD) / (1000 * 60 * 60 * 24)) + 1;

        return (
            <View style={[styles.card, item.status === 'rejected' && styles.cardRejected]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardType}>{getTypeLabel(item.request_type)}</Text>
                        <Text style={styles.cardDates}>
                            {format(startD, 'dd-MM-yyyy')} — {format(endD, 'dd-MM-yyyy')}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sStyle.bg }]}>
                        {sStyle.icon}
                        <Text style={[styles.statusText, { color: sStyle.color }]}>{sStyle.label}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerDetail}>
                        <Clock size={12} color="#94a3b8" />
                        <Text style={styles.footerText}>{diffD} {diffD === 1 ? 'DÍA' : 'DÍAS'}</Text>
                    </View>
                    {item.reason && (
                        <View style={styles.reasonBox}>
                            <Info size={12} color="#94a3b8" />
                            <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
                        </View>
                    )}
                </View>
                {item.manager_note && (
                    <View style={styles.managerNote}>
                        <Text style={styles.noteTitle}>NOTA DEL GESTOR:</Text>
                        <Text style={styles.noteText}>{item.manager_note}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading && !isInitialized) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3b60c1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header Branded */}
            <View style={styles.header}>
                <View style={styles.branding}>
                    {company?.logo_url ? (
                        <Image source={{ uri: company.logo_url }} style={styles.logo} resizeMode="contain" />
                    ) : (
                        <Text style={styles.companyName}>{company?.name || 'CONTROLPRO'}</Text>
                    )}
                </View>
            </View>

            {/* Titulo y Balances */}
            <View style={styles.topSection}>
                <View>
                    <Text style={styles.title}>Días Libres</Text>
                    <Text style={styles.subtitle}>Gestiona tus vacaciones y ausencias</Text>
                </View>

                <View style={styles.balanceGrid}>
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>VACACIONES</Text>
                        <Text style={styles.balanceValue}>{balances.vacation}<Text style={styles.balanceUnit}> / {balances.totalVacation}</Text></Text>
                    </View>
                    <View style={styles.balanceCard}>
                        <Text style={styles.balanceLabel}>P. PROPIOS</Text>
                        <Text style={styles.balanceValue}>{balances.personal}<Text style={styles.balanceUnit}> / {balances.totalPersonal}</Text></Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => setShowModal(true)}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.requestButtonText}>SOLICITAR DÍAS</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={requests}
                renderItem={renderEntry}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3b60c1']} />
                }
                ListHeaderComponent={() => (
                    <Text style={styles.listTitle}>MIS SOLICITUDES</Text>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Palmtree size={48} color="#cbd5e1" strokeWidth={1} />
                        <Text style={styles.emptyText}>No hay solicitudes registradas</Text>
                    </View>
                }
            />

            {/* Modal de Solicitud (Full Screen) */}
            <Modal
                visible={showModal}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <SafeAreaView style={styles.modalFullContainer}>
                    <View style={styles.modalHeaderFullScreen}>
                        <View>
                            <Text style={styles.modalTitle}>Nueva Solicitud</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeModalButton}>
                            <X size={28} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBodyFullScreen} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>TIPO DE AUSENCIA</Text>
                            <View style={styles.typeSelectorGrid}>
                                {[
                                    { id: 'vacation', label: 'VACACIONES', icon: <Palmtree size={18} color={requestType === 'vacation' ? '#fff' : '#64748b'} /> },
                                    { id: 'personal', label: 'PROPIOS', icon: <Calendar size={18} color={requestType === 'personal' ? '#fff' : '#64748b'} /> },
                                    { id: 'medical', label: 'MÉDICA', icon: <Briefcase size={18} color={requestType === 'medical' ? '#fff' : '#64748b'} /> },
                                    { id: 'other', label: 'OTROS', icon: <Plus size={18} color={requestType === 'other' ? '#fff' : '#64748b'} /> }
                                ].map(type => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[styles.typeOptionGrid, requestType === type.id && styles.typeSelected]}
                                        onPress={() => setRequestType(type.id)}
                                    >
                                        {type.icon}
                                        <Text style={[styles.typeLabelGrid, requestType === type.id && styles.typeLabelSelected]}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.dateRowFullScreen}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>DESDE</Text>
                                <TouchableOpacity
                                    style={styles.dateInputLarge}
                                    onPress={() => setShowPicker('start')}
                                >
                                    <View>
                                        <Text style={styles.dateInputTextLarge}>{format(startDate, 'dd-MM-yyyy')}</Text>
                                        <Text style={styles.dateInputSubtext}>Fecha de inicio</Text>
                                    </View>
                                    <Calendar size={20} color="#3b60c1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.dateRowFullScreen}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>HASTA</Text>
                                <TouchableOpacity
                                    style={styles.dateInputLarge}
                                    onPress={() => setShowPicker('end')}
                                >
                                    <View>
                                        <Text style={styles.dateInputTextLarge}>{format(endDate, 'dd-MM-yyyy')}</Text>
                                        <Text style={styles.dateInputSubtext}>Fecha de fin</Text>
                                    </View>
                                    <Calendar size={20} color="#3b60c1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>MOTIVO / COMENTARIO (OPCIONAL)</Text>
                            <TextInput
                                style={styles.textAreaLarge}
                                placeholder="Escribe aquí el motivo o cualquier observación importante para la empresa..."
                                multiline
                                numberOfLines={5}
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>

                        {/* Summary Info */}
                        <View style={styles.requestSummary}>
                            <Info size={16} color="#3b60c1" />
                            <Text style={styles.summaryText}>
                                Solicitando {Math.ceil(Math.abs(startOfDay(endDate) - startOfDay(startDate)) / (1000 * 60 * 60 * 24)) + 1} días de {getTypeLabel(requestType).toLowerCase()}.
                            </Text>
                        </View>
                    </ScrollView>

                    {showPicker && (
                        <DateTimePicker
                            value={showPicker === 'start' ? startDate : endDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            minimumDate={showPicker === 'end' ? startDate : new Date()}
                        />
                    )}

                    <View style={styles.modalFooterFullScreen}>
                        <TouchableOpacity
                            style={[styles.saveButtonLarge, saving && styles.saveButtonDisabled]}
                            onPress={handleSubmitRequest}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.saveButtonTextLarge}>SOLICITAR DÍAS</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
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
    topSection: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    balanceGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    balanceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 6,
    },
    balanceValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
    },
    balanceUnit: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
    },
    requestButton: {
        height: 56,
        backgroundColor: '#3b60c1',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#3b60c1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    listTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardRejected: {
        borderColor: '#fee2e2',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardType: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardDates: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1e293b',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    footerDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
    },
    reasonBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    reasonText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        fontStyle: 'italic',
    },
    managerNote: {
        marginTop: 12,
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#cbd5e1',
    },
    noteTitle: {
        fontSize: 8,
        fontWeight: '900',
        color: '#64748b',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 11,
        color: '#1e293b',
        fontWeight: '600',
    },
    // Full Screen Modal Styles
    modalFullContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeaderFullScreen: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    closeModalButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    modalBodyFullScreen: {
        padding: 20,
        paddingTop: 10,
    },
    inputGroup: {
        marginBottom: 24,
    },
    typeSelectorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeOptionGrid: {
        width: '48%',
        height: 60,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typeSelected: {
        backgroundColor: '#3b60c1',
        borderColor: '#3b60c1',
        shadowColor: '#3b60c1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    typeLabelGrid: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    typeLabelSelected: {
        color: '#fff',
        fontWeight: '900',
    },
    dateInputTextLarge: {
        fontSize: 18,
        color: '#1e293b',
        fontWeight: '900',
    },
    dateInputSubtext: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        marginTop: 2,
    },
    dateInputLarge: {
        height: 70,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textAreaLarge: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        padding: 20,
        fontSize: 15,
        color: '#1e293b',
        minHeight: 140,
        textAlignVertical: 'top',
        fontWeight: '500',
        lineHeight: 22,
    },
    requestSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    summaryText: {
        fontSize: 13,
        color: '#3b60c1',
        fontWeight: '700',
    },
    modalFooterFullScreen: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    saveButtonLarge: {
        height: 64,
        backgroundColor: '#3b60c1',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    saveButtonTextLarge: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    }
});
