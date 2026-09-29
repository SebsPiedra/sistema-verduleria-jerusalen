import { useCallback, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { obtenerDato, eliminarDato } from '../services/storage';

export default function ClientHeader() {
  const router=useRouter();const path=usePathname();const phone=useWindowDimensions().width<768;
  const [signed,setSigned]=useState(false);
  useFocusEffect(useCallback(()=>{let alive=true;void obtenerDato('token_cliente').then(t=>{if(alive)setSigned(!!t);});return()=>{alive=false;};},[]));
  const logout=async()=>{await Promise.all(['token_cliente','cliente','carrito','carrito_cliente'].map(eliminarDato));setSigned(false);router.replace('/');};
  return <View style={{padding:phone?16:24,backgroundColor:'#ffffff',borderBottomWidth:1,borderColor:'#dce8e9',gap:14}}>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Jerusalén, inicio" onPress={()=>router.push('/cliente-home')} style={{minHeight:44,justifyContent:'center'}}><Text style={{fontSize:25,fontWeight:'800',color:'#123c40',letterSpacing:-1}}>Jerusalén<Text style={{color:'#087f73'}}> ↗</Text></Text><Text style={{fontSize:10,letterSpacing:2,color:'#617d80'}}>FRESCO. SIMPLE. CERCA.</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>signed?void logout():router.push('/')} style={{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderWidth:1,borderColor:'#cfdee0',borderRadius:12}}><Text style={{color:'#075e58',fontWeight:'600'}}>{signed?'Salir':'Ingresar'}</Text></Pressable>
    </View>
    <View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{[['Inicio','/cliente-home'],['Catálogo','/catalogo'],['Mis pedidos','/cliente-mis-pedidos'],['Carrito','/cliente-pedido']].map(([label,url])=><Pressable key={url} accessibilityRole="button" accessibilityState={{selected:path===url}} onPress={()=>router.push((!signed&&url.includes('pedido')?'/':url) as any)} style={{flexGrow:1,minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:10,borderRadius:12,backgroundColor:path===url?'#092c30':'#eef5f5'}}><Text style={{fontSize:13,fontWeight:'600',color:path===url?'#fff':'#365c60'}}>{label}</Text></Pressable>)}</View>
  </View>;
}
