import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

const BANNER_CLIENTE = 'https://verduleria-sebas.sirv.com/logos/logo.png';

const IMG_FRUTAS = 'https://verduleria-sebas.sirv.com/productos/banano.png';
const IMG_VERDURAS = 'https://verduleria-sebas.sirv.com/productos/lechuga.jpg';
const IMG_JUGOS = 'https://verduleria-sebas.sirv.com/productos/jugos.png';

export default function ClienteHomeScreen() {
  const router = useRouter();

  const [cliente, setCliente] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [carritoCantidad, setCarritoCantidad] = useState(0);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarCliente();
    cargarProductos();
    cargarCarrito();
  }, []);

  const cargarCliente = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const clienteGuardado = localStorage.getItem('cliente');

        if (clienteGuardado) {
          setCliente(JSON.parse(clienteGuardado));
        }
      }
    } catch (error) {
      console.log('Error al cargar cliente:', error);
    }
  };

  const cargarCarrito = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const carritoGuardado = localStorage.getItem('carrito');

        if (carritoGuardado) {
          const carrito = JSON.parse(carritoGuardado);
          setCarritoCantidad(carrito.length);
        }
      }
    } catch (error) {
      console.log('Error al cargar carrito:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const respuesta = await api.get('/productos');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.productos || [];

      setProductos(datos);
    } catch (error: any) {
      console.log('Error al cargar productos:', error?.response?.data || error);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token_cliente');
        localStorage.removeItem('cliente');
      }

      setCliente(null);
      Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente.');
      router.replace('/' as any);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  const irInicio = () => {
    router.push('/cliente-home' as any);
  };

  const irCatalogo = () => {
    router.push('/catalogo' as any);
  };

  const irMisPedidos = () => {
    if (!cliente) {
      router.push('/cliente-login' as any);
      return;
    }

    router.push('/cliente-mis-pedidos' as any);
  };

  const irLoginCliente = () => {
    router.push('/cliente-login' as any);
  };

  const irPedido = () => {
    if (!cliente) {
      router.push('/cliente-login' as any);
      return;
    }

    router.push('/cliente-pedido' as any);
  };

  const formatoColones = (valor: any) => {
    const numero = Number(valor || 0);
    return `₡${numero.toLocaleString('es-CR')}`;
  };

  const obtenerNombre = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerPrecio = (producto: any) => {
    return producto.precio_venta || producto.precio || producto.precio_unitario || 0;
  };

  const obtenerImagen = (producto: any) => {
    return producto.imagen_url || producto.imagen || producto.url_imagen || null;
  };

  const obtenerUnidad = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'unidad';
  };

  const agregarAlCarrito = (producto: any) => {
    if (!cliente) {
      Alert.alert(
        'Inicio de sesión requerido',
        'Para agregar productos al carrito debe iniciar sesión como cliente.'
      );
      router.push('/cliente-login' as any);
      return;
    }

    try {
      const carritoGuardado =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('carrito')
          : null;

      const carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];

      const nuevoProducto = {
        id_producto: producto.id_producto || producto.id,
        nombre: obtenerNombre(producto),
        precio: obtenerPrecio(producto),
        cantidad: 1,
        imagen_url: obtenerImagen(producto),
      };

      carrito.push(nuevoProducto);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('carrito', JSON.stringify(carrito));
      }

      setCarritoCantidad(carrito.length);

      Alert.alert('Producto agregado', 'El producto fue agregado al carrito.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el producto al carrito.');
    }
  };

  const productosDestacados = productos
    .filter((producto) => {
      const precio = Number(obtenerPrecio(producto));
      const estado = String(producto.estado || 'Activo').toLowerCase();

      return precio > 0 && estado !== 'inactivo';
    })
    .slice(0, 6);

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={styles.contenido}>
      <View style={styles.contenedorPrincipal}>
        <View style={styles.header}>
          <Pressable onPress={irInicio} style={styles.logoArea}>
  <View>
    <Text style={styles.logoTexto}>VERDULERÍA</Text>
    <Text style={styles.logoNombre}>JERUSALÉN</Text>
    <Text style={styles.logoSubtitulo}>FRUTAS · VERDURAS · JUGOS NATURALES</Text>
  </View>
