import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function RecuperarPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);

  const enviarEnlace = async () => {
    const correoLimpio = correo.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setEsError(true);
      setMensaje('Ingrese un correo electrónico válido.');
      return;
    }

    try {
      setEnviando(true);
      setEsError(false);
      setMensaje('Enviando enlace de recuperación...');

      const respuesta = await api.post('/auth/recuperar-password', {
        correo: correoLimpio,
      });

      const texto =
        respuesta.data?.mensaje ||
        'Si el correo está registrado, recibirá un enlace para cambiar su contraseña.';
      setMensaje(texto);
      Alert.alert('Revise su correo', texto);
    } catch (error: any) {
      const texto =
        error?.response?.data?.mensaje ||
        'No se pudo enviar el correo. Intente nuevamente.';
      setEsError(true);
      setMensaje(texto);
      Alert.alert('No se pudo enviar', texto);
    } finally {
      setEnviando(false);
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
        <Pressable style={styles.volver} onPress={() => router.replace('/' as any)}>
          <Text style={styles.volverTexto}>← Volver al inicio de sesión</Text>
        </Pressable>

        <View style={styles.logoArea}>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
        </View>

        <View style={[styles.card, esTelefono && styles.cardTelefono]}>
          <Text style={[styles.titulo, esTelefono && styles.tituloTelefono]}>
            Recuperar contraseña
          </Text>
          <Text style={styles.descripcion}>
            Escriba el correo de su cuenta. Le enviaremos un enlace seguro para
            crear una contraseña nueva.
          </Text>

          {mensaje !== '' && (
            <View style={[styles.mensaje, esError ? styles.error : styles.info]}>
              <Text style={styles.mensajeTexto}>{mensaje}</Text>
            </View>
          )}

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="ejemplo@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!enviando}
            onSubmitEditing={enviarEnlace}
          />

          <Pressable
            style={[styles.boton, enviando && styles.botonDesactivado]}
            onPress={enviarEnlace}
            disabled={enviando}
          >
            <Text style={styles.botonTexto}>
              {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Text>
          </Pressable>

          <Text style={styles.nota}>
            Por seguridad, el enlace vence en una hora y solo puede utilizarse una vez.
          </Text>
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
  volver: { alignSelf: 'flex-start', paddingVertical: 12 },
  volverTexto: { color: '#1b5e20', fontWeight: 'bold' },
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
    marginBottom: 12,
  },
  info: { backgroundColor: '#fff8e1', borderColor: '#f9a825' },
  error: { backgroundColor: '#ffebee', borderColor: '#c62828' },
  mensajeTexto: { color: '#222', textAlign: 'center', fontWeight: 'bold' },
  label: { color: '#333', fontWeight: 'bold', marginBottom: 7 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#f58220',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  botonDesactivado: { backgroundColor: '#9e9e9e' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  nota: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 13,
    marginTop: 16,
  },
});
