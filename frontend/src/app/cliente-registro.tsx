import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ClienteRegistroScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [clave, setClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  const mostrarMensaje = (
    texto: string,
    tipo: 'ok' | 'error' | 'info' = 'info',
    alerta: boolean = false
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);

    if (alerta) {
      Alert.alert(tipo === 'error' ? 'Error' : 'Aviso', texto);
    }
  };

  const validarCorreo = (correoTexto: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTexto);
  };

  const limpiarFormulario = () => {
    setNombre('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setClave('');
    setConfirmarClave('');
    setMostrarClave(false);
  };

  const obtenerMensajeError = (error: any) => {
    const mensajeBackend =
      error?.response?.data?.mensaje ||
      error?.response?.data?.message ||
      error?.response?.data?.error;

    if (mensajeBackend) {
      return String(mensajeBackend);
    }

    if (error?.response?.status === 400) {
      return 'Revise los datos ingresados. Puede que el correo ya esté registrado.';
    }

    if (error?.message?.includes('Network')) {
      return 'No se pudo conectar con el servidor.';
    }

    return 'No se pudo registrar el cliente.';
  };

  const registrarCliente = async () => {
    setMensaje('');

    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const direccionLimpia = direccion.trim();
    const claveLimpia = clave.trim();
    const confirmarLimpia = confirmarClave.trim();

    if (!nombreLimpio) {
      mostrarMensaje('Debe ingresar el nombre completo.', 'error', true);
      return;
    }

    if (nombreLimpio.length < 3) {
      mostrarMensaje('El nombre debe tener al menos 3 caracteres.', 'error', true);
      return;
    }

    if (!telefonoLimpio) {
      mostrarMensaje('Debe ingresar el teléfono.', 'error', true);
      return;
    }

    if (telefonoLimpio.length < 8) {
      mostrarMensaje('Ingrese un teléfono válido.', 'error', true);
      return;
    }

    if (!correoLimpio) {
      mostrarMensaje('Debe ingresar el correo electrónico.', 'error', true);
      return;
    }

    if (!validarCorreo(correoLimpio)) {
      mostrarMensaje('Ingrese un correo electrónico válido.', 'error', true);
      return;
    }

    if (!direccionLimpia) {
      mostrarMensaje('Debe ingresar la dirección de entrega.', 'error', true);
      return;
    }

    if (!claveLimpia) {
      mostrarMensaje('Debe ingresar una contraseña.', 'error', true);
      return;
    }

    if (claveLimpia.length < 6) {
      mostrarMensaje('La contraseña debe tener mínimo 6 caracteres.', 'error', true);
      return;
    }

    if (claveLimpia !== confirmarLimpia) {
      mostrarMensaje('Las contraseñas no coinciden.', 'error', true);
      return;
    }

    try {
      setCargando(true);

      await api.post('/clientes/registrar', {
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
        correo: correoLimpio,
        clave: claveLimpia,
        direccion: direccionLimpia,
      });

      limpiarFormulario();

      mostrarMensaje(
        'Usuario registrado correctamente. Ya puede iniciar sesión.',
        'ok',
        true
      );

      setTimeout(() => {
        router.replace('/cliente-login' as any);
      }, 1500);
    } catch (error: any) {
      console.log('Error al registrar cliente:', error?.response?.data || error);
      mostrarMensaje(obtenerMensajeError(error), 'error', true);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={styles.contenido}>
      <View style={styles.contenedor}>
        <View style={styles.logoArea}>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
          <Text style={styles.logoSubtitulo}>REGISTRO DE CLIENTES</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>Crear cuenta</Text>

          <Text style={styles.descripcion}>
            Complete los datos para registrarse como cliente.
          </Text>

          {mensaje !== '' && (
            <View
              style={[
                styles.mensajeCaja,
                tipoMensaje === 'ok' && styles.mensajeOk,
                tipoMensaje === 'error' && styles.mensajeError,
                tipoMensaje === 'info' && styles.mensajeInfo,
              ]}
            >
              <Text style={styles.mensajeTexto}>{mensaje}</Text>
            </View>
          )}

          <Text style={styles.label}>Nombre completo</Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: María González"
            value={nombre}
            onChangeText={setNombre}
            editable={!cargando}
          />

          <Text style={styles.label}>Teléfono</Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 88888888"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            editable={!cargando}
          />

          <Text style={styles.label}>Correo electrónico</Text>

          <TextInput
            style={styles.input}
            placeholder="cliente@correo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!cargando}
          />

          <Text style={styles.label}>Dirección de entrega</Text>

          <TextInput
            style={styles.inputMultilinea}
            placeholder="Ejemplo: Alajuela, Costa Rica"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            editable={!cargando}
          />

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.passwordRow}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Mínimo 6 caracteres"
              value={clave}
              onChangeText={setClave}
              secureTextEntry={!mostrarClave}
              editable={!cargando}
            />

            <Pressable
              style={styles.botonMostrar}
              onPress={() => setMostrarClave(!mostrarClave)}
              disabled={cargando}
            >
              <Text style={styles.textoMostrar}>
                {mostrarClave ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>

          <TextInput
            style={styles.input}
            placeholder="Repita la contraseña"
            value={confirmarClave}
            onChangeText={setConfirmarClave}
            secureTextEntry={!mostrarClave}
            editable={!cargando}
          />

          <Pressable
            style={[
              styles.botonPrincipal,
              cargando && styles.botonDesactivado,
            ]}
            onPress={registrarCliente}
            disabled={cargando}
          >
            <Text style={styles.textoBotonPrincipal}>
              {cargando ? 'Registrando usuario...' : 'Registrarme'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonSecundario}
            onPress={() => router.replace('/cliente-login' as any)}
            disabled={cargando}
          >
            <Text style={styles.textoBotonSecundario}>
              Ya tengo cuenta
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonVolver}
            onPress={() => router.replace('/' as any)}
            disabled={cargando}
          >
            <Text style={styles.textoVolver}>Volver al inicio</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#f7f5ee',
  },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contenedor: {
    width: '100%',
    maxWidth: 560,
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  logoNombre: {
    color: '#0f4f24',
    fontSize: 46,
    fontWeight: 'bold',
    lineHeight: 50,
  },
  logoSubtitulo: {
    color: '#e07b18',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#fffdf6',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: '#ebe4d3',
  },
  titulo: {
    color: '#063f22',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descripcion: {
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  mensajeCaja: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  mensajeOk: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  mensajeError: {
    backgroundColor: '#ffebee',
    borderColor: '#c62828',
  },
  mensajeInfo: {
    backgroundColor: '#fff8e1',
    borderColor: '#f9a825',
  },
  mensajeTexto: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  inputMultilinea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 70,
  },
  passwordRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputPassword: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  botonMostrar: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#f7f2dc',
  },
  textoMostrar: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonPrincipal: {
    backgroundColor: '#f58220',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  botonDesactivado: {
    backgroundColor: '#9e9e9e',
  },
  textoBotonPrincipal: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonSecundario: {
    backgroundColor: '#1b5e20',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBotonSecundario: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  botonVolver: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoVolver: {
    color: '#555',
    fontWeight: 'bold',
  },
});