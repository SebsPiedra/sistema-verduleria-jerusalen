import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';

export default function RestablecerPasswordScreen() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ token?: string | string[] }>();
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const token = useMemo(
    () =>
      Array.isArray(parametros.token)
        ? parametros.token[0] || ''
        : parametros.token || '',
    [parametros.token]
  );

  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [mensaje, setMensaje] = useState(
    token ? '' : 'El enlace de recuperación no contiene un token válido.'
  );

  const restablecer = async () => {
    if (!token) return;

    if (
      clave.length < 8 ||
      !/[a-z]/.test(clave) ||
      !/[A-Z]/.test(clave) ||
      !/\d/.test(clave)
    ) {
      setMensaje(
        'Use al menos 8 caracteres e incluya una mayúscula, una minúscula y un número.'
      );
      return;
    }

    if (clave !== confirmacion) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    try {
      setGuardando(true);
      setMensaje('Actualizando contraseña...');

      const respuesta = await api.post('/auth/restablecer-password', {
        token,
        clave,
      });

      const texto =
        respuesta.data?.mensaje ||
        'Contraseña actualizada correctamente. Ya puede iniciar sesión.';
      setCompletado(true);
      setClave('');
      setConfirmacion('');
      setMensaje(texto);
      Alert.alert('Contraseña actualizada', texto);
    } catch (error: any) {
      const texto =
        error?.response?.data?.mensaje ||
        'No se pudo actualizar la contraseña.';
      setMensaje(texto);
      Alert.alert('No se pudo actualizar', texto);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView
      style={styles.pagina}
      contentContainerStyle={[
        styles.contenido,
        esTelefono && styles.contenidoTelefono,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contenedor}>
        <View style={styles.logoArea}>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
        </View>

        <View style={[styles.card, esTelefono && styles.cardTelefono]}>
          <Text style={[styles.titulo, esTelefono && styles.tituloTelefono]}>
            Crear contraseña nueva
          </Text>
          <Text style={styles.descripcion}>
            La contraseña debe tener al menos 8 caracteres, una mayúscula, una
            minúscula y un número.
          </Text>

          {mensaje !== '' && (
            <View style={[styles.mensaje, completado ? styles.ok : styles.info]}>
              <Text style={styles.mensajeTexto}>{mensaje}</Text>
            </View>
          )}

          {!completado && token !== '' && (
            <>
              <Text style={styles.label}>Contraseña nueva</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={clave}
                  onChangeText={setClave}
                  placeholder="Ingrese la contraseña nueva"
                  secureTextEntry={!mostrarClave}
                  autoCapitalize="none"
                  editable={!guardando}
                />
                <Pressable
                  style={styles.mostrar}
                  onPress={() => setMostrarClave((actual) => !actual)}
                >
                  <Text style={styles.mostrarTexto}>
                    {mostrarClave ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmacion}
                onChangeText={setConfirmacion}
                placeholder="Repita la contraseña nueva"
                secureTextEntry={!mostrarClave}
                autoCapitalize="none"
                editable={!guardando}
                onSubmitEditing={restablecer}
              />

              <Pressable
                style={[styles.boton, guardando && styles.botonDesactivado]}
                onPress={restablecer}
                disabled={guardando}
              >
                <Text style={styles.botonTexto}>
                  {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={styles.volver}
            onPress={() => router.replace('/' as any)}
          >
            <Text style={styles.volverTexto}>Volver al inicio de sesión</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: '#f7f5ee' },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contenidoTelefono: { padding: 16 },
  contenedor: { width: '100%', maxWidth: 540 },
  logoArea: { alignItems: 'center', marginBottom: 20 },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  logoNombre: { color: '#0f4f24', fontSize: 40, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 24,
    padding: 28,
  },
  cardTelefono: { padding: 20 },
  titulo: {
    color: '#063f22',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tituloTelefono: { fontSize: 26 },
  descripcion: {
    color: '#444',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 18,
  },
  mensaje: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },
  info: { backgroundColor: '#fff8e1', borderColor: '#f9a825' },
  ok: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
  mensajeTexto: { color: '#222', textAlign: 'center', fontWeight: 'bold' },
  label: { color: '#333', fontWeight: 'bold', marginBottom: 7, marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    overflow: 'hidden',
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, minWidth: 0 },
  mostrar: {
    justifyContent: 'center',
    paddingHorizontal: 13,
    backgroundColor: '#f7f2dc',
  },
  mostrarTexto: { color: '#1b5e20', fontWeight: 'bold' },
  boton: {
    backgroundColor: '#f58220',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  botonDesactivado: { backgroundColor: '#9e9e9e' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  volver: {
    borderWidth: 1,
    borderColor: '#1b5e20',
    borderRadius: 15,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  volverTexto: { color: '#1b5e20', fontWeight: 'bold' },
});
