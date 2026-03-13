import { Tabs, useRouter } from 'expo-router';
import { Platform, Alert, View } from 'react-native';
import { Home, Clock, Calendar, LogOut } from 'lucide-react-native';
import { getSupabase } from '../../lib/supabase';

export default function TabsLayout() {
    const router = useRouter();

    const handleLogout = () => {
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

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#101827',
                        borderTopWidth: 0,
                        height: 75,
                        paddingBottom: 20,
                        paddingTop: 10,
                    },
                    tabBarActiveTintColor: '#3b60c1',
                    tabBarInactiveTintColor: '#64748b',
                    tabBarLabelStyle: {
                        fontWeight: '900',
                        fontSize: 10,
                        marginTop: 4,
                        textTransform: 'uppercase',
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'INICIO',
                        tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'FICHAJES',
                        tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="time-off"
                    options={{
                        title: 'DÍAS',
                        tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="logout-tab"
                    options={{
                        title: 'CERRAR SESIÓN',
                        tabBarIcon: ({ color }) => <LogOut size={24} color={color} />,
                    }}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault();
                            handleLogout();
                        },
                    }}
                />
            </Tabs>
            {/* Pie de página debajo del menú */}
            <View style={{ height: 50, backgroundColor: '#000', width: '100%' }} />
        </View>
    );
}
