import { ReactNode, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';

type AdminLayoutProps = {
  children: ReactNode;
  titulo?: string;
  subtitulo?: string;
};

export default function AdminLayout({ children, titulo, subtitulo }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const usuarioGuardado = localStorage.getItem('usuario');

        if (usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }
      }
    } catch (error) {
      console.log('Error al cargar usuario:', error);
    }
  };

  const limpiarSesion = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('token_cliente');
        localStorage.removeItem('cliente');
        localStorage.removeItem('carrito');
        localStorage.removeItem('carrito_cliente');
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }

      setUsuario(null);

      router.replace('/' as any);

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.replace('/');
        }, 150);
      }
    } catch (error) {
      console.log('Error al limpiar sesión:', error);

      if (typeof window !== 'undefined') {
        window.location.replace('/');
      } else {
        router.replace('/' as any);
      }
    }
  };

  const cerrarSesion = () => {
    if (typeof window !== 'undefined') {
      const confirmar = window.confirm('¿Desea cerrar sesión y salir del sistema?');

      if (confirmar) {
        limpiarSesion();
      }

      return;
    }

    Alert.alert(
      'Cerrar sesión',
      '¿Desea salir del sistema?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: limpiarSesion,
        },
      ]
    );
  };

  const irA = (ruta: string) => {
    router.push(ruta as any);
  };

  const fechaActual = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const menu = [
    { texto: 'Inicio', icono: '🏠', ruta: '/home' },
    { texto: 'Dashboard', icono: '📊', ruta: '/dashboard' },
    { texto: 'Alertas', icono: '🔔', ruta: '/alertas' },
    { texto: 'Inventario', icono: '📦', ruta: '/productos' },
    { texto: 'Ventas', icono: '📈', ruta: '/ventas' },
    { texto: 'Historial', icono: '🧾', ruta: '/historial-ventas' },
    { texto: 'Clientes', icono: '👥', ruta: '/clientes' },
    { texto: 'Pedidos', icono: '📋', ruta: '/pedidos-admin' },
    { texto: 'Proveedores', icono: '🚚', ruta: '/proveedores' },
    { texto: 'Desechos', icono: '🗑️', ruta: '/desechos' },
  ];

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .map((parte: string) => parte[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'A';

  return (
    <View style={styles.pagina}>
      <View style={styles.sidebar}>
        <View style={styles.logoCaja}>
          <Text style={styles.logoTexto}>VERDULERÍA</Text>
          <Text style={styles.logoNombre}>JERUSALÉN</Text>
          <Text style={styles.logoSubtitulo}>
            FRUTAS · VERDURAS · JUGOS NATURALES
          </Text>
        </View>

        <ScrollView
          style={styles.menuScroll}
          contentContainerStyle={styles.menuContenido}
          showsVerticalScrollIndicator={false}
        >
          {menu.map((item) => {
            const activo = pathname === item.ruta;

            return (
              <Pressable
                key={item.ruta}
                style={[styles.menuItem, activo && styles.menuItemActivo]}
                onPress={() => irA(item.ruta)}
              >
                <Text style={styles.menuIcono}>{item.icono}</Text>
                <Text style={[styles.menuTexto, activo && styles.menuTextoActivo]}>
                  {item.texto}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.fraseCaja}>
          <Text style={styles.fraseIcono}>🌿</Text>
          <Text style={styles.fraseTexto}>
            Frescura que se siente,{'\n'}calidad que te acompaña.
          </Text>
        </View>
      </View>

      <View style={styles.contenidoDerecha}>
        <View style={styles.topbar}>
          <View style={styles.titulosTop}>
            <Text style={styles.topTitulo}>
              {titulo || 'Centro de Control Fresco'}
            </Text>

            <Text style={styles.topSubtitulo}>
              {subtitulo || `Hoy es ${fechaActual}`}
            </Text>
          </View>

          <View style={styles.usuarioCaja}>
            <Text style={styles.notificacion}>🔔</Text>

            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales}</Text>
            </View>

            <View style={styles.usuarioInfo}>
              <Text style={styles.usuarioNombre}>
                {usuario?.nombre || 'Administrador'}
              </Text>

              <Text style={styles.usuarioRol}>
                {usuario?.rol || 'Administrador'}
              </Text>
            </View>

            <Pressable style={styles.botonSalir} onPress={cerrarSesion}>
              <Text style={styles.textoSalir}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenido}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#f7f5ee',
    flexDirection: 'row',
  },
  sidebar: {
    width: 244,
    backgroundColor: '#003f22',
    paddingHorizontal: 9,
    paddingTop: 20,
    paddingBottom: 12,
  },
  logoCaja: {
    backgroundColor: '#fffdf6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  logoNombre: {
    color: '#0f4f24',
    fontSize: 27,
    fontWeight: 'bold',
    lineHeight: 31,
  },
  logoSubtitulo: {
    color: '#e07b18',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
  },
  menuContenido: {
    gap: 7,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 14,
    gap: 12,
  },
  menuItemActivo: {
    backgroundColor: '#8fbd3a',
  },
  menuIcono: {
    fontSize: 20,
    width: 24,
  },
  menuTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuTextoActivo: {
    color: '#ffffff',
  },
  fraseCaja: {
    borderTopWidth: 1,
    borderTopColor: '#7cae36',
    paddingTop: 12,
    alignItems: 'center',
  },
  fraseIcono: {
    fontSize: 20,
    marginBottom: 4,
  },
  fraseTexto: {
    color: '#dcedc8',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: 'bold',
    fontSize: 12,
  },
  contenidoDerecha: {
    flex: 1,
    backgroundColor: '#fffdf6',
  },
  topbar: {
    minHeight: 88,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
  },
  titulosTop: {
    flex: 1,
  },
  topTitulo: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
  },
  topSubtitulo: {
    color: '#777',
    marginTop: 4,
  },
  usuarioCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificacion: {
    fontSize: 23,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f4f24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  usuarioInfo: {
    minWidth: 100,
  },
  usuarioNombre: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  usuarioRol: {
    color: '#777',
    fontSize: 12,
  },
  botonSalir: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  textoSalir: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: 28,
  },
});