</Pressable>

          <View style={styles.menu}>
            <Pressable onPress={irInicio}>
              <Text style={[styles.menuTexto, styles.menuActivo]}>Inicio</Text>
            </Pressable>

            <Pressable onPress={irCatalogo}>
              <Text style={styles.menuTexto}>Catálogo</Text>
            </Pressable>

            <Pressable onPress={irMisPedidos}>
              <Text style={styles.menuTexto}>Mis pedidos</Text>
            </Pressable>
          </View>

          <View style={styles.acciones}>
            {cliente ? (
              <Pressable onPress={cerrarSesion} style={styles.botonPerfil}>
                <Text style={styles.perfilIcono}>👤</Text>
                <Text style={styles.textoSalir}>Salir</Text>
              </Pressable>
            ) : (
              <Pressable onPress={irLoginCliente} style={styles.botonPerfil}>
                <Text style={styles.perfilIcono}>👤</Text>
                <Text style={styles.textoSalir}>Entrar</Text>
              </Pressable>
            )}

            <Pressable onPress={irPedido} style={styles.carritoBoton}>
              <Text style={styles.carritoIcono}>🛒</Text>

              <View style={styles.carritoNumero}>
                <Text style={styles.carritoNumeroTexto}>{carritoCantidad}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.bannerArea} onPress={irCatalogo}>
          <Image
            source={{ uri: BANNER_CLIENTE }}
            style={styles.bannerImagen}
            resizeMode="cover"
          />
        </Pressable>

        <View style={styles.categorias}>
          <Pressable style={styles.categoriaCard} onPress={irCatalogo}>
            <Image
              source={{ uri: IMG_FRUTAS }}
              style={styles.categoriaImagen}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.categoriaTitulo}>Frutas</Text>
              <Text style={styles.categoriaTexto}>Siempre frescas</Text>
            </View>
            <Text style={styles.categoriaFlecha}>›</Text>
          </Pressable>

          <View style={styles.separador} />

          <Pressable style={styles.categoriaCard} onPress={irCatalogo}>
            <Image
              source={{ uri: IMG_VERDURAS }}
              style={styles.categoriaImagen}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.categoriaTitulo}>Verduras</Text>
              <Text style={styles.categoriaTexto}>De la mejor calidad</Text>
            </View>
            <Text style={styles.categoriaFlecha}>›</Text>
          </Pressable>

          <View style={styles.separador} />

          <Pressable style={styles.categoriaCard} onPress={irCatalogo}>
            <Image
              source={{ uri: IMG_JUGOS }}
              style={styles.categoriaImagen}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.categoriaTitulo}>Jugos</Text>
              <Text style={styles.categoriaTexto}>Naturales y deliciosos</Text>
            </View>
            <Text style={styles.categoriaFlecha}>›</Text>
          </Pressable>
        </View>

        <View style={styles.seccionProductos}>
          <View style={styles.tituloFila}>
            <Text style={styles.tituloSeccion}>Productos destacados</Text>

            <Pressable onPress={irCatalogo}>
              <Text style={styles.verTodo}>Ver catálogo completo ›</Text>
            </Pressable>
          </View>

          {cargando ? (
            <Text style={styles.mensaje}>Cargando productos...</Text>
          ) : productosDestacados.length === 0 ? (
            <Text style={styles.mensaje}>No hay productos disponibles todavía.</Text>
          ) : (
            <View style={styles.productosFila}>
              {productosDestacados.map((producto, index) => {
                const imagen = obtenerImagen(producto);

                return (
                  <View
                    key={producto.id_producto || producto.id || index}
                    style={styles.productoCard}
                  >
                    <View style={styles.imagenProductoArea}>
                      {imagen ? (
                        <Image
                          source={{ uri: imagen }}
                          style={styles.imagenProducto}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.imagenEmoji}>🥦</Text>
                      )}
                    </View>

                    <Text style={styles.nombreProducto} numberOfLines={2}>
                      {obtenerNombre(producto)}
                    </Text>

                    <Text style={styles.unidadProducto}>
                      1 {obtenerUnidad(producto)}
                    </Text>

                    <Text style={styles.precioProducto}>
                      {formatoColones(obtenerPrecio(producto))}
                    </Text>

                    <View style={styles.compraFila}>
                      <View style={styles.cantidadCaja}>
                        <Text style={styles.cantidadTexto}>−</Text>
                        <Text style={styles.cantidadTexto}>1</Text>
                      </View>

                      <Pressable
                        style={styles.botonCarritoProducto}
                        onPress={() => agregarAlCarrito(producto)}
                      >
                        <Text style={styles.botonCarritoTexto}>🛒</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footerCliente}>
          <Text style={styles.footerTexto}>
            {cliente
              ? `Sesión activa: ${cliente.nombre || cliente.correo}`
              : 'Puede ver el catálogo sin iniciar sesión. Para realizar pedidos debe ingresar como cliente.'}
          </Text>
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
    alignItems: 'center',
    padding: 20,
  },
  contenedorPrincipal: {
    width: '100%',
    maxWidth: 1200,
    backgroundColor: '#fffdf6',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ebe4d3',
  },
  header: {
    minHeight: 120,
    backgroundColor: '#fffdf6',
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
logoArea: {
  width: 280,
  justifyContent: 'center',
},
logoTexto: {
  color: '#0f4f24',
  fontSize: 18,
  letterSpacing: 3,
  fontWeight: 'bold',
},
logoNombre: {
  color: '#0f4f24',
  fontSize: 36,
  fontWeight: 'bold',
  lineHeight: 38,
},
logoSubtitulo: {
  color: '#e07b18',
  fontSize: 10,
  fontWeight: 'bold',
  marginTop: 3,
},
  menu: {
    flexDirection: 'row',
    gap: 36,
    alignItems: 'center',
  },
  menuTexto: {
    color: '#1e1e1e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuActivo: {
    color: '#1b5e20',
    borderBottomWidth: 3,
    borderBottomColor: '#72a629',
    paddingBottom: 10,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  botonPerfil: {
    alignItems: 'center',
  },
  perfilIcono: {
    fontSize: 28,
  },
  textoSalir: {
    fontSize: 12,
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  carritoBoton: {
    position: 'relative',
  },
  carritoIcono: {
    fontSize: 34,
  },
  carritoNumero: {
    position: 'absolute',
    top: -8,
    right: -9,
    backgroundColor: '#0f4f24',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carritoNumeroTexto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bannerArea: {
    width: '100%',
    height: 400,
    backgroundColor: '#f4f1dc',
  },
  bannerImagen: {
    width: '100%',
    height: '100%',
  },
  categorias: {
    margin: 28,
    padding: 18,
    backgroundColor: '#f7f2dc',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
  },
  categoriaImagen: {
    width: 70,
    height: 70,
  },
  categoriaTitulo: {
    color: '#1b5e20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriaTexto: {
    color: '#555',
    fontSize: 13,
  },
  categoriaFlecha: {
    color: '#f58220',
    fontSize: 32,
    fontWeight: 'bold',
  },
  separador: {
    width: 1,
    height: 70,
    backgroundColor: '#d7cfae',
  },
  seccionProductos: {
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  tituloFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloSeccion: {
    color: '#1b5e20',
    fontSize: 26,
    fontWeight: 'bold',
    borderBottomWidth: 3,
    borderBottomColor: '#7cae36',
    paddingBottom: 6,
  },
  verTodo: {
    color: '#4f8f20',
    fontWeight: 'bold',
  },
  mensaje: {
    textAlign: 'center',
    color: '#555',
    marginTop: 30,
    fontWeight: 'bold',
  },
  productosFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 24,
  },
  productoCard: {
    width: 190,
    backgroundColor: '#fffdf6',
    borderRadius: 16,
    padding: 12,
  },
  imagenProductoArea: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenProducto: {
    width: '100%',
    height: 105,
  },
  imagenEmoji: {
    fontSize: 70,
  },
  nombreProducto: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 15,
    minHeight: 38,
  },
  unidadProducto: {
    color: '#555',
    fontSize: 13,
    marginTop: 2,
  },
  precioProducto: {
    color: '#0f4f24',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 10,
  },
  compraFila: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cantidadCaja: {
    borderWidth: 1,
    borderColor: '#7cae36',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 18,
  },
  cantidadTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonCarritoProducto: {
    backgroundColor: '#1b5e20',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonCarritoTexto: {
    color: '#ffffff',
    fontSize: 16,
  },
  footerCliente: {
    padding: 18,
    backgroundColor: '#eef6e8',
    alignItems: 'center',
  },
  footerTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});