import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { obtenerCategoriaProducto } from '../utils/productos';
import AdminLayout from '../components/AdminLayout';

export default function ProductosScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;

  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  useEffect(() => {
    cargarProductos();
    // La lista se vuelve a cargar explícitamente después de cada acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarMensaje = (
    texto: string,
    tipo: 'ok' | 'error' | 'info' = 'info'
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);

    setTimeout(() => {
      setMensaje('');
    }, 4000);
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuesta = await api.get('/productos');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.productos || [];

      setProductos(datos);
    } catch (error: any) {
      console.log('Error al cargar productos:', error?.response?.data || error);
      mostrarMensaje('No se pudieron cargar los productos.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const formatoColones = (valor: any) => {
    const numero = Number(valor || 0);

    return `₡${numero.toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const obtenerNombre = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerCategoria = (producto: any) => {
    return obtenerCategoriaProducto(producto);
  };

  const obtenerPrecio = (producto: any) => {
    return Number(producto.precio_venta || producto.precio || producto.precio_unitario || 0);
  };

  const obtenerPrecioCompra = (producto: any) => {
    return Number(producto.precio_compra || 0);
  };

  const obtenerCantidad = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? 0);
  };

  const obtenerStockMinimo = (producto: any) => {
    return Number(producto.stock_minimo || 5);
  };

  const obtenerUnidad = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerImagen = (producto: any) => {
    return producto.imagen_url || producto.imagen || producto.url_imagen || '';
  };

  const obtenerEstadoProducto = (producto: any) => {
    const estado = String(producto.estado || 'Activo');

    if (estado.toLowerCase() === 'inactivo') {
      return 'Inactivo';
    }

    const cantidad = obtenerCantidad(producto);
    const minimo = obtenerStockMinimo(producto);

    if (cantidad <= 0) {
      return 'Sin stock';
    }

    if (cantidad <= minimo) {
      return 'Stock bajo';
    }

    return 'En buen estado';
  };

  const obtenerEstiloEstado = (estado: string) => {
    if (estado === 'Sin stock') {
      return {
        badge: styles.estadoSinStock,
        punto: styles.puntoRojo,
      };
    }

    if (estado === 'Stock bajo') {
      return {
        badge: styles.estadoBajo,
        punto: styles.puntoNaranja,
      };
    }

    if (estado === 'Inactivo') {
      return {
        badge: styles.estadoInactivo,
        punto: styles.puntoGris,
      };
    }

    return {
      badge: styles.estadoBueno,
      punto: styles.puntoVerde,
    };
  };

  const irRegistrar = () => {
    router.push('/registrar-producto' as any);
  };

  const irEditar = (producto: any) => {
    const id = producto.id_producto || producto.id;

    if (!id) {
      mostrarMensaje('No se pudo abrir el producto porque no tiene ID.', 'error');
      return;
    }

    router.push({
      pathname: '/editar-producto',
      params: { id: String(id) },
    } as any);
  };

  const categorias = [
    'Todas',
    ...Array.from(new Set(productos.map((producto) => obtenerCategoria(producto)))),
  ];

  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      obtenerNombre(producto).toLowerCase().includes(texto) ||
      obtenerCategoria(producto).toLowerCase().includes(texto);

    const estadoProducto = obtenerEstadoProducto(producto);

    const coincideEstado =
      filtroEstado === 'Todos' || estadoProducto === filtroEstado;

    const coincideCategoria =
      filtroCategoria === 'Todas' || obtenerCategoria(producto) === filtroCategoria;

    return coincideBusqueda && coincideEstado && coincideCategoria;
  });

  const totalProductos = productos.length;

  const totalActivos = productos.filter(
    (producto) => String(producto.estado || 'Activo').toLowerCase() !== 'inactivo'
  ).length;

  const totalBuenEstado = productos.filter(
    (producto) => obtenerEstadoProducto(producto) === 'En buen estado'
  ).length;

  const totalStockBajo = productos.filter(
    (producto) => obtenerEstadoProducto(producto) === 'Stock bajo'
  ).length;

  const totalSinStock = productos.filter(
    (producto) => obtenerEstadoProducto(producto) === 'Sin stock'
  ).length;

  const valorInventario = productos.reduce((total, producto) => {
    return total + obtenerCantidad(producto) * obtenerPrecioCompra(producto);
  }, 0);

  return (
    <AdminLayout
      titulo="Inventario"
      subtitulo="Control de productos, cantidades, precios y estado del inventario"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Inventario de productos 📦</Text>
          <Text style={styles.subtitulo}>
            Administre productos, precios, imágenes y disponibilidad.
          </Text>
        </View>

        <Pressable style={styles.botonAgregar} onPress={irRegistrar}>
          <Text style={styles.botonAgregarTexto}>＋ Agregar producto</Text>
        </Pressable>
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

      <View style={[styles.tarjetas, esTelefono && styles.tarjetasTelefono]}>
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIcono}>🧺</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Productos totales</Text>
            <Text style={styles.tarjetaNumero}>{totalProductos}</Text>
            <Text style={styles.tarjetaDetalle}>Registrados</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>✓</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Activos</Text>
            <Text style={styles.tarjetaNumero}>{totalActivos}</Text>
            <Text style={styles.tarjetaDetalle}>Disponibles en sistema</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⚠</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Stock bajo</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{totalStockBajo}</Text>
            <Text style={styles.tarjetaDetalle}>Revisar reposición</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>!</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Sin stock</Text>
            <Text style={styles.tarjetaNumeroRojo}>{totalSinStock}</Text>
            <Text style={styles.tarjetaDetalle}>Agotados</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardInventario}>
        <View style={[styles.filtrosFila, esTelefono && styles.filtrosTelefono]}>
          <TextInput
            style={styles.inputBuscar}
            placeholder="Buscar producto o categoría..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
            <View style={[styles.filtrosHorizontales, esTelefono && styles.opcionesTelefono]}>
              {['Todos', 'En buen estado', 'Stock bajo', 'Sin stock', 'Inactivo'].map((estado) => (
                <Pressable
                  key={estado}
                  style={[
                    styles.filtroBoton,
                    filtroEstado === estado && styles.filtroBotonActivo,
                  ]}
                  onPress={() => setFiltroEstado(estado)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      filtroEstado === estado && styles.filtroTextoActivo,
                    ]}
                  >
                    {estado}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
          <View style={[styles.categoriasFila, esTelefono && styles.opcionesTelefono]}>
            {categorias.map((categoria) => (
              <Pressable
                key={categoria}
                style={[
                  styles.categoriaBoton,
                  filtroCategoria === categoria && styles.categoriaBotonActivo,
                ]}
                onPress={() => setFiltroCategoria(categoria)}
              >
                <Text
                  style={[
                    styles.categoriaTexto,
                    filtroCategoria === categoria && styles.categoriaTextoActivo,
                  ]}
                >
                  {categoria}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.accionesFila, esTelefono && styles.accionesTelefono]}>
          <Text style={styles.resultadoTexto}>
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </Text>

          <Pressable style={styles.botonActualizar} onPress={cargarProductos}>
            <Text style={styles.botonActualizarTexto}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colProducto]}>Producto</Text>
          <Text style={[styles.th, styles.colCategoria]}>Categoría</Text>
          <Text style={[styles.th, styles.colCantidad]}>Cantidad</Text>
          <Text style={[styles.th, styles.colUnidad]}>Unidad</Text>
          <Text style={[styles.th, styles.colPrecio]}>Precio venta</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
          <Text style={[styles.th, styles.colAcciones]}>Acciones</Text>
        </View>

        {productosFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>📦</Text>
            <Text style={styles.vacioTitulo}>
              {cargando ? 'Cargando productos...' : 'No hay productos para mostrar'}
            </Text>
            <Text style={styles.vacioTexto}>
              Revise los filtros o registre un nuevo producto.
            </Text>
          </View>
        ) : (
          productosFiltrados.map((producto, index) => {
            const imagen = obtenerImagen(producto);
            const estado = obtenerEstadoProducto(producto);
            const estilosEstado = obtenerEstiloEstado(estado);

            return (
              <View key={producto.id_producto || producto.id || index} style={styles.tablaRow}>
                <View style={[styles.colProducto, styles.productoInfo]}>
                  <View style={styles.imagenArea}>
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

                  <View style={styles.nombreArea}>
                    <Text style={styles.nombreProducto} numberOfLines={1}>
                      {obtenerNombre(producto)}
                    </Text>

                    <Text style={styles.descripcionProducto} numberOfLines={1}>
                      {producto.descripcion || 'Producto fresco de verdulería'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.td, styles.colCategoria]}>
                  {obtenerCategoria(producto)}
                </Text>

                <Text style={[styles.tdCentro, styles.colCantidad]}>
                  {obtenerCantidad(producto)}
                </Text>

                <Text style={[styles.tdCentro, styles.colUnidad]}>
                  {obtenerUnidad(producto)}
                </Text>

                <Text style={[styles.tdCentro, styles.colPrecio]}>
                  {formatoColones(obtenerPrecio(producto))}
                </Text>

                <View style={styles.colEstado}>
                  <View style={[styles.estadoBadge, estilosEstado.badge]}>
                    <View style={[styles.puntoEstado, estilosEstado.punto]} />
                    <Text style={styles.estadoTexto}>{estado}</Text>
                  </View>
                </View>

                <View style={styles.colAcciones}>
                  <Pressable
                    style={styles.botonEditar}
                    onPress={() => irEditar(producto)}
                  >
                    <Text style={styles.botonEditarTexto}>Editar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={[styles.footerResumen, esTelefono && styles.footerResumenTelefono]}>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>🌿</Text>
          <View>
            <Text style={styles.footerLabel}>Productos en buen estado</Text>
            <Text style={styles.footerValor}>{totalBuenEstado}</Text>
          </View>
        </View>

        <View style={[styles.footerSeparador, esTelefono && styles.footerSeparadorTelefono]} />

        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>⚠️</Text>
          <View>
            <Text style={styles.footerLabel}>Requieren atención</Text>
            <Text style={styles.footerValor}>{totalStockBajo + totalSinStock}</Text>
          </View>
        </View>

        <View style={[styles.footerSeparador, esTelefono && styles.footerSeparadorTelefono]} />

        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>💰</Text>
          <View>
            <Text style={styles.footerLabel}>Valor compra estimado</Text>
            <Text style={styles.footerValor}>{formatoColones(valorInventario)}</Text>
          </View>
        </View>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    color: '#063f22',
    fontSize: 40,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#666',
    fontSize: 16,
    marginTop: 6,
  },
  heroTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  tarjetasTelefono: {
    flexDirection: 'column',
  },
  filtrosTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  accionesTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  botonAgregar: {
    backgroundColor: '#7bb51e',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  botonAgregarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mensajeCaja: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
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
    textAlign: 'center',
    color: '#1e1e1e',
    fontWeight: 'bold',
  },
  tarjetas: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  tarjeta: {
    flex: 1,
    minWidth: 190,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tarjetaIcono: {
    fontSize: 35,
  },
  tarjetaIconoVerde: {
    color: '#7bb51e',
    borderWidth: 3,
    borderColor: '#7bb51e',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaIconoNaranja: {
    color: '#f58220',
    borderWidth: 3,
    borderColor: '#f58220',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaIconoRojo: {
    color: '#d32f2f',
    borderWidth: 3,
    borderColor: '#d32f2f',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  tarjetaNumero: {
    color: '#0f4f24',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaNumeroNaranja: {
    color: '#f58220',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaNumeroRojo: {
    color: '#d32f2f',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaDetalle: {
    color: '#777',
    fontSize: 12,
  },
  cardInventario: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  filtrosFila: {
    gap: 14,
    marginBottom: 14,
  },
  inputBuscar: {
    borderWidth: 1,
    borderColor: '#e0d7c2',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fffdf6',
  },
  filtrosHorizontales: {
    flexDirection: 'row',
    gap: 10,
  },
  opcionesTelefono: {
    flexWrap: 'wrap',
  },
  filtroBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  filtroBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  filtroTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  filtroTextoActivo: {
    color: '#ffffff',
  },
  categoriasFila: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  categoriaBoton: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  categoriaBotonActivo: {
    backgroundColor: '#7bb51e',
    borderColor: '#7bb51e',
  },
  categoriaTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  categoriaTextoActivo: {
    color: '#ffffff',
  },
  accionesFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultadoTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
  botonActualizar: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  botonActualizarTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingVertical: 12,
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0eadb',
  },
  th: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  td: {
    color: '#333',
    fontSize: 13,
  },
  tdCentro: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
  },
  colProducto: {
    flex: 2.3,
  },
  colCategoria: {
    flex: 1.2,
  },
  colCantidad: {
    flex: 1,
    textAlign: 'center',
  },
  colUnidad: {
    flex: 0.8,
    textAlign: 'center',
  },
  colPrecio: {
    flex: 1.1,
    textAlign: 'center',
  },
  colEstado: {
    flex: 1.5,
    alignItems: 'center',
  },
  colAcciones: {
    flex: 1,
    alignItems: 'center',
  },
  productoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagenArea: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenProducto: {
    width: 40,
    height: 40,
  },
  imagenEmoji: {
    fontSize: 30,
  },
  nombreArea: {
    flex: 1,
  },
  nombreProducto: {
    color: '#333',
    fontWeight: 'bold',
  },
  descripcionProducto: {
    color: '#777',
    fontSize: 12,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  estadoBueno: {
    backgroundColor: '#eef8e8',
  },
  estadoBajo: {
    backgroundColor: '#fff3e0',
  },
  estadoSinStock: {
    backgroundColor: '#ffebee',
  },
  estadoInactivo: {
    backgroundColor: '#eeeeee',
  },
  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  puntoVerde: {
    backgroundColor: '#2e7d32',
  },
  puntoNaranja: {
    backgroundColor: '#f58220',
  },
  puntoRojo: {
    backgroundColor: '#d32f2f',
  },
  puntoGris: {
    backgroundColor: '#777',
  },
  estadoTexto: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  botonEditar: {
    backgroundColor: '#0f4f24',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
  },
  botonEditarTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vacio: {
    padding: 30,
    alignItems: 'center',
  },
  vacioIcono: {
    fontSize: 40,
    marginBottom: 8,
  },
  vacioTitulo: {
    color: '#0f4f24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: '#777',
    marginTop: 5,
  },
  footerResumen: {
    marginTop: 18,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#7cae36',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerResumenTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerIcono: {
    fontSize: 31,
  },
  footerLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  footerValor: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 3,
  },
  footerSeparador: {
    width: 1,
    height: 55,
    backgroundColor: '#9ccc65',
    marginHorizontal: 16,
  },
  footerSeparadorTelefono: {
    width: '100%',
    height: 1,
    marginHorizontal: 0,
  },
});
