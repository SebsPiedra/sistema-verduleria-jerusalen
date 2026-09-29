import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import WebPolish from '../components/WebPolish';

export default function RootLayout() {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#eef4f5'}}><ActivityIndicator color="#08736a" accessibilityLabel="Cargando aplicación"/></View>;
  return (
    <><WebPolish/><Stack
      screenOptions={{
        headerShown: false,
      }}
    /></>
  );
}
