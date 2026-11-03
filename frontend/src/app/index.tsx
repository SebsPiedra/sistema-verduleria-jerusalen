import { createAppStyles, useAppStyles } from '../theme/appStyles';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';
import { eliminarDato, guardarDato, obtenerDato } from '../services/storage.js';
import {
  abrirSesionBiometrica,
  biometriaDisponible,
  existeSesionBiometrica,
  guardarSesionBiometrica,
} from '../services/biometria';

export default function LoginScreen() {
  const styles = useAppStyles(baseStyles);
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 820;
  const router = useRouter();
  const parametros = useLocalSearchParams<{ demo?: string | string[] }>();
  const valorDemo = Array.isArray(parametros.demo) ? parametros.demo[0] : parametros.demo;
  const mostrarAccesoDemostracion = Platform.OS === 'web' && valorDemo === '1';

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');
  const [requiere2FA, setRequiere2FA] = useState(false);
  const [desafio2FA, setDesafio2FA] = useState('');
  const [tipoCuenta2FA, setTipoCuenta2FA] = useState<'admin' | 'cliente'>('admin');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [biometriaLista, setBiometriaLista] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void (async () => {
      try {
        setBiometriaLista((await biometriaDisponible()) && (await existeSesionBiometrica()));
      } catch {
        setBiometriaLista(false);
      }
    })();
  }, []);

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

  const limpiarSesiones = async () => {
    await Promise.all([
      eliminarDato('token'),
      eliminarDato('usuario'),
      eliminarDato('token_cliente'),
      eliminarDato('cliente'),
    ]);
  };

  const guardarSesionAdmin = async (token: string, usuario: any) => {
    await limpiarSesiones();
    await Promise.all([
      guardarDato('token', token),
      guardarDato('usuario', JSON.stringify(usuario)),
    ]);
  };

  const guardarSesionCliente = async (token: string, cliente: any) => {
    await limpiarSesiones();
    await Promise.all([
      guardarDato('token_cliente', token),
      guardarDato('cliente', JSON.stringify(cliente)),
    ]);

    const [tokenGuardado, clienteGuardado] = await Promise.all([
      obtenerDato('token_cliente'),
      obtenerDato('cliente'),
    ]);

    if (!tokenGuardado || !clienteGuardado) {
      throw new Error('No se pudo conservar la sesión del cliente.');
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

  const ofrecerBiometria = async (
    tipo: 'admin' | 'cliente',
    token: string,
    perfil: Record<string, unknown>
  ) => {
    if (Platform.OS === 'web' || !(await biometriaDisponible())) return;
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Acceso con huella o rostro',
        '¿Desea proteger y habilitar el próximo ingreso con la biometría de este teléfono?',
        [
          { text: 'Ahora no', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Activar',
            onPress: () => {
              void guardarSesionBiometrica({ tipo, token, perfil })
                .then(() => setBiometriaLista(true))
                .catch(() => mostrarMensaje('No se pudo activar la biometría.', 'error'))
                .finally(resolve);
            },
          },
        ]
      );
    });
  };

  const iniciarSesion = async () => {
    if (cargando) return;
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

        if (respuestaAdmin.data?.requiere2FA && respuestaAdmin.data?.desafio) {
          setRequiere2FA(true);
          setDesafio2FA(respuestaAdmin.data.desafio);
          setTipoCuenta2FA('admin');
          mostrarMensaje(respuestaAdmin.data?.mensaje || 'Revise su correo e ingrese el código de seis dígitos.', 'info');
          return;
        }

        if (token && usuario) {
          await guardarSesionAdmin(token, usuario);
          await ofrecerBiometria('admin', token, usuario);
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

        if (respuestaCliente.data?.requiere2FA && respuestaCliente.data?.desafio) {
          setRequiere2FA(true);
          setDesafio2FA(respuestaCliente.data.desafio);
          setTipoCuenta2FA('cliente');
          mostrarMensaje(respuestaCliente.data?.mensaje || 'Revise su correo e ingrese el código de seis dígitos.', 'info');
          return;
        }

        if (token && cliente) {
          await guardarSesionCliente(token, cliente);
          await ofrecerBiometria('cliente', token, cliente);
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

  const verificar2FA = async () => {
    if (!/^\d{6}$/.test(codigo2FA.trim())) {
      mostrarMensaje('Ingrese el código de seis dígitos.', 'error', true);
      return;
    }
    try {
      setCargando(true);
      const respuesta = await api.post('/auth/2fa/verificar-login', {
        desafio: desafio2FA,
        codigo: codigo2FA.trim(),
      });
      const { token, usuario, cliente } = respuesta.data || {};
      const perfil = tipoCuenta2FA === 'admin' ? usuario : cliente;
      if (!token || !perfil) throw new Error('Respuesta incompleta');
      if (tipoCuenta2FA === 'admin') {
        await guardarSesionAdmin(token, perfil);
        await ofrecerBiometria('admin', token, perfil);
        router.replace('/home' as any);
      } else {
        await guardarSesionCliente(token, perfil);
        await ofrecerBiometria('cliente', token, perfil);
        router.replace('/cliente-home' as any);
      }
    } catch (error: any) {
      mostrarMensaje(error?.response?.data?.mensaje || 'No se pudo verificar el código.', 'error', true);
    } finally {
      setCargando(false);
    }
  };

  const ingresarConBiometria = async () => {
    try {
      setCargando(true);
      const sesion = await abrirSesionBiometrica();
      if (!sesion) throw new Error('No existe una sesión biométrica disponible.');
      if (sesion.tipo === 'admin') {
        await guardarSesionAdmin(sesion.token, sesion.perfil);
        router.replace('/home' as any);
      } else {
        await guardarSesionCliente(sesion.token, sesion.perfil);
        router.replace('/cliente-home' as any);
      }
    } catch (error: any) {
      mostrarMensaje(error?.message || 'No se pudo validar la biometría.', 'error', true);
    } finally {
      setCargando(false);
    }
  };

  const ingresarSandbox = async () => {
    try {
      setCargando(true);
      const respuesta = await api.post('/auth/sandbox-login');
      const { token, usuario } = respuesta.data || {};
      if (!token || !usuario) throw new Error('La cuenta de demostración no está disponible.');
      await guardarSesionAdmin(token, usuario);
      router.replace('/home' as any);
    } catch (error: any) {
      mostrarMensaje(error?.response?.data?.mensaje || error?.message || 'No se pudo abrir la demostración.', 'error', true);
    } finally {
      setCargando(false);
    }
  };

  const irRegistroCliente = () => {
    router.push('/cliente-registro' as any);
  };

  const irRecuperarPassword = () => {
    router.push('/recuperar-password' as any);
  };

  const irCatalogo = () => {
    router.push('/catalogo' as any);
  };

  return (
    <ImageBackground
      nativeID="login-background"
      source={require('../../assets/images/login-ejecutivo.png')}
      resizeMode="cover"
      style={styles.fondo}
      imageStyle={styles.imagenFondo}
    >
      <View style={styles.capaOscura} />
      <ScrollView nativeID="login-screen" style={styles.pagina} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <View style={[styles.contenedor, esEscritorio && styles.contenedorEscritorio]}>
        <View style={[styles.logoArea, esEscritorio && styles.logoAreaEscritorio]}>
          <View style={styles.marcaHojas}>
            <View style={[styles.marcaHoja, styles.marcaHojaIzquierda]} />
            <View style={[styles.marcaHoja, styles.marcaHojaDerecha]} />
          </View>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
          <Text style={styles.logoSubtitulo}>CALIDAD{"\n"}PRODUCE{"\n"}CONFIANZA</Text>
          <View style={styles.lineaNaranja} />
        </View>

        <View nativeID="login-card" style={styles.card}>
          <Text style={styles.titulo}>Bienvenido</Text>

          <Text style={styles.descripcion}>Acceso seguro al sistema de gestión</Text>

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
            autoComplete="email"
            accessibilityLabel="Correo electrónico"
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
              accessibilityLabel="Contraseña"
              autoComplete="current-password"
              onSubmitEditing={iniciarSesion}
              editable={!cargando}
            />

            <Pressable accessibilityRole="button"
              style={styles.botonMostrar}
              onPress={() => setMostrarClave(!mostrarClave)}
              disabled={cargando}
            >
              <Text style={styles.textoMostrar}>
                {mostrarClave ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          </View>

          {requiere2FA && (
            <View style={styles.dosFactoresCaja}>
              <Text style={styles.dosFactoresTitulo}>Verificación en dos pasos</Text>
              <Text style={styles.dosFactoresDescripcion}>Revise su correo electrónico e ingrese el código temporal que recibió.</Text>
              <TextInput
                style={styles.dosFactoresInput}
                placeholder="000000"
                value={codigo2FA}
                onChangeText={(valor) => setCodigo2FA(valor.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                accessibilityLabel="Código de verificación"
              />
            </View>
          )}

          <Pressable accessibilityRole="button"
            style={styles.botonOlvido}
            onPress={irRecuperarPassword}
            disabled={cargando}
          >
            <Text style={styles.textoOlvido}>¿Olvidó su contraseña?</Text>
          </Pressable>

          <Pressable accessibilityRole="button"
            style={[
              styles.botonIngresarEjecutivo,
              cargando && styles.botonDesactivado,
            ]}
            onPress={requiere2FA ? verificar2FA : iniciarSesion}
            disabled={cargando}
          >
            <Text style={styles.textoBotonPrincipal}>
              {cargando ? 'Validando datos...' : requiere2FA ? 'Verificar código' : 'Ingresar'}
            </Text>
          </Pressable>

          {requiere2FA && (
            <Pressable accessibilityRole="button" style={styles.botonCatalogo} onPress={() => {
              setRequiere2FA(false); setDesafio2FA(''); setCodigo2FA(''); setMensaje('');
            }}>
              <Text style={styles.textoCatalogo}>Volver al inicio de sesión</Text>
            </Pressable>
          )}

          {biometriaLista && !requiere2FA && (
            <Pressable accessibilityRole="button" style={styles.botonBiometria} onPress={ingresarConBiometria} disabled={cargando}>
              <Text style={styles.textoBotonSecundario}>Ingresar con huella o rostro</Text>
            </Pressable>
          )}

          {!requiere2FA && mostrarAccesoDemostracion && (
            <Pressable accessibilityRole="button" style={styles.botonSandbox} onPress={ingresarSandbox} disabled={cargando}>
              <Text style={styles.textoSandbox}>Abrir modo demostración</Text>
            </Pressable>
          )}

          <Pressable accessibilityRole="button"
            style={styles.botonSecundario}
            onPress={irRegistroCliente}
            disabled={cargando}
          >
            <Text style={styles.textoBotonSecundario}>
              Crear cuenta
            </Text>
          </Pressable>

          <View style={styles.accesoSeguroFila}>
            <Text style={styles.accesoSeguroCandado}>▣</Text>
            <Text style={styles.accesoSeguroTexto}>Acceso seguro</Text>
          </View>
        </View>

      </View>
      </ScrollView>
    </ImageBackground>
  );
}

const baseStyles = createAppStyles({
  pagina: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fondo: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#032c22',
  },
  imagenFondo: {
    opacity: 0.96,
  },
  capaOscura: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 30, 22, 0.38)',
  },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contenedor: {
    width: '100%',
    maxWidth: 1160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
  },
  contenedorEscritorio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 70,
  },
  logoArea: {
    alignItems: 'center',
    maxWidth: 470,
  },
  logoAreaEscritorio: {
    flex: 1,
    alignItems: 'flex-start',
  },
  marcaHojas: {
    width: 50,
    height: 31,
    position: 'relative',
    marginBottom: 7,
  },
  marcaHoja: {
    position: 'absolute',
    width: 25,
    height: 17,
    backgroundColor: '#8fcf68',
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    bottom: 0,
  },
  marcaHojaIzquierda: {
    left: 4,
    transform: [{ rotate: '18deg' }],
  },
  marcaHojaDerecha: {
    right: 4,
    transform: [{ rotate: '-72deg' }],
  },
  logoTexto: {
    color: '#d6f4df',
    fontSize: 18,
    letterSpacing: 5,
    fontWeight: 'bold',
  },
  logoNombre: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 54,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  lineaNaranja: {
    width: 58,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff7919',
    marginVertical: 14,
  },
  logoSubtitulo: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: 5,
    marginTop: 18,
  },
  card: {
    width: '100%',
    maxWidth: 470,
    backgroundColor: 'rgba(5, 48, 37, 0.90)',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(214, 244, 223, 0.30)',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descripcion: {
    color: '#c9ded7',
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
    color: '#effaf5',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  passwordRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputPassword: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  botonMostrar: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textoMostrar: {
    color: '#d6f4df',
    fontWeight: 'bold',
  },
  botonOlvido: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingLeft: 12,
  },
  textoOlvido: {
    color: '#d6f4df',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  botonIngresarEjecutivo: {
    backgroundColor: '#ff7417',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botonBiometria: {
    backgroundColor: '#0b6b65',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botonSandbox: {
    backgroundColor: '#eef5f4',
    borderWidth: 1,
    borderColor: '#0b6b65',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoSandbox: { color: '#0b6b65', fontWeight: 'bold' },
  dosFactoresCaja: {
    marginTop: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f7fbf9',
    borderWidth: 1,
    borderColor: '#b9d9d1',
  },
  dosFactoresTitulo: { color: '#084f49', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  dosFactoresDescripcion: { color: '#476b65', textAlign: 'center', marginTop: 7, marginBottom: 14, lineHeight: 20 },
  dosFactoresInput: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#0b8b7f', borderRadius: 14, padding: 14, fontSize: 20, fontWeight: '700', letterSpacing: 6, color: '#073f39', textAlign: 'center' },
  textoBotonSecundario: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  botonCatalogo: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoCatalogo: {
    color: '#d6f4df',
    fontWeight: 'bold',
  },
  accesoSeguroFila: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
  },
  accesoSeguroCandado: {
    color: '#ffffff',
    fontSize: 11,
  },
  accesoSeguroTexto: {
    color: '#d6f4df',
    fontSize: 12,
  },
  nota: {
    color: '#555',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});
