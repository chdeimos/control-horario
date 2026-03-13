import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { getSupabase, initSupabase } from '../../lib/supabase';
import { Clock, AlertCircle, ChevronRight, MapPin, Calendar, History, Pencil, X, Check, ArrowRight } from 'lucide-react-native';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistoryTab() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [company, setCompany] = useState(null);
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);

    // Edit Modal State
    const [editingEntry, setEditingEntry] = useState(null);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    // Date Strip (last 30 days + today = 31 items)
    const dates = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date()
    }).reverse();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = getSupabase() || await initSupabase();
            if (!supabase) return;

            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;
            setUser(currentUser);

            // Fetch concurrently but pass currentUser directly to avoid race conditions
            await Promise.all([
                fetchBrandingData(supabase, currentUser),
                fetchHistoryData(supabase, currentUser)
            ]);
        } catch (error) {
            console.error("Error loading history data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const fetchBrandingData = async (supabase, currentUser) => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profileData) {
            setProfile(profileData);
            if (profileData.company_id) {
                const { data: compData } = await supabase
                    .from('companies')
                    .select('name, logo_app_url, logo_web_url')
                    .eq('id', profileData.company_id)
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
        }
    };

    const fetchHistoryData = async (supabase, currentUser) => {
        const start = startOfDay(selectedDate).toISOString();
        const end = endOfDay(selectedDate).toISOString();

        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', currentUser.id)
            .gte('clock_in', start)
            .lte('clock_in', end)
            .order('clock_in', { ascending: false });

        if (error) {
            console.error("Fetch History Error:", error);
            setEntries([]);
        } else {
            // Unscheduled day incidents filtered out
            const filtered = (data || []).filter(e => e.incident_type !== 'unscheduled_day');
            setEntries(filtered);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleSaveAdjustment = async () => {
        if (!reason.trim()) {
            Alert.alert("Aviso", "Por favor, indica un motivo para la corrección.");
            return;
        }

        setSaving(true);
        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('time_entries')
                .update({
                    correction_reason: reason,
                    is_manual_correction: true,
                    // No marcar como auditado automáticamente
                })
                .eq('id', editingEntry.id);

            if (error) {
                Alert.alert("Error", error.message);
            } else {
                Alert.alert("Éxito", "Justificación enviada correctamente.");
                setEditingEntry(null);
                setReason("");
                loadData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '---';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        if (diff <= 0) return '---';
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const renderItem = ({ item }) => {
        const isIncident = item.incident_type && item.incident_type !== 'none';

        return (
            <View style={styles.entryCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.timeGroup}>
                        <Clock size={16} color="#64748b" />
                        <Text style={styles.timeText}>
                            {format(new Date(item.clock_in), 'HH:mm')}
                            {item.clock_out ? ` — ${format(new Date(item.clock_out), 'HH:mm')}` : ' — Activo'}
                        </Text>
                    </View>
                    {isIncident && (
                        <View style={[styles.incidentBadge, item.is_audited && styles.auditedBadge]}>
                            <AlertCircle size={12} color={item.is_audited ? "#10b981" : "#ef4444"} />
                            <Text style={[styles.incidentText, item.is_audited && styles.auditedText]}>
                                {item.is_audited ? "REVISADO" : "INCIDENCIA"}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <History size={14} color="#94a3b8" />
                            <Text style={styles.infoLabel}>DURACIÓN</Text>
                            <Text style={styles.infoValue}>
                                {calculateDuration(item.clock_in, item.clock_out)}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MapPin size={14} color="#94a3b8" />
                            <Text style={styles.infoLabel}>ORIGEN</Text>
                            <Text style={styles.infoValue}>{item.origin === 'mobile' ? 'Móvil' : 'Web'}</Text>
                        </View>
                    </View>

                    {item.correction_reason && (
                        <View style={styles.justificationBox}>
                            <Text style={styles.justificationTitle}>TU JUSTIFICACIÓN:</Text>
                            <Text style={styles.justificationText}>{item.correction_reason}</Text>
                        </View>
                    )}

                    {isIncident && !item.is_audited && !item.correction_reason && (
                        <TouchableOpacity
                            style={styles.justifyButton}
                            onPress={() => {
                                setEditingEntry(item);
                                setReason("");
                            }}
                        >
                            <Pencil size={14} color="#3b60c1" />
                            <Text style={styles.justifyButtonText}>JUSTIFICAR INCIDENCIA</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

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

            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Mis Fichajes</Text>
                <Text style={styles.pageSubtitle}>Historial de registros y jornadas</Text>
            </View>

            {/* Date Picker Strip */}
            <View style={styles.dateStripContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
                    {dates.map((date, idx) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                                onPress={() => setSelectedDate(date)}
                            >
                                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                                    {format(date, 'EEE', { locale: es })}
                                </Text>
                                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                                    {format(date, 'd')}
                                </Text>
                                {isToday && !isSelected && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3b60c1" />
                </View>
            ) : (
                <FlatList
                    data={entries}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b60c1']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <History size={48} color="#cbd5e1" strokeWidth={1} />
                            <Text style={styles.emptyText}>No hay registros para este día</Text>
                        </View>
                    }
                />
            )}

            {/* Justify Modal */}
            <Modal visible={!!editingEntry} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Justificar Incidencia</Text>
                            <TouchableOpacity onPress={() => setEditingEntry(null)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalLabel}>MOTIVO DE LA CORRECCIÓN</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Indica por qué ha habido esta incidencia (ej: fallo GPS, olvido de fichaje...)"
                                multiline
                                numberOfLines={4}
                                value={reason}
                                onChangeText={setReason}
                            />
                            <Text style={styles.modalInfo}>Esta justificación será revisada por tu gestor para auditar el fichaje.</Text>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setEditingEntry(null)}
                            >
                                <Text style={styles.cancelText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSaveAdjustment}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                                    <>
                                        <Text style={styles.saveText}>ENVIAR</Text>
                                        <ArrowRight size={16} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    branding: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    logo: { height: 30, width: 130 },
    companyName: { fontSize: 22, fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
    titleSection: { padding: 20, backgroundColor: '#fff' },
    pageTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
    pageSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    dateStripContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dateStrip: { paddingHorizontal: 15, paddingBottom: 15 },
    dateItem: { width: 50, height: 70, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginRight: 8, backgroundColor: '#f8fafc' },
    dateItemSelected: { backgroundColor: '#3b60c1' },
    dateDay: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
    dateDaySelected: { color: '#bfdbfe' },
    dateNum: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    dateNumSelected: { color: '#fff' },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3b60c1', marginTop: 4 },
    list: { padding: 15 },
    entryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    timeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeText: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
    incidentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
    incidentText: { fontSize: 10, fontWeight: '900', color: '#ef4444' },
    auditedBadge: { backgroundColor: '#f0fdf4' },
    auditedText: { color: '#10b981' },
    cardBody: { gap: 12 },
    infoRow: { flexDirection: 'row', gap: 20 },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 8, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
    infoValue: { fontSize: 13, fontWeight: '700', color: '#475569' },
    justificationBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#cbd5e1' },
    justificationTitle: { fontSize: 8, fontWeight: '900', color: '#64748b', marginBottom: 2 },
    justificationText: { fontSize: 11, color: '#1e293b', fontWeight: '600' },
    justifyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 10, borderRadius: 10 },
    justifyButtonText: { fontSize: 11, fontWeight: '900', color: '#3b60c1' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 50, gap: 15 },
    emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    modalBody: { gap: 10 },
    modalLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
    textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, fontSize: 14, color: '#1e293b', textAlignVertical: 'top' },
    modalInfo: { fontSize: 11, color: '#64748b', fontStyle: 'italic' },
    modalFooter: { flexDirection: 'row', gap: 10, marginTop: 20 },
    cancelButton: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' },
    cancelText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
    saveButton: { flex: 2, height: 48, backgroundColor: '#3b60c1', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveButtonDisabled: { opacity: 0.6 },
    saveText: { color: '#fff', fontSize: 12, fontWeight: '900' }
});
