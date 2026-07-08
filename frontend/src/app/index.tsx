import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { guardarDato } from '../services/storage.js';
import api from '../services/api';

export default function LoginScreen() {
  const router = useRouter();

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {
    if (!correo || !clave) {
      Alert.alert('Campos requeridos', 'Debe ingresar correo y contraseña');
      return;
    }

    try {
      setCargando(true);

      try {
        const respuestaAdmin = await api.post('/auth/login', {
          correo,
          clave,
        });

        await guardarDato('token', respuestaAdmin.data.token);
        await guardarDato(
          'usuario',
          JSON.stringify(respuestaAdmin.data.usuario)
        );

        router.replace('/home' as any);
        return;
      } catch (errorAdmin) {
        console.log('No ingresó como administrador, se intenta como cliente');
      }

      try {
        const respuestaCliente = await api.post('/clientes/login', {
          correo,
          clave,
        });

        await guardarDato('token_cliente', respuestaCliente.data.token);
        await guardarDato(
          'cliente',
          JSON.stringify(respuestaCliente.data.cliente)
        );

        router.replace('/cliente-home' as any);
        return;
      } catch (errorCliente) {
        Alert.alert(
          'Error',
          'Correo o contraseña incorrectos, o el usuario no está registrado'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-membrete.png')}
        style={styles.logoImagen}
        resizeMode="contain"
      />

      <Text style={styles.titulo}>Verdulería Jerusalén</Text>

      <Text style={styles.subtitulo}>Inicio de sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
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
        onPress={iniciarSesion}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.botonRegistro}
        onPress={() => router.push('/cliente-registro' as any)}
      >
        <Text style={styles.textoRegistro}>Registrarse como cliente</Text>
      </Pressable>

      <Pressable
        style={styles.botonCatalogo}
        onPress={() => router.push('/catalogo' as any)}
      >
        <Text style={styles.textoCatalogo}>Ver catálogo sin registrarse</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f4fff4',
  },
  logoImagen: {
    width: '100%',
    height: 190,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    color: '#444',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDesactivado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  botonRegistro: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoRegistro: {
    color: '#1b5e20',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonCatalogo: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#66bb6a',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoCatalogo: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
  },
});