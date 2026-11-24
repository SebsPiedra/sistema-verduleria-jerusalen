import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AdminLayout from '../components/AdminLayout';
import HelpText from '../components/HelpText';
import { createAppStyles } from '../theme/appStyles';
import api from '../services/api';

type Row = Record<string, any>;
type WeeklyReport = {
  inicio: string; fin: string; generado_en: string; criterio: string;
  totales: Record<string, number>;
  ventas: Row[]; detalles: Row[]; pedidos: Row[]; desechos: Row[]; gastos: Row[];
};

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const money = (cents: number) => `₡ ${(cents / 100).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ResumenSemanal() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <WeeklyScreen /> : null;
}

function WeeklyScreen() {
  const router = useRouter();
  const phone = useWindowDimensions().width < 768;
  const [fecha, setFecha] = useState(today());
  const [selected, setSelected] = useState(fecha);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState<'ventas' | 'detalles' | 'pedidos' | 'desechos' | 'gastos'>('ventas');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/resumen-semanal', { params: { fecha: selected }, timeout: 60000 });
      setReport(response.data); setError('');
    } catch (cause: any) {
      setError(cause?.response?.data?.mensaje || 'No se pudo cargar el resumen semanal.');
      if (cause?.response?.status === 401) router.replace('/');
    } finally { setLoading(false); }
  }, [router, selected]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const tables = {
    ventas: { label: 'Ventas', fields: [['fecha', 'Fecha'], ['numero_factura', 'Factura'], ['cliente', 'Cliente'], ['estado', 'Estado'], ['total', 'Total']] },
    detalles: { label: 'Productos vendidos', fields: [['producto', 'Producto'], ['cantidad', 'Cantidad'], ['subtotal', 'Venta'], ['costo', 'Costo'], ['estimado', 'Estimado']] },
    pedidos: { label: 'Pedidos', fields: [['fecha', 'Fecha'], ['cliente', 'Cliente'], ['estado', 'Estado'], ['total', 'Total']] },
    desechos: { label: 'Desechos', fields: [['fecha', 'Fecha'], ['producto', 'Producto'], ['cantidad', 'Cantidad'], ['perdida', 'Pérdida']] },
    gastos: { label: 'Gastos', fields: [['fecha', 'Fecha'], ['concepto', 'Concepto'], ['monto', 'Monto']] },
  } as const;
  const monetary = new Set(['total', 'subtotal', 'costo', 'perdida', 'monto']);
  const format = (key: string, value: any) => typeof value === 'boolean' ? (value ? 'Sí' : 'No') : monetary.has(key) ? money(Number(value || 0) * 100) : String(value ?? '—');
  const rows = report?.[tab] || [];
  const downloadPdf = async () => {
    if (!report) return;
    if (Platform.OS !== 'web' || typeof document === 'undefined') { setError('Abra la versión web para descargar el PDF.'); return; }
    try {
      setDownloading(true); setError(''); setNotice('');
      const response = await api.get('/resumen-semanal/pdf', { params: { fecha: report.inicio }, responseType: 'blob', timeout: 60000 });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `Resumen-semanal-${report.inicio}-${report.fin}.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setNotice('PDF semanal descargado con éxito.');
    } catch (cause: any) {
      setError(cause?.response?.data?.mensaje || 'No se pudo generar el PDF semanal.');
    } finally { setDownloading(false); }
  };

  return <AdminLayout titulo="Resumen semanal">
    <ScrollView contentContainerStyle={[s.content, phone && s.phone]}>
      <Text style={s.title}>Resumen por semana</Text>
      <Text style={s.muted}>Seleccione cualquier día; el sistema calculará automáticamente de lunes a domingo.</Text>
      <View style={s.row}>
        <View><Text style={s.label}>Fecha dentro de la semana</Text><TextInput accessibilityLabel="Fecha del resumen semanal" value={fecha} onChangeText={setFecha} maxLength={10} placeholder="2026-11-23" style={s.input} /></View>
        <Pressable accessibilityRole="button" style={s.button} onPress={() => {
          if (!/^20\d\d-\d\d-\d\d$/.test(fecha)) { setError('Use el formato AAAA-MM-DD.'); return; }
          if (fecha === selected) void load(); else { setReport(null); setSelected(fecha); }
        }}><Text style={s.buttonText}>Consultar semana</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator accessibilityLabel="Cargando resumen semanal" color="#075333" /> : null}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      {notice ? <Text accessibilityRole="alert" style={s.success}>{notice}</Text> : null}
      {report ? <>
        <View style={s.card}><Text style={s.heading}>Semana del {report.inicio} al {report.fin}</Text><Text style={s.muted}>Actualizado: {new Date(report.generado_en).toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })}</Text><Pressable accessibilityRole="button" accessibilityState={{ disabled: downloading }} disabled={downloading} style={[s.button, downloading && s.disabled]} onPress={() => void downloadPdf()}><Text style={s.buttonText}>{downloading ? 'Generando PDF...' : 'Descargar PDF semanal'}</Text></Pressable></View>
        <View style={s.metrics}>{([
          ['ingresos', 'Ingresos por ventas'], ['costo', 'Costo de lo vendido'], ['perdidas', 'Pérdidas por desechos'], ['gastos', 'Gastos adicionales'], ['ganancia', 'Ganancia estimada'],
        ] as const).map(([key, label]) => <View key={key} style={[s.metric, phone && s.metricPhone, key === 'ganancia' && s.profit]}><Text style={s.label}>{label}</Text><Text style={s.amount}>{money(report.totales[key])}</Text></View>)}</View>
        <Text style={s.muted}>{report.totales.ventas} ventas contabilizadas · {report.totales.pedidos} pedidos de la semana.</Text>
        <HelpText>{report.criterio}</HelpText>
        {(report.totales.costos_estimados > 0 || report.totales.sin_costo > 0 || report.totales.ventas_sin_detalle > 0) ? <View style={s.warning}><Text>Costos estimados: {report.totales.costos_estimados} · Sin costo: {report.totales.sin_costo} · Ventas sin detalle: {report.totales.ventas_sin_detalle}.</Text></View> : null}
        <View style={s.card}><Text style={s.heading}>Movimientos de la semana</Text><View style={s.row}>{Object.entries(tables).map(([key, value]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: tab === key }} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key as typeof tab)}><Text style={[s.tabText, tab === key && s.tabTextActive]}>{value.label}</Text></Pressable>)}</View>
          {!rows.length ? <Text style={s.empty}>No hay registros en esta sección durante la semana.</Text> : null}
          {rows.map((row, index) => <View key={String(row.id || row.id_venta || row.id_pedido || index)} style={[s.record, !phone && s.recordDesktop]}>{tables[tab].fields.map(([key, label]) => <View key={key} style={!phone ? s.field : undefined}><Text style={s.label}>{label}</Text><Text selectable style={s.value}>{format(key, row[key])}</Text></View>)}</View>)}
        </View>
      </> : null}
    </ScrollView>
  </AdminLayout>;
}

