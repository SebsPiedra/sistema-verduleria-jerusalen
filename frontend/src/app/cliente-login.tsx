import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ClienteLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/' as any);
  }, []);

  return (
    <View style={styles.container}>
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
  texto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 18,
  },
});