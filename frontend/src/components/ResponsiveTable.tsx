import { ReactNode, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

/** Keeps columns readable instead of squeezing seven fields into a phone. */
export default function ResponsiveTable({ children }: { children: ReactNode }) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const compact = availableWidth > 0 && availableWidth < 900;
  return <View onLayout={({ nativeEvent }) => setAvailableWidth(nativeEvent.layout.width)} style={{ minWidth: 0, width: '100%' }}>
    {compact && <Text style={{ color: '#526b69', fontSize: 12, marginVertical: 10 }}>Desliza la tabla para ver más →</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled">
      <View style={{ width: Math.max(900, availableWidth) }}>{children}</View>
    </ScrollView>
  </View>;
}