const s = createAppStyles({
  content:{padding:24,gap:18,backgroundColor:'#fffcf3',flexGrow:1},phone:{padding:12},title:{fontSize:27,fontWeight:'800',color:'#064c30'},muted:{color:'#5b665f',lineHeight:21},row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'flex-end'},input:{borderWidth:1,borderColor:'#b3beb5',borderRadius:8,padding:12,backgroundColor:'#fff',minHeight:44,fontSize:16,minWidth:190,color:'#172b20'},label:{fontSize:12,fontWeight:'700',color:'#46604e',marginBottom:5},button:{backgroundColor:'#0b5a37',paddingHorizontal:16,paddingVertical:13,borderRadius:9,minHeight:44,alignSelf:'flex-start'},buttonText:{color:'#fff',fontWeight:'700'},disabled:{opacity:0.5},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e4decf',borderRadius:14,padding:18,gap:12},heading:{fontSize:19,fontWeight:'700',color:'#075333'},metrics:{flexDirection:'row',flexWrap:'wrap',gap:12},metric:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e4decf',borderRadius:12,padding:18,flexGrow:1,minWidth:190},metricPhone:{width:'100%'},profit:{backgroundColor:'#e8f2d8',borderColor:'#86a549'},amount:{fontSize:24,fontWeight:'800',color:'#075333'},warning:{backgroundColor:'#fff1ce',padding:15,borderRadius:10},error:{color:'#9b2525',backgroundColor:'#ffe7e7',padding:12,borderRadius:8},success:{color:'#075333',backgroundColor:'#e8f4e8',padding:12,borderRadius:8},tab:{backgroundColor:'#edf4e8',borderWidth:1,borderColor:'#a3bea4',paddingHorizontal:14,paddingVertical:11,borderRadius:9},tabActive:{backgroundColor:'#0b5a37'},tabText:{color:'#075333',fontWeight:'700'},tabTextActive:{color:'#fff'},record:{padding:14,gap:12,borderWidth:1,borderColor:'#e3e8e1',borderRadius:9},recordDesktop:{flexDirection:'row',flexWrap:'wrap'},field:{flexGrow:1,flexBasis:120},value:{color:'#22392a',lineHeight:21},empty:{color:'#68756a',paddingVertical:14},
});
