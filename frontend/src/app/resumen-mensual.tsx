import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AdminLayout from '../components/AdminLayout';
import HelpText from '../components/HelpText';
import { createAppStyles } from '../theme/appStyles';
import api from '../services/api';
import { obtenerDato } from '../services/storage';

type Row = Record<string, any>;
type Report = { periodo: string; generado_en: string; criterio: string; totales: Record<string, number>; ventas: Row[]; detalles: Row[]; pedidos: Row[]; desechos: Row[]; gastos: Row[]; inventario: Row[]; clientes: Row[]; proveedores: Row[] };
type Cut = { id: string; periodo: string; creado_en: string; datos: Report };
const money = (cents: number) => '₡ '+(cents/100).toLocaleString('es-CR',{minimumFractionDigits:2,maximumFractionDigits:2});
const dateCR = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const newId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return(c==='x'?r:(r&3)|8).toString(16);});
function Button({children,onPress,disabled=false,secondary=false}:{children:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.button,secondary&&s.secondary,disabled&&s.disabled]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{children}</Text></Pressable>;
}
export default function ResumenMensual() {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  return mounted ? <MonthlyScreen/> : null;
}
function MonthlyScreen() {
  const router=useRouter(); const phone=useWindowDimensions().width<768;
  const [period,setPeriod]=useState(dateCR().slice(0,7));
  const [selected,setSelected]=useState(period); const [data,setData]=useState<Report|null>(null);
  const [cuts,setCuts]=useState<Cut[]>([]); const [cut,setCut]=useState<Cut|null>(null);
  const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [concept,setConcept]=useState(''); const [amount,setAmount]=useState(''); const [date,setDate]=useState(dateCR());
  const [tab,setTab]=useState<keyof Pick<Report,'ventas'|'detalles'|'pedidos'|'desechos'|'gastos'|'inventario'|'clientes'|'proveedores'>>('ventas');
  const [page,setPage]=useState(0); const [confirm,setConfirm]=useState<string|null>(null);
  const serial=useRef(0); const mutation=useRef(false); const pendingCut=useRef<string|null>(null); const pendingExpense=useRef<string|null>(null);
  const auth=useCallback(async()=>{
    const token=await obtenerDato('token');
    if(!token){router.replace('/');throw new Error('Inicie sesión como administrador.');}
    return {headers:{Authorization:'Bearer '+token},timeout:60000};
  },[router]);
  const fail=useCallback((e:any)=>{setError(e.response?.data?.mensaje || e.message || 'No se pudo completar la operación.');if(e.response?.status===401)router.replace('/');},[router]);
  const load=useCallback(async()=>{
    const ticket=++serial.current; setLoading(true);
    try{const config=await auth();const [r,c]=await Promise.all([api.get('/resumen-mensual',{...config,params:{periodo:selected}}),api.get('/resumen-mensual/cortes',{...config,params:{periodo:selected}})]);
      if(ticket===serial.current){setData(r.data);setCuts(c.data);setError('');}
    }catch(e){if(ticket===serial.current)fail(e);}finally{if(ticket===serial.current)setLoading(false);}
  },[selected,auth,fail]);
  useFocusEffect(useCallback(()=>{void load();const timer=setInterval(()=>{if(!mutation.current)void load();},60000);return()=>{clearInterval(timer);serial.current++;};},[load]));
  const action=async(work:()=>Promise<void>)=>{if(mutation.current)return;mutation.current=true;setBusy(true);setError('');setNotice('');try{await work();}catch(e){fail(e);}finally{mutation.current=false;setBusy(false);}};
  const save=async()=>{
    pendingCut.current ||= newId();
    const r=await api.post('/resumen-mensual/cortes',{periodo:selected,id:pendingCut.current},await auth());
    pendingCut.current=null;setCut(r.data);setNotice('Corte guardado en la base de datos. Ya puede descargar su PDF.');await load();
  };
  const download=async()=>{
    if(!cut)return;
    if(Platform.OS!=='web')throw new Error('Abra la versión web para descargar o imprimir el PDF.');
    const r=await api.get(`/resumen-mensual/cortes/${cut.id}/pdf`,{...await auth(),responseType:'blob'});
    const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=`Resumen-${cut.periodo}-${cut.id.slice(0,8)}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    setNotice('PDF descargado. Puede abrirlo e imprimirlo desde su lector de PDF.');
  };
  const expense=async()=>{
    const normalized=amount.trim().replace(',','.');
    if(!concept.trim() || !/^\d{1,10}(\.\d{1,2})?$/.test(normalized) || Number(normalized)<=0)throw new Error('Ingrese concepto y monto positivo (sin separadores de miles).');
    if(date.slice(0,7)!==selected)throw new Error('La fecha del gasto debe pertenecer al mes consultado.');
    pendingExpense.current ||= newId();
    try { await api.post('/resumen-mensual/gastos',{id:pendingExpense.current,fecha:date,concepto:concept.trim(),monto:normalized},await auth()); }
    catch(e:any){if(e.response?.status===409){pendingExpense.current=null;await load();}throw e;}
    pendingExpense.current=null;setConcept('');setAmount('');setNotice('Gasto guardado. El resultado mensual fue actualizado.');await load();
  };
  const shown=cut?.datos || data;
  const tables:Record<typeof tab,{label:string;fields:[string,string][]}>= {
    ventas:{label:'Ventas',fields:[['id_venta','Venta'],['fecha','Fecha'],['cliente','Cliente'],['estado','Estado'],['total','Total'],['contabilizada','Contabilizada']]},
    detalles:{label:'Detalle de ventas',fields:[['id_venta','Venta'],['producto','Producto'],['cantidad','Cantidad'],['subtotal','Subtotal'],['costo','Costo'],['estimado','Costo estimado']]},
    pedidos:{label:'Pedidos',fields:[['id_pedido','Pedido'],['fecha','Fecha'],['estado','Estado'],['total','Total'],['id_venta','Venta vinculada']]},
    desechos:{label:'Desechos',fields:[['producto','Producto'],['fecha','Fecha'],['cantidad','Cantidad'],['motivo','Motivo'],['perdida','Pérdida']]},
    gastos:{label:'Gastos',fields:[['fecha','Fecha'],['concepto','Concepto'],['monto','Monto'],['anulado_en','Anulado el']]},
    inventario:{label:'Inventario actual',fields:[['nombre','Producto'],['cantidad','Cantidad'],['unidad_medida','Unidad'],['precio_compra','Costo unitario'],['estado','Estado']]},
    clientes:{label:'Clientes actuales',fields:[['id_cliente','Número'],['nombre','Nombre'],['estado','Estado']]},
    proveedores:{label:'Proveedores actuales',fields:[['id_proveedor','Número'],['nombre','Nombre'],['estado','Estado']]}
  };
  const format=(key:string,value:any)=>typeof value==='boolean'?(value?'Sí':'No'):['total','subtotal','costo','perdida','monto','precio_compra'].includes(key)?money(Number(value||0)*100):String(value??'—');
  const rows=shown?.[tab]||[];const pages=Math.max(1,Math.ceil(rows.length/15));const actualPage=Math.min(page,pages-1);
  return <AdminLayout titulo="Resumen mensual" subtitulo="Ingresos, costos, gastos y cortes guardados">
    <ScrollView contentContainerStyle={[s.content,phone&&s.phone]}>
      <Text style={s.title}>Tus cuentas, claras</Text>
      <View style={s.row}><View><Text style={s.label}>Mes (AAAA-MM)</Text><TextInput accessibilityLabel="Mes del resumen" value={period} onChangeText={setPeriod} placeholder="2026-09" maxLength={7} style={s.input}/></View>
        <Button disabled={busy} onPress={()=>{if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(period)){setError('Use el formato AAAA-MM.');return;}setCut(null);setPage(0);pendingCut.current=null;setNotice('');if(period===selected)void load();else{setData(null);setSelected(period);}}}>Consultar mes</Button>
        <Button disabled={busy||loading||!shown||!!cut} onPress={()=>void action(save)}>Guardar corte</Button>
        <Button secondary disabled={busy||!cut} onPress={()=>void action(download)}>Descargar PDF</Button>
      </View>
      {(busy||loading)&&<ActivityIndicator accessibilityLabel="Cargando resumen" color="#075333"/>}
      {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!notice&&<Text accessibilityRole="alert" style={s.success}>{notice}</Text>}
      <View style={s.card}><Text style={s.heading}>{cut?'Corte guardado · '+cut.periodo:'Resumen actualizado · '+selected}</Text>
        <Text style={s.muted}>{cut?'Los datos de este corte no cambian.':'Se actualiza al entrar y cada minuto. Guardar un corte conserva los datos de ese momento.'}</Text>
        {!!shown&&<Text style={s.muted}>Datos al {new Date(shown.generado_en).toLocaleString('es-CR',{timeZone:'America/Costa_Rica'})} (Costa Rica).</Text>}
        {!!cut&&<Button secondary onPress={()=>{setCut(null);setPage(0);setNotice('');}}>Volver al resumen actualizado</Button>}
      </View>
      {!!shown&&<>
        <View style={s.metrics}>{([['ingresos','Ingresos por ventas'],['costo','Costo de lo vendido'],['perdidas','Pérdidas por desechos'],['gastos','Gastos adicionales'],['ganancia','Ganancia estimada']] as const).map(([key,label])=><View key={key} style={[s.metric,phone&&s.metricPhone,key==='ganancia'&&s.profit]}><Text style={s.label}>{label}</Text><Text style={s.amount}>{money(shown.totales[key])}</Text></View>)}</View>
        <Text style={s.muted}>{shown.totales.ventas} ventas contabilizadas · {shown.totales.pedidos} pedidos del mes (sin duplicar ingresos).</Text>
        <HelpText>{shown.criterio}</HelpText>
        {(shown.totales.costos_estimados>0||shown.totales.sin_costo>0||shown.totales.ventas_sin_detalle>0)&&<View style={s.warning}><Text>Costos estimados: {shown.totales.costos_estimados} · Sin costo: {shown.totales.sin_costo} · Ventas sin detalle: {shown.totales.ventas_sin_detalle}.</Text></View>}
        {!cut&&<View style={s.card}><Text style={s.heading}>Registrar gasto adicional</Text><Text style={s.muted}>Alquiler, electricidad, transporte u otros gastos. No repita las compras de productos ni los desechos: su costo ya se descuenta arriba.</Text>
          <Text style={s.label}>Fecha (AAAA-MM-DD)</Text><TextInput accessibilityLabel="Fecha del gasto" value={date} onChangeText={v=>{setDate(v);pendingExpense.current=null;}} style={s.input} maxLength={10}/>
          <Text style={s.label}>Concepto</Text><TextInput accessibilityLabel="Concepto del gasto" value={concept} onChangeText={v=>{setConcept(v);pendingExpense.current=null;}} style={s.input} maxLength={200} placeholder="Ejemplo: electricidad"/>
          <Text style={s.label}>Monto en colones</Text><TextInput accessibilityLabel="Monto del gasto" value={amount} onChangeText={v=>{setAmount(v);pendingExpense.current=null;}} style={s.input} keyboardType="decimal-pad" placeholder="15000.00"/>
          <Button disabled={busy} onPress={()=>void action(expense)}>Guardar gasto</Button></View>}
        <View style={s.card}><Text style={s.heading}>Movimientos y datos</Text><View style={s.row}>{Object.entries(tables).map(([key,t])=><Button key={key} secondary={tab!==key} onPress={()=>{setTab(key as typeof tab);setPage(0);setConfirm(null);}}>{t.label}</Button>)}</View>
          <Text style={s.muted}>{rows.length} registros · Página {actualPage+1} de {pages}</Text>
          {!rows.length&&<Text style={s.empty}>No hay registros para esta sección.</Text>}
          {rows.slice(actualPage*15,actualPage*15+15).map((r,i)=><View key={String(r.id || i)} style={[s.record,!phone&&s.recordDesktop]}>{tables[tab].fields.map(([key,label])=><View key={key} style={!phone?s.field:undefined}><Text style={s.label}>{label}</Text><Text selectable style={s.value}>{format(key,r[key])}</Text></View>)}
            {tab==='gastos'&&!cut&&!r.anulado_en&&<Button secondary disabled={busy} onPress={()=>{if(confirm!==r.id){setConfirm(r.id);return;}void action(async()=>{await api.post(`/resumen-mensual/gastos/${r.id}/anular`,{},await auth());setConfirm(null);await load();});}}>{confirm===r.id?'Confirmar anulación':'Anular gasto'}</Button>}</View>)}
          <View style={s.row}><Button secondary disabled={actualPage===0} onPress={()=>setPage(actualPage-1)}>Anterior</Button><Button secondary disabled={actualPage>=pages-1} onPress={()=>setPage(actualPage+1)}>Siguiente</Button></View>
        </View>
      </>}
      <View style={s.card}><Text style={s.heading}>Cortes guardados de {selected}</Text><Text style={s.muted}>Conservados en la base de datos. Puede guardar varios cortes sin reemplazar los anteriores.</Text>
        {!cuts.length&&<Text style={s.empty}>Todavía no hay cortes guardados para este mes.</Text>}
        {cuts.map(c=><View style={s.saved} key={c.id}><Text style={s.value}>{new Date(c.creado_en).toLocaleString('es-CR',{timeZone:'America/Costa_Rica'})} · {c.id.slice(0,8)}</Text><Button secondary disabled={busy} onPress={()=>void action(async()=>{const r=await api.get('/resumen-mensual/cortes/'+c.id,await auth());setCut(r.data);setPage(0);})}>Ver corte</Button></View>)}
      </View>
    </ScrollView>
  </AdminLayout>;
}
const s=createAppStyles({
  content:{padding:24,gap:18,backgroundColor:'#fffcf3',flexGrow:1},phone:{padding:12},title:{fontSize:27,fontWeight:'800',color:'#064c30'},muted:{color:'#5b665f',lineHeight:21},
  row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'flex-end'},button:{backgroundColor:'#0b5a37',paddingHorizontal:16,paddingVertical:13,borderRadius:9,alignSelf:'flex-start',minHeight:44},buttonText:{color:'#fff',fontWeight:'700'},secondary:{backgroundColor:'#edf4e8',borderWidth:1,borderColor:'#a3bea4'},secondaryText:{color:'#075333'},disabled:{opacity:0.45},
  input:{borderWidth:1,borderColor:'#b3beb5',borderRadius:8,padding:12,backgroundColor:'#fff',minHeight:44,fontSize:16,minWidth:150,color:'#172b20'},label:{fontSize:12,fontWeight:'700',color:'#46604e',marginBottom:5},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e4decf',borderRadius:14,padding:18,gap:12},heading:{fontSize:19,fontWeight:'700',color:'#075333'},metrics:{flexDirection:'row',flexWrap:'wrap',gap:12},metric:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e4decf',borderRadius:12,padding:18,flexGrow:1,minWidth:190},metricPhone:{width:'100%'},profit:{backgroundColor:'#e8f2d8',borderColor:'#86a549'},amount:{fontSize:24,fontWeight:'800',color:'#075333'},warning:{backgroundColor:'#fff1ce',padding:15,borderRadius:10,gap:8},error:{color:'#9b2525',backgroundColor:'#ffe7e7',padding:12,borderRadius:8},success:{color:'#075333',backgroundColor:'#e8f4e8',padding:12,borderRadius:8},record:{padding:14,gap:12,borderWidth:1,borderColor:'#e3e8e1',borderRadius:9},recordDesktop:{flexDirection:'row',flexWrap:'wrap'},field:{flexGrow:1,flexBasis:100},value:{color:'#22392a',lineHeight:21},empty:{color:'#68756a',paddingVertical:14},saved:{flexDirection:'row',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}
});
