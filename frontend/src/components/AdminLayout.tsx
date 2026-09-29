import { ReactNode, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions, Alert, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { eliminarDato, obtenerDato } from '../services/storage';

const groups = [
  { name: 'GENERAL', items: [['Inicio','/home','◈'],['Estadísticas','/dashboard','▥'],['Alertas','/alertas','!']] },
  { name: 'OPERACIÓN', items: [['Inventario','/productos','▦'],['Ventas','/ventas','↗'],['Pedidos','/pedidos-admin','≡'],['Clientes','/clientes','◎']] },
  { name: 'CONTROL', items: [['Historial','/historial-ventas','↺'],['Resumen mensual','/resumen-mensual','◷'],['Proveedores','/proveedores','⇄'],['Desechos','/desechos','↘']] },
];
export default function AdminLayout({ children, titulo }: { children: ReactNode; titulo?: string; subtitulo?: string }) {
  const router = useRouter(); const path = usePathname();
  const compact = useWindowDimensions().width < 1000;
  const [open,setOpen] = useState(false);
  const [user,setUser] = useState<{nombre?:string}|null>(null);
  const [ready,setReady] = useState(false);
  useEffect(() => { let active = true;
    void (async()=>{try {
      const [token,raw] = await Promise.all([obtenerDato('token'),obtenerDato('usuario')]);
      if (!active) return;
      if (!token || !raw) { router.replace('/'); return; }
      setUser(JSON.parse(raw)); setReady(true);
    } catch { if(active) router.replace('/'); }})();
    return()=>{active=false;};
  },[router]);
  useEffect(()=>setOpen(false),[path]);
  const logout = async()=>{
    await Promise.all(['token','usuario','token_cliente','cliente','carrito','carrito_cliente'].map(eliminarDato));
    router.replace('/');
  };
  const confirmLogout=()=>{
    if(Platform.OS==='web'){if(window.confirm('¿Cerrar sesión?'))void logout();}
    else Alert.alert('Cerrar sesión','¿Quieres salir?',[{text:'Cancelar'},{text:'Salir',onPress:()=>void logout()}]);
  };
  const current=groups.flatMap(g=>g.items).find(i=>i[1]===path)?.[0] || titulo || 'Administración';
  if(!ready)return <View style={s.loading}><Text>Abriendo tu espacio…</Text></View>;
  const navigation = <>
    <View style={s.brand}><View style={s.brandMark}><Text style={s.brandSymbol}>J</Text></View><View><Text style={s.brandName}>Jerusalén</Text><Text style={s.brandCaption}>ADMINISTRACIÓN</Text></View></View>
    <ScrollView style={{flex:1}} contentContainerStyle={s.navigation}>
      {groups.map(group=><View key={group.name} style={{gap:4}}><Text style={s.group}>{group.name}</Text>{group.items.map(([label,url,icon])=><Pressable key={url} accessibilityRole="button" accessibilityState={{selected:path===url}} onPress={()=>{setOpen(false);router.push(url as any);}} style={[s.item,path===url&&s.active]}><Text style={[s.icon,path===url&&s.activeText]}>{icon}</Text><Text style={[s.itemText,path===url&&s.activeText]}>{label}</Text></Pressable>)}</View>)}
    </ScrollView>
    <Pressable accessibilityRole="button" onPress={confirmLogout} style={s.logout}><Text style={s.logoutText}>Cerrar sesión ↗</Text></Pressable>
  </>;
  return <View style={s.root}>
    {!compact&&<View style={s.sidebar}>{navigation}</View>}
    <View style={s.main}>
      <View style={[s.topbar,compact&&s.topbarPhone]}>
        <View style={s.titleRow}>{compact&&<Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={s.menuButton}><Text style={s.menuIcon}>☰</Text></Pressable>}<View style={{flexShrink:1}}><Text style={s.eyebrow}>JERUSALÉN / ADMIN</Text><Text style={s.title}>{current}</Text></View></View>
        {!compact&&<View style={s.profile}><View style={s.dot}/><Text style={s.userName}>{user?.nombre || 'Administrador'}</Text></View>}
      </View>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content,compact&&s.contentPhone]}>{children}</ScrollView>
    </View>
    {compact&&open&&<View style={s.overlay}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" style={s.backdrop} onPress={()=>setOpen(false)}/><View style={s.drawer}><Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={()=>setOpen(false)} style={s.close}><Text style={s.logoutText}>Cerrar ✕</Text></Pressable>{navigation}</View></View>}
  </View>;
}
const s=StyleSheet.create({
  root:{flex:1,flexDirection:'row',backgroundColor:'#eef4f5'},loading:{flex:1,alignItems:'center',justifyContent:'center'},sidebar:{width:230,backgroundColor:'#092c30',padding:16},
  brand:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:18},brandMark:{width:40,height:40,borderRadius:13,backgroundColor:'#b8f3d6',alignItems:'center',justifyContent:'center'},brandSymbol:{fontSize:25,fontWeight:'800',color:'#092c30'},brandName:{color:'#fff',fontSize:22,fontWeight:'700',letterSpacing:-0.5},brandCaption:{color:'#a4c6c8',fontSize:9,letterSpacing:2,marginTop:3},
  navigation:{gap:20,paddingVertical:12},group:{fontSize:10,letterSpacing:1.8,color:'#96b9bb',paddingHorizontal:12,marginBottom:6},item:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:12,minHeight:44,borderRadius:12},active:{backgroundColor:'#b8f3d6'},icon:{color:'#97bfbc',fontSize:21,width:24,textAlign:'center'},itemText:{color:'#e2eeee',fontSize:14,fontWeight:'600'},activeText:{color:'#103f3c'},logout:{minHeight:48,justifyContent:'center',paddingHorizontal:12,borderTopWidth:1,borderColor:'#295155'},logoutText:{color:'#d4e8e8',fontSize:13},
  main:{flex:1,minWidth:0},topbar:{minHeight:80,paddingHorizontal:28,paddingVertical:16,backgroundColor:'#ffffff',borderBottomWidth:1,borderColor:'#dce8e9',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:16},topbarPhone:{minHeight:68,padding:12},titleRow:{flexDirection:'row',alignItems:'center',gap:14,flex:1,minWidth:0},eyebrow:{fontSize:9,color:'#617d80',letterSpacing:1.8,marginBottom:3},title:{fontSize:21,color:'#133d41',fontWeight:'700'},profile:{flexDirection:'row',alignItems:'center',gap:8},dot:{width:7,height:7,borderRadius:4,backgroundColor:'#087f73'},userName:{fontSize:13,color:'#426064'},menuButton:{width:44,height:44,borderRadius:12,backgroundColor:'#e9f3f2',alignItems:'center',justifyContent:'center'},menuIcon:{fontSize:22,color:'#075e58'},scroll:{flex:1},content:{padding:28,width:'100%',maxWidth:1600,alignSelf:'center'},contentPhone:{padding:14},
  overlay:{position:'absolute',top:0,right:0,bottom:0,left:0,zIndex:20},backdrop:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(5,22,28,0.5)'},drawer:{width:'85%',maxWidth:310,height:'100%',backgroundColor:'#092c30',padding:18},close:{minHeight:44,alignItems:'flex-end',justifyContent:'center'}
});
