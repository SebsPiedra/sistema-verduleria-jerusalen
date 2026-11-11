import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import WebPolish from '../components/WebPolish';

export default function RootLayout() {
  const router = useRouter();
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const pantalla = respuesta.notification.request.content.data?.pantalla;
      if (typeof pantalla === 'string' && pantalla.startsWith('/')) router.push(pantalla as any);
    });
    return () => subscription.remove();
  }, [router]);
  if(!mounted)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#eef4f5'}}><ActivityIndicator color="#08736a" accessibilityLabel="Cargando aplicación"/></View>;
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <WebPolish/>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
