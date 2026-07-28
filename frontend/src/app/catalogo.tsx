import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

const CARRITO_KEY = 'carrito';
const CARRITO_CLIENTE_KEY = 'carrito_cliente';

export default function CatalogoScreen() {
  const router = useRouter();

  const [cliente, setCliente] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [carritoCantidad, setCarritoCantidad] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  useEffect(() => {
    cargarCliente();
    cargarProductos();
    cargarCarrito();
  }, []);

  const mostrarMensaje = (texto: string, tipo: 'ok' | 'error' | 'info' = 'info') => {
    setMensaje(texto);
    setTipoMensaje(tipo);

    setTimeout(() => {
      setMensaje('');
    }, 3500);
  };

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

  const guardarCarrito = (carrito: any[]) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
      localStorage.setItem(CARRITO_CLIENTE_KEY, JSON.stringify(carrito));
    }

    const totalCantidad = carrito.reduce(
      (total, item) => total + Number(item.cantidad || 0),
      0
    );

    setCarritoCantidad(totalCantidad);
  };

  const cargarCarrito = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const carritoGuardado =
          localStorage.getItem(CARRITO_CLIENTE_KEY) ||
          localStorage.getItem(CARRITO_KEY);

        if (carritoGuardado) {
          const carrito = JSON.parse(carritoGuardado);

          const totalCantidad = carrito.reduce(
            (total: number, item: any) => total + Number(item.cantidad || 0),
            0
          );

          setCarritoCantidad(totalCantidad);
        } else {
          setCarritoCantidad(0);
        }
      }
    } catch (error) {
      console.log('Error al cargar carrito:', error);
      setCarritoCantidad(0);
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
      mostrarMensaje('No se pudo cargar el catálogo de productos.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token_cliente');
      localStorage.removeItem('cliente');
      localStorage.removeItem(CARRITO_KEY);
      localStorage.removeItem(CARRITO_CLIENTE_KEY);
    }

    setCliente(null);
    setCarritoCantidad(0);
    mostrarMensaje('Sesión cerrada correctamente.', 'ok');
    router.replace('/' as any);
  };

  const irInicio = () => {
    router.push('/cliente-home' as any);
  };

  const irCatalogo = () => {
    router.push('/catalogo' as any);
  };

  const irMisPedidos = () => {
    if (!cliente) {
      mostrarMensaje('Debe iniciar sesión para ver sus pedidos.', 'info');
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
      mostrarMensaje('Debe iniciar sesión para realizar un pedido.', 'info');
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
    return Number(producto.precio_venta || producto.precio || producto.precio_unitario || 0);
  };

  const obtenerImagen = (producto: any) => {
    return producto.imagen_url || producto.imagen || producto.url_imagen || null;
  };

  const obtenerUnidad = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerCategoria = (producto: any) => {
    return producto.categoria || producto.nombre_categoria || producto.categoria_nombre || 'General';
  };

  const obtenerDisponible = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? 0);
  };

  const productoActivo = (producto: any) => {
    const estado = String(producto.estado || 'Activo').toLowerCase();
    return estado !== 'inactivo';
  };

  const agregarAlCarrito = (producto: any) => {
    if (!cliente) {
      mostrarMensaje('Para agregar productos debe iniciar sesión como cliente.', 'info');
      router.push('/cliente-login' as any);
      return;
    }

    const disponible = obtenerDisponible(producto);

    if (disponible <= 0) {
      mostrarMensaje(`${obtenerNombre(producto)} está agotado.`, 'error');
      return;
    }

    try {
      const carritoGuardado =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(CARRITO_CLIENTE_KEY) || localStorage.getItem(CARRITO_KEY)
          : null;

      const carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];

      const idProducto = producto.id_producto || producto.id;

      const productoExistente = carrito.find(
        (item: any) => Number(item.id_producto) === Number(idProducto)
      );

      if (productoExistente) {
        if (Number(productoExistente.cantidad) + 1 > disponible) {
          mostrarMensaje(`No hay más unidades disponibles de ${obtenerNombre(producto)}.`, 'error');
          return;
        }

        productoExistente.cantidad = Number(productoExistente.cantidad) + 1;
        productoExistente.subtotal = Number(productoExistente.cantidad) * Number(productoExistente.precio);
      } else {
        carrito.push({
          id_producto: idProducto,
          nombre: obtenerNombre(producto),
          precio: obtenerPrecio(producto),
          cantidad: 1,
          subtotal: obtenerPrecio(producto),
          imagen_url: obtenerImagen(producto),
          unidad_medida: obtenerUnidad(producto),
          disponible,
        });
      }

      guardarCarrito(carrito);
      mostrarMensaje(`${obtenerNombre(producto)} fue agregado al carrito.`, 'ok');
    } catch (error) {
      console.log('Error al agregar al carrito:', error);
      mostrarMensaje('No se pudo agregar el producto al carrito.', 'error');
    }
  };

  const categorias = [
    'Todos',
    ...Array.from(new Set(productos.map((producto) => obtenerCategoria(producto)))),
  ];

  const productosFiltrados = productos.filter((producto) => {
    const nombre = obtenerNombre(producto).toLowerCase();
    const categoria = obtenerCategoria(producto);
    const precio = obtenerPrecio(producto);

    const coincideBusqueda = nombre.includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaSeleccionada === 'Todos' || categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria && precio > 0 && productoActivo(producto);
  });

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={styles.contenido}>
      <View style={styles.contenedorPrincipal}>
        <View style={styles.header}>
          <Pressable onPress={irInicio} style={styles.logoArea}>
            <Text style={styles.logoTexto}>VERDULERÍA</Text>
            <Text style={styles.logoNombre}>JERUSALÉN</Text>
            <Text style={styles.logoSubtitulo}>FRUTAS · VERDURAS · JUGOS NATURALES</Text>
          </Pressable>

          <View style={styles.menu}>
            <Pressable onPress={irInicio}>
              <Text style={styles.menuTexto}>Inicio</Text>
            </Pressable>

            <Pressable onPress={irCatalogo}>
              <Text style={[styles.menuTexto, styles.menuActivo]}>Catálogo</Text>
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

        <View style={styles.bannerCatalogo}>
          <Text style={styles.bannerTitulo}>Catálogo de productos</Text>
          <Text style={styles.bannerTexto}>
            Frutas, verduras y jugos naturales seleccionados para su hogar.
          </Text>
        </View>

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

        <View style={styles.filtros}>
          <TextInput
            style={styles.inputBusqueda}
            placeholder="Buscar producto..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriasFila}>
              {categorias.map((categoria) => (
                <Pressable
                  key={categoria}
                  style={[
                    styles.categoriaBoton,
                    categoriaSeleccionada === categoria && styles.categoriaBotonActivo,
                  ]}
                  onPress={() => setCategoriaSeleccionada(categoria)}
                >
                  <Text
                    style={[
                      styles.categoriaBotonTexto,
                      categoriaSeleccionada === categoria && styles.categoriaBotonTextoActivo,
                    ]}
                  >
                    {categoria}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.catalogoContenido}>
          {cargando ? (
            <Text style={styles.mensajeVacio}>Cargando catálogo...</Text>
          ) : productosFiltrados.length === 0 ? (
            <Text style={styles.mensajeVacio}>No hay productos disponibles.</Text>
          ) : (
            <View style={styles.productosGrid}>
              {productosFiltrados.map((producto, index) => {
                const imagen = obtenerImagen(producto);
                const disponible = obtenerDisponible(producto);
                const agotado = disponible <= 0;

                return (
                  <View
                    key={producto.id_producto || producto.id || index}
                    style={styles.productoCard}
                  >
                    {agotado && (
                      <View style={styles.etiquetaAgotado}>
                        <Text style={styles.etiquetaAgotadoTexto}>Agotado</Text>
                      </View>
                    )}

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

                    <Text style={styles.categoriaProducto}>
                      {obtenerCategoria(producto)}
                    </Text>

                    <Text style={styles.unidadProducto}>
                      Disponible: {disponible} {obtenerUnidad(producto)}
                    </Text>

                    <Text style={styles.precioProducto}>
                      {formatoColones(obtenerPrecio(producto))}
                    </Text>

                    <Pressable
                      style={[styles.botonAgregar, agotado && styles.botonAgotado]}
                      onPress={() => agregarAlCarrito(producto)}
                      disabled={agotado}
                    >
                      <Text style={styles.botonAgregarTexto}>
                        {agotado ? 'Producto agotado' : 'Agregar al carrito'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
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
    paddingVertical: 20,
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
  bannerCatalogo: {
    backgroundColor: '#f4f1dc',
    paddingVertical: 42,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  bannerTitulo: {
    color: '#063f22',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerTexto: {
    color: '#333',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 10,
  },
  mensajeCaja: {
    marginHorizontal: 24,
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  filtros: {
    padding: 24,
    gap: 16,
  },
  inputBusqueda: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
  },
  categoriasFila: {
    flexDirection: 'row',
    gap: 10,
  },
  categoriaBoton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#f7f2dc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d7cfae',
  },
  categoriaBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  categoriaBotonTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  categoriaBotonTextoActivo: {
    color: '#ffffff',
  },
  catalogoContenido: {
    paddingHorizontal: 32,
    paddingBottom: 30,
  },
  mensajeVacio: {
    textAlign: 'center',
    color: '#555',
    marginTop: 30,
    fontWeight: 'bold',
  },
  productosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  productoCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ebe4d3',
    position: 'relative',
  },
  etiquetaAgotado: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#c62828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 2,
  },
  etiquetaAgotadoTexto: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  imagenProductoArea: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenProducto: {
    width: '100%',
    height: 115,
  },
  imagenEmoji: {
    fontSize: 72,
  },
  nombreProducto: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 16,
    minHeight: 42,
  },
  categoriaProducto: {
    color: '#4f8f20',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unidadProducto: {
    color: '#555',
    fontSize: 13,
    marginTop: 3,
  },
  precioProducto: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  botonAgregar: {
    backgroundColor: '#1b5e20',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  botonAgotado: {
    backgroundColor: '#9e9e9e',
  },
  botonAgregarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});