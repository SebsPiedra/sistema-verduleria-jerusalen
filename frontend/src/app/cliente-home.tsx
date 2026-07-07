import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { obtenerDato, eliminarDato } from '../services/storage.js';

export default function ClienteHomeScreen() {
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);

  const cargarCliente = async () => {
    const clienteGuardado = await obtenerDato('cliente');

    if (clienteGuardado) {
      setCliente(JSON.parse(clienteGuardado));
    } else {
      Alert.alert('Sesión requerida', 'Debe iniciar sesión');
      router.replace('/' as any);
    }
  };

  const cerrarSesion = async () => {
    await eliminarDato('token_cliente');
    await eliminarDato('cliente');

    Alert.alert('Sesión cerrada', 'Se cerró la sesión del cliente');
    router.replace('/' as any);
  };

  useEffect(() => {
    cargarCliente();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🥬</Text>

      <Text style={styles.titulo}>Bienvenido</Text>

      <Text style={styles.nombre}>
        {cliente?.nombre || 'Cliente'}
      </Text>

      <Text style={styles.subtitulo}>
        Desde este apartado puede consultar productos, realizar pedidos y revisar el seguimiento.
      </Text>

      <View style={styles.card}>
        <Text style={styles.icono}>🛒</Text>
        <Text style={styles.cardTitulo}>Pedidos de cliente</Text>
        <Text style={styles.cardTexto}>
          Agregue productos al carrito, confirme su pedido y revise el estado desde el seguimiento.
        </Text>
      </View>

      <Pressable
        style={styles.boton}
        onPress={() => router.push('/cliente-pedido' as any)}
      >
        <Text style={styles.textoBoton}>Hacer pedido</Text>
      </Pressable>

      <Pressable
        style={styles.botonSeguimiento}
        onPress={() => router.push('/cliente-mis-pedidos' as any)}
      >
        <Text style={styles.textoSeguimiento}>Ver seguimiento de pedidos</Text>
      </Pressable>

      <Pressable style={styles.botonSecundario} onPress={cerrarSesion}>
        <Text style={styles.textoSecundario}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#eef8ef',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 55,
    textAlign: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitulo: {
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 16,
  },
  icono: {
    fontSize: 34,
    textAlign: 'center',
  },
  cardTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
    marginTop: 8,
  },
  cardTexto: {
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSeguimiento: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSeguimiento: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSecundario: {
    color: '#fff',
    fontWeight: 'bold',
  },
});