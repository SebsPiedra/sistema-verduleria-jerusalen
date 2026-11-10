import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import { pruebaLocalNotificacion, registrarDispositivoNotificaciones } from '../services/notificaciones';

export default function SeguridadScreen() {
  const [activo, setActivo] = useState(true);
  const [sandbox, setSandbox] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyPush, setBusyPush] = useState(false);
  const [mensajePush, setMensajePush] = useState('');

  const cargar = async () => {
    const respuesta = await api.get('/auth/2fa/estado');
    setActivo(Boolean(respuesta.data?.activo));
    setSandbox(Boolean(respuesta.data?.sandbox));
  };

  useEffect(() => { void cargar().catch(() => setMensaje('No se pudo consultar la configuración.')); }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const confirmarRecepcion = (evento: Event) => {
      const detalle = (evento as CustomEvent<{ titulo?: string }>).detail;
      setMensajePush(`Recibida desde Firebase: ${detalle?.titulo || 'notificación nueva'}.`);
    };
    window.addEventListener('verduleria:notificacion-recibida', confirmarRecepcion);
    return () => window.removeEventListener('verduleria:notificacion-recibida', confirmarRecepcion);
  }, []);

  const preparar = async () => {
    try {
      setBusy(true); setMensaje('');
      const respuesta = await api.post('/auth/2fa/preparar');
      setCodigoEnviado(true);
      setMensaje(respuesta.data?.mensaje || 'Revise su correo e ingrese el código de seis dígitos.');
    } catch (error: any) {
      setMensaje(error?.response?.data?.mensaje || 'No se pudo preparar 2FA.');
    } finally { setBusy(false); }
  };

  const activar = async () => {
    try {
      setBusy(true);
      const respuesta = await api.post('/auth/2fa/activar', { codigo });
      setMensaje(respuesta.data.mensaje);
      setActivo(true); setCodigo('');
      setCodigoEnviado(false);
      Alert.alert('2FA activado', 'En los próximos ingresos recibirá un código temporal por correo.');
    } catch (error: any) {
      setMensaje(error?.response?.data?.mensaje || 'No se pudo activar 2FA.');
    } finally { setBusy(false); }
  };

  const registrarPush = async () => {
    try {
      setBusyPush(true); setMensaje('');
      setMensajePush('Activando notificaciones y registrando este navegador...');
      const resultado = await registrarDispositivoNotificaciones(true);
      if (resultado.registrado) setMensajePush('Listo: este dispositivo quedó registrado. Ya puede usar las pruebas de Firebase.');
      else if (resultado.motivo === 'navegador_no_compatible') setMensajePush('Este navegador no admite Firebase Web Push. Use una versión reciente de Chrome o Edge.');
      else if (resultado.motivo === 'requiere_interaccion') setMensajePush('Chrome todavía espera autorización. Revise el permiso de notificaciones y presione nuevamente.');
      else if (resultado.motivo === 'simulador') setMensajePush('Para registrar Firebase debe usar un teléfono físico.');
      else if (resultado.motivo === 'permiso') setMensajePush('Las notificaciones están bloqueadas. Permítalas desde el icono situado junto a la dirección y recargue la página.');
      else setMensajePush('No fue posible registrar este dispositivo. Recargue la página e inténtelo nuevamente.');
    } catch (error: any) {
      setMensajePush(error?.response?.data?.mensaje || error?.message || 'No se pudo registrar el dispositivo.');
    } finally { setBusyPush(false); }
  };

  const probarLocal = async (tipo: 'pedido' | 'stock') => {
    try {
      setBusyPush(true); setMensaje('');
      await pruebaLocalNotificacion(tipo);
      setMensajePush(`Prueba local de ${tipo === 'pedido' ? 'pedido' : 'stock bajo'} mostrada por el navegador.`);
    } catch (error: any) {
      setMensaje(error?.message || 'No se pudo mostrar la prueba local.');
    } finally { setBusyPush(false); }
  };

  const probarFirebase = async (tipo: 'pedido' | 'stock') => {
    try {
      setBusyPush(true); setMensaje('');
      const respuesta = await api.post('/notificaciones/prueba', { tipo });
      setMensajePush(`${respuesta.data?.mensaje || 'Notificación remota enviada.'} Esperando recepción en este navegador...`);
    } catch (error: any) {
      setMensaje(error?.response?.data?.mensaje || 'No se pudo enviar la prueba remota de Firebase.');
    } finally { setBusyPush(false); }
  };

  return <AdminLayout titulo="Seguridad">
    <View style={s.page}>
      <Text style={s.heading}>Seguridad de la cuenta</Text>
      <Text style={s.lead}>El correo se verifica al crear la cuenta, después de cambiar la contraseña o tras 15 días sin ingresar.</Text>
      {sandbox ? <View style={s.warning}><Text style={s.warningText}>Esta es una cuenta sandbox de solo lectura.</Text></View> : null}
      {mensaje ? <View style={s.notice}><Text style={s.noticeText}>{mensaje}</Text></View> : null}

      <View style={s.card}>
        <View style={s.row}><View style={{flex:1}}><Text style={s.title}>Autenticación de dos factores</Text><Text style={s.body}>Estado: {activo ? 'Activa' : 'Inactiva'}</Text></View><View style={[s.status, activo && s.statusOn]}><Text style={s.statusText}>{activo ? 'ACTIVA' : 'INACTIVA'}</Text></View></View>
        {!activo && !codigoEnviado ? <Pressable style={s.primary} disabled={busy} onPress={preparar}><Text style={s.primaryText}>Enviar código de activación al correo</Text></Pressable> : null}

        {!activo && codigoEnviado ? <View style={s.setup}>
          <Text style={s.body}>Revise la bandeja de entrada del correo administrativo. El código vence en 10 minutos y funciona una sola vez.</Text>
          <TextInput style={s.input} placeholder="Código de seis dígitos" keyboardType="number-pad" value={codigo} onChangeText={(v)=>setCodigo(v.replace(/\D/g,'').slice(0,6))} />
          <Pressable style={s.primary} disabled={busy || codigo.length !== 6} onPress={activar}><Text style={s.primaryText}>Confirmar y activar</Text></Pressable>
          <Pressable style={s.secondary} disabled={busy} onPress={preparar}><Text style={s.secondaryText}>Enviar un código nuevo</Text></Pressable>
        </View> : null}

        {activo ? <View style={s.setup}><Text style={s.body}>Después de una verificación correcta, los accesos habituales durante los siguientes 15 días solo requieren correo y contraseña. El plazo se renueva con cada ingreso.</Text></View> : null}
      </View>

      <View style={s.card}>
        <View><Text style={s.title}>Notificaciones importantes</Text><Text style={s.body}>Firebase avisará sobre pedidos nuevos, cambios de estado, stock bajo o agotado y pérdidas importantes por desechos.</Text></View>
        {mensajePush ? <View style={s.pushNotice}><Text style={s.pushNoticeText}>{mensajePush}</Text></View> : null}
        <Pressable accessibilityRole="button" style={s.primary} disabled={busyPush} onPress={registrarPush}><Text style={s.primaryText}>{busyPush ? 'Registrando dispositivo...' : 'Activar notificaciones en este dispositivo'}</Text></Pressable>
        <View style={s.pushGrid}>
          <Pressable accessibilityRole="button" style={s.secondary} disabled={busyPush} onPress={()=>void probarLocal('pedido')}><Text style={s.secondaryText}>Prueba local: pedido</Text></Pressable>
          <Pressable accessibilityRole="button" style={s.secondary} disabled={busyPush} onPress={()=>void probarLocal('stock')}><Text style={s.secondaryText}>Prueba local: stock</Text></Pressable>
          <Pressable accessibilityRole="button" style={s.primary} disabled={busyPush} onPress={()=>void probarFirebase('pedido')}><Text style={s.primaryText}>Firebase: pedido nuevo</Text></Pressable>
          <Pressable accessibilityRole="button" style={s.primary} disabled={busyPush} onPress={()=>void probarFirebase('stock')}><Text style={s.primaryText}>Firebase: stock bajo</Text></Pressable>
        </View>
        <Text style={s.help}>Las pruebas están habilitadas en el sandbox porque no cambian información del negocio. La prueba local demuestra los permisos; los botones Firebase comprueban el envío real desde el servidor.</Text>
      </View>
    </View>
  </AdminLayout>;
}

