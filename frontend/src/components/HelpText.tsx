import { ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
export default function HelpText({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false);
  return <View style={{marginVertical:8}}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-start'}}><Text style={{color:'#075e58',fontSize:13,fontWeight:'600'}}>{open?'− Ocultar ayuda':'+ Cómo funciona'}</Text></Pressable>{open&&<Text style={{color:'#52656a',lineHeight:21,maxWidth:680}}>{children}</Text>}</View>;
}
