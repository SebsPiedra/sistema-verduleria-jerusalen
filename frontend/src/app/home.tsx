import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

export default function HomeScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>({});
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuestaProductos = await api.get('/productos');

      const datosProductos = Array.isArray(respuestaProductos.data)
        ? respuestaProductos.data
        : respuestaProductos.data?.productos || [];

      setProductos(datosProductos);

      try {
        const respuestaResumen = await api.get('/dashboard/resumen');
        setResumen(respuestaResumen.data || {});
      } catch (error) {
        console.log('Dashboard no disponible, usando productos:', error);
      }
    } catch (error: any) {
      console.log('Error al cargar inicio admin:', error?.response?.data || error);
      setMensaje('No se pudieron cargar los datos del panel.');
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
    return producto.categoria || producto.nombre_categoria || producto.categoria_nombre || 'General';
  };

  const obtenerPrecio = (producto: any) => {
    return Number(producto.precio_venta || producto.precio || producto.precio_unitario || 0);
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

  const obtenerEstadoVisual = (producto: any) => {
    const cantidad = obtenerCantidad(producto);
    const minimo = obtenerStockMinimo(producto);

    if (cantidad <= 0) {
      return {
        texto: 'Sin stock',
        estilo: styles.estadoSinStock,
        punto: styles.puntoRojo,
      };
    }

    if (cantidad <= minimo) {
      return {
        texto: 'Stock bajo',
        estilo: styles.estadoBajo,
        punto: styles.puntoNaranja,
      };
    }

    return {
      texto: 'En buen estado',
      estilo: styles.estadoBueno,
      punto: styles.puntoVerde,
    };
  };

  const totalProductos = productos.length || Number(resumen.total_productos || 0);

  const sinStock = productos.filter((producto) => obtenerCantidad(producto) <= 0).length;

  const stockBajo = productos.filter((producto) => {
    const cantidad = obtenerCantidad(producto);
    const minimo = obtenerStockMinimo(producto);

    return cantidad > 0 && cantidad <= minimo;
  }).length;

  const enBuenEstado = productos.filter((producto) => {
    const cantidad = obtenerCantidad(producto);
    const minimo = obtenerStockMinimo(producto);

    return cantidad > minimo;
  }).length;

  const productosFiltrados = productos
    .filter((producto) => {
      const texto = busqueda.toLowerCase();

      return (
        obtenerNombre(producto).toLowerCase().includes(texto) ||
        obtenerCategoria(producto).toLowerCase().includes(texto)
      );
    })
    .slice(0, 8);

  const totalEstimado = productos.reduce((total, producto) => {
    return total + obtenerPrecio(producto) * obtenerCantidad(producto);
  }, 0);

  return (
    <AdminLayout
      titulo="Centro de Control Fresco"
      subtitulo="Resumen de inventario, ventas, clientes y pedidos"
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.titulo}>Todo bajo control 🌿</Text>
          <Text style={styles.subtitulo}>
            Resumen de tu inventario y pedidos para tomar decisiones frescas cada día.
          </Text>
        </View>

        <Pressable
          style={styles.botonAgregar}
          onPress={() => router.push('/registrar-producto' as any)}
        >
          <Text style={styles.botonAgregarTexto}>＋ Agregar producto</Text>
        </Pressable>
      </View>

      {mensaje !== '' && (
        <View style={styles.mensajeError}>
          <Text style={styles.mensajeTexto}>{mensaje}</Text>
        </View>
      )}

      <View style={styles.tarjetas}>
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIcono}>🧺</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Productos totales</Text>
            <Text style={styles.tarjetaNumero}>{totalProductos}</Text>
            <Text style={styles.tarjetaDetalle}>Activos en inventario</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>✓</Text>
          <View>
            <Text style={styles.tarjetaLabel}>En buen estado</Text>
            <Text style={styles.tarjetaNumero}>{enBuenEstado}</Text>
            <Text style={styles.tarjetaDetalle}>Disponibles para venta</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⚠</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Stock bajo</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{stockBajo}</Text>
            <Text style={styles.tarjetaDetalle}>Requieren reposición</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>!</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Sin stock</Text>
            <Text style={styles.tarjetaNumeroRojo}>{sinStock}</Text>
            <Text style={styles.tarjetaDetalle}>Agotados</Text>
          </View>
        </View>
      </View>

      <View style={styles.tablaCaja}>
        <View style={styles.filtrosFila}>
          <TextInput
            style={styles.inputBuscar}
            placeholder="Buscar producto..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <Pressable style={styles.botonFiltro} onPress={cargarDatos}>
            <Text style={styles.botonFiltroTexto}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colProducto]}>Producto</Text>
          <Text style={[styles.th, styles.colCategoria]}>Categoría</Text>
          <Text style={[styles.th, styles.colStock]}>Stock actual</Text>
          <Text style={[styles.th, styles.colUnidad]}>Unidad</Text>
          <Text style={[styles.th, styles.colPrecio]}>Precio venta</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
        </View>

        {productosFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              {cargando ? 'Cargando productos...' : 'No hay productos para mostrar.'}
            </Text>
          </View>
        ) : (
          productosFiltrados.map((producto, index) => {
            const estado = obtenerEstadoVisual(producto);
            const imagen = obtenerImagen(producto);

            return (
              <View key={producto.id_producto || index} style={styles.tablaRow}>
                <View style={[styles.tdProducto, styles.colProducto]}>
                  <View style={styles.imagenArea}>
                    {imagen ? (
                      <Image
                        source={{ uri: imagen }}
                        style={styles.imagenProducto}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.productoEmoji}>🥦</Text>
                    )}
                  </View>

                  <Text style={styles.productoNombre} numberOfLines={1}>
                    {obtenerNombre(producto)}
                  </Text>
                </View>

                <Text style={[styles.td, styles.colCategoria]}>
                  {obtenerCategoria(producto)}
                </Text>

                <Text style={[styles.td, styles.colStock]}>
                  {obtenerCantidad(producto)}
                </Text>

                <Text style={[styles.td, styles.colUnidad]}>
                  {obtenerUnidad(producto)}
                </Text>

                <Text style={[styles.td, styles.colPrecio]}>
                  {formatoColones(obtenerPrecio(producto))}
                </Text>

                <View style={[styles.colEstado]}>
                  <View style={[styles.estadoBadge, estado.estilo]}>
                    <View style={[styles.puntoEstado, estado.punto]} />
                    <Text style={styles.estadoTexto}>{estado.texto}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.tablaFooter}>
          <Text style={styles.footerTexto}>
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </Text>

          <Pressable
            style={styles.verInventario}
            onPress={() => router.push('/productos' as any)}
          >
            <Text style={styles.verInventarioTexto}>Ver inventario completo</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footerResumen}>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>🚚</Text>
          <View>
            <Text style={styles.footerLabel}>Pedidos pendientes</Text>
            <Text style={styles.footerValor}>
              {resumen.total_pedidos ?? resumen.pedidos_pendientes ?? 0}
            </Text>
          </View>
        </View>

        <View style={styles.footerSeparador} />

        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>🌿</Text>
          <View>
            <Text style={styles.footerLabel}>Productos en buen estado</Text>
            <Text style={styles.footerValor}>{enBuenEstado} productos</Text>
          </View>
        </View>

        <View style={styles.footerSeparador} />

        <View style={styles.footerItem}>
          <Text style={styles.footerIcono}>🧺</Text>
          <View>
            <Text style={styles.footerLabel}>Total estimado</Text>
            <Text style={styles.footerValor}>{formatoColones(totalEstimado)}</Text>
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
    fontSize: 42,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#666',
    fontSize: 16,
    marginTop: 6,
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
  mensajeError: {
    backgroundColor: '#ffebee',
    borderColor: '#c62828',
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  mensajeTexto: {
    color: '#c62828',
    textAlign: 'center',
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
  tablaCaja: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  filtrosFila: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  inputBuscar: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0d7c2',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fffdf6',
  },
  botonFiltro: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  botonFiltroTexto: {
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
  colProducto: {
    flex: 2.2,
  },
  colCategoria: {
    flex: 1.4,
  },
  colStock: {
    flex: 1,
    textAlign: 'center',
  },
  colUnidad: {
    flex: 1,
    textAlign: 'center',
  },
  colPrecio: {
    flex: 1.2,
    textAlign: 'center',
  },
  colEstado: {
    flex: 1.5,
    alignItems: 'center',
  },
  tdProducto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagenArea: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenProducto: {
    width: 36,
    height: 36,
  },
  productoEmoji: {
    fontSize: 28,
  },
  productoNombre: {
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
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
  estadoTexto: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vacio: {
    padding: 30,
    alignItems: 'center',
  },
  vacioTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
  tablaFooter: {
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTexto: {
    color: '#777',
  },
  verInventario: {
    backgroundColor: '#0f4f24',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  verInventarioTexto: {
    color: '#ffffff',
    fontWeight: 'bold',
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
});