const s=StyleSheet.create({
  page:{gap:18},heading:{fontSize:30,fontWeight:'800',color:'#123f42'},lead:{fontSize:16,color:'#557276'},card:{backgroundColor:'#fff',borderRadius:18,padding:22,borderWidth:1,borderColor:'#d6e5e5',gap:18,maxWidth:820},row:{flexDirection:'row',alignItems:'center',gap:16},title:{fontSize:20,fontWeight:'800',color:'#123f42',marginBottom:5},body:{fontSize:14,color:'#5c7275',lineHeight:21},status:{paddingHorizontal:12,paddingVertical:7,borderRadius:20,backgroundColor:'#f3d9d9'},statusOn:{backgroundColor:'#d8f2e6'},statusText:{fontSize:11,fontWeight:'800',color:'#164b47'},primary:{backgroundColor:'#087f73',padding:14,borderRadius:12,alignItems:'center',flex:1},secondary:{backgroundColor:'#e7f1f0',padding:13,borderRadius:12,alignItems:'center',flex:1},secondaryText:{color:'#087f73',fontWeight:'800'},danger:{backgroundColor:'#b33232',padding:14,borderRadius:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'800'},setup:{gap:13},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#bad0d0',borderRadius:12,padding:13,fontSize:16},notice:{backgroundColor:'#e8f4f1',padding:13,borderRadius:12,maxWidth:820},noticeText:{color:'#124d47',fontWeight:'700'},warning:{backgroundColor:'#fff0cf',padding:13,borderRadius:12,maxWidth:820},warningText:{color:'#6d4700',fontWeight:'700'},pushNotice:{backgroundColor:'#e8f4f1',borderWidth:1,borderColor:'#b7d9d4',padding:12,borderRadius:10},pushNoticeText:{color:'#124d47',fontWeight:'700'},pushGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},help:{fontSize:12,color:'#687f82',lineHeight:18}
});
