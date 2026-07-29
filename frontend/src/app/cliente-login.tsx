import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function ClienteLoginRedirect() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  useEffect(() => {
    router.replace('/' as any);
  }, [router]);

  return (
    <View style={[styles.container, isPhone && styles.containerPhone]}>
      <Text style={styles.texto}>Redirigiendo al inicio de sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPhone: {
    padding: 20,
  },
  texto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
