import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ClienteRegistroScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrarCliente = async () => {
    if (!nombre || !correo || !clave) {
      Alert.alert(
        'Campos requeridos',
        'Debe ingresar nombre, correo y contraseña'
      );
      return;
    }

    try {
      setCargando(true);

      await api.post('/clientes/registrar', {
        nombre,
        telefono,
        correo,
        clave,
        direccion,
      });

      Alert.alert(
        'Cuenta creada',
        'El cliente fue registrado correctamente. Ahora puede iniciar sesión.'
      );

      router.replace('/' as any);
    } catch (error: any) {
      console.log('Error al registrar cliente:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo registrar el cliente'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🥬</Text>

      <Text style={styles.titulo}>Registro de cliente</Text>

      <Text style={styles.subtitulo}>Verdulería Jerusalén</Text>

      <Text style={styles.label}>Nombre completo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del cliente"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: 88888888"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="correo@ejemplo.com"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={clave}
        onChangeText={setClave}
        secureTextEntry
      />

      <Text style={styles.label}>Dirección de entrega</Text>
      <TextInput
        style={styles.input}
        placeholder="Dirección del cliente"
        value={direccion}
        onChangeText={setDireccion}
      />

      <Pressable
        style={[styles.boton, cargando && styles.botonDesactivado]}
        onPress={registrarCliente}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Registrando...' : 'Crear cuenta'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.botonSecundario}
        onPress={() => router.push('/' as any)}
      >
        <Text style={styles.textoSecundario}>Ya tengo cuenta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
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
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSecundario: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
});