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

export default function LoginScreen() {
  const router = useRouter();

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
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

  const limpiarSesiones = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('token_cliente');
      localStorage.removeItem('cliente');
    }
  };

  const guardarSesionAdmin = (token: string, usuario: any) => {
    limpiarSesiones();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  };

  const guardarSesionCliente = (token: string, cliente: any) => {
    limpiarSesiones();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token_cliente', token);
      localStorage.setItem('cliente', JSON.stringify(cliente));
    }
  };

  const esErrorCredenciales = (error: any) => {
    const status = error?.response?.status;
    return status === 400 || status === 401 || status === 404;
  };

  const obtenerMensajeErrorFinal = (errorAdmin: any, errorCliente: any) => {
    if (esErrorCredenciales(errorAdmin) && esErrorCredenciales(errorCliente)) {
      return 'Correo o contraseña incorrectos. Revise los datos e intente nuevamente.';
    }

    if (
      errorAdmin?.message?.includes('Network') ||
      errorCliente?.message?.includes('Network')
    ) {
      return 'No se pudo conectar con el servidor. Revise la conexión a internet.';
    }

    const mensajeBackend =
      errorCliente?.response?.data?.mensaje ||
      errorAdmin?.response?.data?.mensaje ||
      errorCliente?.response?.data?.error ||
      errorAdmin?.response?.data?.error;

    if (mensajeBackend) {
      return String(mensajeBackend);
    }

    return 'No se pudo iniciar sesión. Intente nuevamente.';
  };

  const iniciarSesion = async () => {
    setMensaje('');

    const correoLimpio = correo.trim().toLowerCase();
    const claveLimpia = clave.trim();

    if (!correoLimpio) {
      mostrarMensaje('Debe ingresar el correo electrónico.', 'error', true);
      return;
    }

    if (!validarCorreo(correoLimpio)) {
      mostrarMensaje('Ingrese un correo electrónico válido.', 'error', true);
      return;
    }

    if (!claveLimpia) {
      mostrarMensaje('Debe ingresar la contraseña.', 'error', true);
      return;
    }

    try {
      setCargando(true);
      mostrarMensaje('Validando datos...', 'info');

      let errorAdmin: any = null;
      let errorCliente: any = null;

      try {
        const respuestaAdmin = await api.post('/auth/login', {
          correo: correoLimpio,
          clave: claveLimpia,
        });

        const token = respuestaAdmin.data?.token;
        const usuario = respuestaAdmin.data?.usuario;

        if (token && usuario) {
          guardarSesionAdmin(token, usuario);
          mostrarMensaje('Inicio de sesión correcto.', 'ok');
          router.replace('/home' as any);
          return;
        }
      } catch (error: any) {
        errorAdmin = error;
      }

      try {
        const respuestaCliente = await api.post('/clientes/login', {
          correo: correoLimpio,
          clave: claveLimpia,
        });

        const token = respuestaCliente.data?.token;
        const cliente = respuestaCliente.data?.cliente;

        if (token && cliente) {
          guardarSesionCliente(token, cliente);
          mostrarMensaje('Inicio de sesión correcto.', 'ok');
          router.replace('/cliente-home' as any);
          return;
        }
      } catch (error: any) {
        errorCliente = error;
      }

      mostrarMensaje(
        obtenerMensajeErrorFinal(errorAdmin, errorCliente),
        'error',
        true
      );
    } catch (error: any) {
      console.log('Error general login:', error);
      mostrarMensaje('Ocurrió un error inesperado al iniciar sesión.', 'error', true);
    } finally {
      setCargando(false);
    }
  };

  const irRegistroCliente = () => {
    router.push('/cliente-registro' as any);
  };

  const irCatalogo = () => {
    router.push('/catalogo' as any);
  };

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={styles.contenido}>
      <View style={styles.contenedor}>
        <View style={styles.logoArea}>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
          <Text style={styles.logoSubtitulo}>
            FRUTAS · VERDURAS · JUGOS NATURALES
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>Inicio de sesión</Text>

          <Text style={styles.descripcion}>
            Ingrese su correo y contraseña para acceder al sistema.
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

          <Text style={styles.label}>Correo electrónico</Text>

          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!cargando}
          />

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.passwordRow}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Ingrese su contraseña"
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

          <Pressable
            style={[
              styles.botonPrincipal,
              cargando && styles.botonDesactivado,
            ]}
            onPress={iniciarSesion}
            disabled={cargando}
          >
            <Text style={styles.textoBotonPrincipal}>
              {cargando ? 'Validando datos...' : 'Ingresar'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonSecundario}
            onPress={irRegistroCliente}
            disabled={cargando}
          >
            <Text style={styles.textoBotonSecundario}>
              Crear cuenta de cliente
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonCatalogo}
            onPress={irCatalogo}
            disabled={cargando}
          >
            <Text style={styles.textoCatalogo}>
              Ver catálogo sin iniciar sesión
            </Text>
          </Pressable>
        </View>

        <Text style={styles.nota}>
          Si el correo o la contraseña son incorrectos, el sistema mostrará una alerta.
        </Text>
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
    maxWidth: 520,
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
    fontSize: 11,
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
    marginTop: 20,
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
  botonCatalogo: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1b5e20',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoCatalogo: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  nota: {
    color: '#555',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});