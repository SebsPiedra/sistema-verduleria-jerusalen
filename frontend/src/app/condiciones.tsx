import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { createAppStyles, useAppStyles } from '../theme/appStyles';

const apartados = [
  {
    titulo: '1. Uso permitido',
    texto: 'El sistema se utiliza para consultar productos, realizar pedidos y administrar la operación de Verdulería Jerusalén. Cada persona debe ingresar únicamente con su propia cuenta y proporcionar información correcta.',
  },
  {
    titulo: '2. Protección de la cuenta',
    texto: 'Las contraseñas se almacenan de forma cifrada. El sistema puede solicitar un código temporal enviado al correo y limita intentos repetidos. El usuario debe proteger su contraseña y cerrar la sesión en equipos compartidos.',
  },
  {
    titulo: '3. Datos personales',
    texto: 'El nombre, teléfono, correo y dirección se utilizan únicamente para identificar al cliente, gestionar la entrega y comunicar el estado de sus pedidos. No deben registrarse datos innecesarios.',
  },
  {
    titulo: '4. Pedidos y existencias',
    texto: 'Los precios y existencias mostrados corresponden a los registros disponibles. Un pedido puede ser aceptado, preparado, entregado, rechazado o cancelado según su estado y la disponibilidad real de productos.',
  },
  {
    titulo: '5. Notificaciones',
    texto: 'Con autorización del dispositivo, la aplicación puede enviar avisos sobre pedidos, cambios de estado, productos con stock bajo o agotado y pérdidas importantes. El permiso puede desactivarse desde el navegador o el dispositivo.',
  },
  {
    titulo: '6. Seguridad y trazabilidad',
    texto: 'La aplicación separa los permisos de clientes y administradores, valida los datos recibidos y registra operaciones necesarias para mantener la trazabilidad. Las pruebas deben realizarse en el modo demostración cuando no se desee modificar información real.',
  },
  {
    titulo: '7. Aceptación',
    texto: 'Al crear una cuenta y marcar la casilla correspondiente, el usuario confirma que leyó y acepta estas condiciones. Si no está de acuerdo, no debe completar el registro.',
  },
];

export default function CondicionesScreen() {
  const styles = useAppStyles(baseStyles);
  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={styles.contenido}>
      <View style={[styles.tarjeta, width < 700 && styles.tarjetaMovil]}>
        <Text style={styles.etiqueta}>VERDULERÍA JERUSALÉN</Text>
        <Text style={styles.titulo}>Políticas de seguridad y condiciones de uso</Text>
        <Text style={styles.actualizacion}>Versión vigente: noviembre de 2026</Text>
        <Text style={styles.introduccion}>
          Estas reglas explican cómo se protege la información y cuáles son las responsabilidades al utilizar la aplicación.
        </Text>

        {apartados.map((apartado) => (
          <View key={apartado.titulo} style={styles.apartado}>
            <Text style={styles.subtitulo}>{apartado.titulo}</Text>
            <Text style={styles.texto}>{apartado.texto}</Text>
          </View>
        ))}

        <View style={styles.resumenSeguridad}>
          <Text style={styles.resumenTitulo}>Controles implementados</Text>
          <Text style={styles.texto}>Contraseñas cifradas, autenticación de dos factores, tokens de sesión, control de roles, consultas parametrizadas, límites de solicitudes, HTTPS y ambiente sandbox.</Text>
        </View>

        <Pressable accessibilityRole="button" style={styles.boton} onPress={() => router.back()}>
          <Text style={styles.botonTexto}>Volver</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const baseStyles = createAppStyles({
  pagina: { flex: 1, backgroundColor: '#edf5f4' },
  contenido: { flexGrow: 1, alignItems: 'center', padding: 28 },
  tarjeta: { width: '100%', maxWidth: 920, backgroundColor: '#ffffff', borderRadius: 24, padding: 34, borderWidth: 1, borderColor: '#c9deda' },
  tarjetaMovil: { padding: 20, borderRadius: 18 },
  etiqueta: { color: '#0b8b7f', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  titulo: { color: '#073f39', fontSize: 30, lineHeight: 38, fontWeight: '800', marginTop: 8 },
  actualizacion: { color: '#647b77', marginTop: 6 },
  introduccion: { color: '#345d57', fontSize: 16, lineHeight: 24, marginTop: 20, marginBottom: 10 },
  apartado: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e3eeec' },
  subtitulo: { color: '#084f49', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  texto: { color: '#3e5f5a', fontSize: 15, lineHeight: 23 },
  resumenSeguridad: { marginTop: 22, padding: 20, borderRadius: 16, backgroundColor: '#e8f6f2', borderWidth: 1, borderColor: '#a8d5ca' },
  resumenTitulo: { color: '#076d64', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  boton: { backgroundColor: '#0b8b7f', alignItems: 'center', padding: 15, borderRadius: 14, marginTop: 24 },
  botonTexto: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
});
