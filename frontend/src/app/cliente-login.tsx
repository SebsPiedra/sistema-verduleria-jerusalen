import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { guardarDato } from '../services/storage.js';

export default function ClienteLoginScreen() {
  const router = useRouter();

  const [correo, setCorreo] = useState('cliente@verduleria.com');
  const [clave, setClave] = useState('123456');
  const [cargando, setCargando] = useState(false);

  const iniciarSesionCliente = async () => {
    if (!correo || !clave) {
      Alert.alert('Campos requeridos', 'Debe ingresar correo y contraseña');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await api.post('/clientes/login', {
        correo,
        clave,
      });

      await guardarDato('token_cliente', respuesta.data.token);
      await guardarDato('cliente', JSON.stringify(respuesta.data.cliente));

      router.replace('/cliente-home' as any);
    } catch (error: any) {
      console.log('Error login cliente:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo iniciar sesión como cliente'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🥬</Text>
      <Text style={styles.titulo}>Ingreso de cliente</Text>
      <Text style={styles.subtitulo}>Verdulería Jerusalén</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
      />

      <Pressable
        style={[styles.boton, cargando && styles.botonDesactivado]}
        onPress={iniciarSesionCliente}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Ingresando...' : 'Ingresar como cliente'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.botonSecundario}
       onPress={() => router.push('/cliente-registro' as any)}
      >
        <Text style={styles.textoSecundario}>Crear cuenta de cliente</Text>
      </Pressable>

      <Pressable style={styles.botonVolver} onPress={() => router.push('/' as any)}>
        <Text style={styles.textoVolver}>Volver al login principal</Text>
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
  subtitulo: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDesactivado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSecundario: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonVolver: {
    marginTop: 20,
    alignItems: 'center',
  },
  textoVolver: {
    color: '#555',
    fontWeight: 'bold',
  },
});