import { useCallback, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { obtenerDato, eliminarDato } from '../services/storage';
import { registrarDispositivoNotificaciones } from '../services/notificaciones';

const enlaces = [
  ['Inicio', '/cliente-home'],
  ['Catálogo', '/catalogo'],
  ['Mis pedidos', '/cliente-mis-pedidos'],
  ['Carrito', '/cliente-pedido'],
] as const;

export default function ClientHeader() {
  const router = useRouter();
  const path = usePathname();
  const phone = useWindowDimensions().width < 768;
  const [signed, setSigned] = useState(false);
  const [nombre, setNombre] = useState('');
  const [carritoCantidad, setCarritoCantidad] = useState(0);

  useFocusEffect(useCallback(() => {
    let alive = true;
    void (async () => {
      const [token, clienteRaw, carritoRaw] = await Promise.all([
        obtenerDato('token_cliente'), obtenerDato('cliente'), obtenerDato('carrito_cliente'),
      ]);
      if (!alive) return;
      setSigned(!!token);
      if (token) void registrarDispositivoNotificaciones().catch(() => undefined);
      try { setNombre(clienteRaw ? String(JSON.parse(clienteRaw)?.nombre || '').split(' ')[0] : ''); } catch { setNombre(''); }
      try {
        const items = carritoRaw ? JSON.parse(carritoRaw) : [];
        setCarritoCantidad(Array.isArray(items) ? items.reduce((s: number, i: any) => s + Number(i.cantidad || 0), 0) : 0);
      } catch { setCarritoCantidad(0); }
    })();
    return () => { alive = false; };
  }, []));

  const logout = async () => {
    await Promise.all(['token_cliente', 'cliente', 'carrito', 'carrito_cliente'].map(eliminarDato));
    setSigned(false); router.replace('/');
  };
  const navegar = (url: string) => {
    if (!signed && url.includes('pedido')) router.push('/' as any);
    else router.push(url as any);
  };

  return <View style={{ backgroundColor: '#fffdf7', borderBottomWidth: 1, borderColor: '#e2e9df', zIndex: 20 }}>
    <View style={{ width: '100%', maxWidth: 1440, alignSelf: 'center', paddingHorizontal: phone ? 16 : 30, paddingVertical: phone ? 13 : 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Verdulería Jerusalén, inicio" onPress={() => router.push('/cliente-home')} style={{ minHeight: 48, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#0b5f3c', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 21, fontWeight: '900' }}>J</Text></View>
          <View><Text style={{ fontSize: phone ? 18 : 22, fontWeight: '900', color: '#0b472c', letterSpacing: -0.8 }}>Verdulería</Text><Text style={{ fontSize: phone ? 21 : 27, lineHeight: phone ? 22 : 27, fontWeight: '900', color: '#0b472c', letterSpacing: -1 }}>Jerusalén</Text></View>
        </View>
      </Pressable>
      {!phone && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}>{enlaces.map(([label, url]) => {
        const activo = path === url;
        return <Pressable key={url} accessibilityRole="button" accessibilityState={{ selected: activo }} onPress={() => navegar(url)} style={{ minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 12, backgroundColor: activo ? '#e4f4df' : 'transparent' }}><Text style={{ fontSize: 14, fontWeight: '800', color: activo ? '#075e3b' : '#314a43' }}>{label}</Text>{label === 'Carrito' && carritoCantidad > 0 && <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#ff7417', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{carritoCantidad}</Text></View>}</Pressable>;
      })}</View>}
      <Pressable accessibilityRole="button" onPress={() => signed ? void logout() : router.push('/')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#c9d8cf', borderRadius: 13, backgroundColor: '#fff' }}><Text style={{ color: '#075e3b', fontWeight: '700' }}>{signed ? `${nombre ? `Hola, ${nombre} · ` : ''}Salir` : 'Ingresar'}</Text></Pressable>
    </View>
    {phone && <View style={{ paddingHorizontal: 10, paddingBottom: 10, flexDirection: 'row', gap: 5 }}>{enlaces.map(([label, url]) => {
      const activo = path === url;
      return <Pressable key={url} accessibilityRole="button" onPress={() => navegar(url)} style={{ flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: activo ? '#0b5f3c' : '#eef5ef' }}><Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: activo ? '#fff' : '#33574a' }}>{label}</Text>{label === 'Carrito' && carritoCantidad > 0 && <View style={{ position: 'absolute', right: 6, top: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ff7417', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{carritoCantidad}</Text></View>}</Pressable>;
    })}</View>}
  </View>;
}
