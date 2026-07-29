import { ReactNode, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();

  const [anchoPantalla, setAnchoPantalla] = useState(width);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const actualizarAncho = () => {
      if (typeof window !== 'undefined') {
        setAnchoPantalla(window.innerWidth);
      } else {
        setAnchoPantalla(width);
      }
    };

    actualizarAncho();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', actualizarAncho);

      return () => {
        window.removeEventListener('resize', actualizarAncho);
      };
    }
  }, [width]);

  const esTelefono = anchoPantalla < 900;

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

    Alert.alert('Cerrar sesión', '¿Desea salir del sistema?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: limpiarSesion,
      },
    ]);
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
    <View style={[styles.pagina, esTelefono && styles.paginaMovil]}>
      <View style={[styles.sidebar, esTelefono && styles.sidebarMovil]}>
        <View style={[styles.logoCaja, esTelefono && styles.logoCajaMovil]}>
          <Text style={[styles.logoTexto, esTelefono && styles.logoTextoMovil]}>
            VERDULERÍA
          </Text>

          <Text style={[styles.logoNombre, esTelefono && styles.logoNombreMovil]}>
            JERUSALÉN
          </Text>

          {!esTelefono && (
            <Text style={styles.logoSubtitulo}>
              FRUTAS · VERDURAS · JUGOS NATURALES
            </Text>
          )}
        </View>

        {esTelefono ? (
          <View style={styles.menuMovilGrid}>
            {menu.map((item) => {
              const activo = pathname === item.ruta;

              return (
                <Pressable
                  key={item.ruta}
                  style={[
                    styles.menuItemMovilGrid,
                    activo && styles.menuItemActivo,
                  ]}
                  onPress={() => irA(item.ruta)}
                >
                  <Text style={styles.menuIconoMovil}>{item.icono}</Text>
                  <Text style={styles.menuTextoMovilGrid}>{item.texto}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
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
        )}

        {!esTelefono && (
          <View style={styles.fraseCaja}>
            <Text style={styles.fraseIcono}>🌿</Text>
            <Text style={styles.fraseTexto}>
              Frescura que se siente,{'\n'}calidad que te acompaña.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.contenidoDerecha, esTelefono && styles.contenidoDerechaMovil]}>
        <View style={[styles.topbar, esTelefono && styles.topbarMovil]}>
          <View style={styles.titulosTop}>
            <Text style={[styles.topTitulo, esTelefono && styles.topTituloMovil]}>
              {titulo || 'Centro de Control Fresco'}
            </Text>

            <Text style={[styles.topSubtitulo, esTelefono && styles.topSubtituloMovil]}>
              {subtitulo || `Hoy es ${fechaActual}`}
            </Text>
          </View>

          <View style={[styles.usuarioCaja, esTelefono && styles.usuarioCajaMovil]}>
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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContenido,
            esTelefono && styles.scrollContenidoMovil,
          ]}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
        >
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
  paginaMovil: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 244,
    backgroundColor: '#003f22',
    paddingHorizontal: 9,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sidebarMovil: {
    width: '100%',
    backgroundColor: '#003f22',
    paddingHorizontal: 10,
    paddingTop: 10,
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
  logoCajaMovil: {
    paddingVertical: 8,
    marginBottom: 10,
  },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  logoTextoMovil: {
    fontSize: 10,
    letterSpacing: 3,
  },
  logoNombre: {
    color: '#0f4f24',
    fontSize: 27,
    fontWeight: 'bold',
    lineHeight: 31,
  },
  logoNombreMovil: {
    fontSize: 25,
    lineHeight: 28,
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
  menuMovilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 14,
    gap: 12,
  },
  menuItemMovilGrid: {
    width: '31%',
    minHeight: 42,
    backgroundColor: '#064b29',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  menuItemActivo: {
    backgroundColor: '#8fbd3a',
  },
  menuIcono: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuIconoMovil: {
    fontSize: 17,
    marginBottom: 1,
  },
  menuTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuTextoMovilGrid: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
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
    minWidth: 0,
  },
  contenidoDerechaMovil: {
    width: '100%',
    maxWidth: '100%',
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
  topbarMovil: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  titulosTop: {
    flex: 1,
  },
  topTitulo: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
  },
  topTituloMovil: {
    fontSize: 20,
  },
  topSubtitulo: {
    color: '#777',
    marginTop: 4,
  },
  topSubtituloMovil: {
    fontSize: 13,
  },
  usuarioCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usuarioCajaMovil: {
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    flex: 1,
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
    width: '100%',
  },
  scrollContenido: {
    padding: 28,
    width: '100%',
    maxWidth: '100%',
  },
  scrollContenidoMovil: {
    padding: 12,
    paddingBottom: 24,
  },
});
