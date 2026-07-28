import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ProductosScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (error) {
      console.log('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.toLowerCase();

    const nombre = String(producto.nombre || '').toLowerCase();
    const proveedor = String(producto.proveedor || '').toLowerCase();
    const estado = String(producto.estado || '').toLowerCase();
    const unidad = String(producto.unidad_medida || '').toLowerCase();

    return (
      nombre.includes(textoBusqueda) ||
      proveedor.includes(textoBusqueda) ||
      estado.includes(textoBusqueda) ||
      unidad.includes(textoBusqueda)
    );
  });

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  const irEditarProducto = (idProducto: number) => {
    router.push({
      pathname: '/editar-producto',
      params: { id_producto: String(idProducto) },
    } as any);
  };

  const esStockBajo = (producto: any) => {
    return Number(producto.cantidad || 0) <= Number(producto.stock_minimo || 0);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Productos</Text>

      <Text style={styles.subtitulo}>
        Consulte, busque y administre los productos registrados en el inventario.
      </Text>

      <View style={styles.acciones}>
        <Pressable
          style={styles.botonRegistrar}
          onPress={() => router.push('/registrar-producto' as any)}
        >
          <Text style={styles.textoBoton}>Registrar producto</Text>
        </Pressable>

        <Pressable style={styles.botonActualizar} onPress={cargarProductos}>
          <Text style={styles.textoActualizar}>Actualizar</Text>
        </Pressable>
      </View>

      <View style={styles.buscadorBox}>
        <Text style={styles.label}>Buscar producto</Text>

        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre, proveedor, estado o unidad..."
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {busqueda.length > 0 && (
          <Pressable style={styles.botonLimpiar} onPress={limpiarBusqueda}>
            <Text style={styles.textoLimpiar}>Limpiar búsqueda</Text>
          </Pressable>
        )}

        <Text style={styles.resultadoTexto}>
          Resultados: {productosFiltrados.length} de {productos.length}
        </Text>
      </View>

      {cargando ? (
        <View style={styles.card}>
          <Text style={styles.textoVacio}>Cargando productos...</Text>
        </View>
      ) : productosFiltrados.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.textoVacio}>
            No se encontraron productos con esa búsqueda.
          </Text>
        </View>
      ) : (
        productosFiltrados.map((producto) => {
          const unidad = producto.unidad_medida || 'kg';
          const stockBajo = esStockBajo(producto);

          return (
            <View key={producto.id_producto} style={styles.productoCard}>
              <View style={styles.filaPrincipal}>
                {producto.imagen_url ? (
                  <Image
                    source={{ uri: producto.imagen_url }}
                    style={styles.imagenProducto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagenPlaceholder}>
                    <Text style={styles.imagenTexto}>🥬</Text>
                  </View>
                )}

                <View style={styles.productoInfo}>
                  <View style={styles.filaTitulo}>
                    <Text style={styles.productoNombre}>
                      {producto.nombre}
                    </Text>

                    <Text
                      style={[
                        styles.estado,
                        producto.estado === 'Activo'
                          ? styles.estadoActivo
                          : styles.estadoInactivo,
                      ]}
                    >
                      {producto.estado || 'Activo'}
                    </Text>
                  </View>

                  <Text style={styles.detalle}>
                    Cantidad: {producto.cantidad} {unidad}
                  </Text>

                  <Text style={styles.detalle}>
                    Stock mínimo: {producto.stock_minimo} {unidad}
                  </Text>

                  {stockBajo && (
                    <Text style={styles.alertaStock}>
                      Producto con stock bajo
                    </Text>
                  )}

                  <Text style={styles.detalle}>
                    Compra: ₡{Number(producto.precio_compra || 0).toFixed(2)}
                  </Text>

                  <Text style={styles.detalle}>
                    Venta: ₡{Number(producto.precio_venta || 0).toFixed(2)} por {unidad}
                  </Text>

                  <Text style={styles.detalle}>
                    Proveedor: {producto.proveedor || 'No indicado'}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.botonEditar}
                onPress={() => irEditarProducto(producto.id_producto)}
              >
                <Text style={styles.textoEditar}>Editar producto</Text>
              </Pressable>
            </View>
          );
        })
      )}

      <Pressable
        style={styles.botonVolver}
        onPress={() => router.push('/home' as any)}
      >
        <Text style={styles.textoVolver}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#eef8ef',
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  subtitulo: {
    color: '#555',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  acciones: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  botonRegistrar: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonActualizar: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoActualizar: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  buscadorBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 14,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fff9',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  botonLimpiar: {
    backgroundColor: '#757575',
    padding: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  textoLimpiar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultadoTexto: {
    color: '#555',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 14,
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
  },
  productoCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 12,
  },
  filaPrincipal: {
    flexDirection: 'row',
    gap: 12,
  },
  imagenProducto: {
    width: 85,
    height: 85,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
  },
  imagenPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagenTexto: {
    fontSize: 34,
  },
  productoInfo: {
    flex: 1,
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    flex: 1,
  },
  estado: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontWeight: 'bold',
    fontSize: 12,
  },
  estadoActivo: {
    backgroundColor: '#e8f5e9',
    color: '#1b5e20',
  },
  estadoInactivo: {
    backgroundColor: '#ffebee',
    color: '#b71c1c',
  },
  detalle: {
    color: '#555',
    marginTop: 4,
  },
  alertaStock: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    fontWeight: 'bold',
    padding: 7,
    borderRadius: 10,
    marginTop: 6,
  },
  botonEditar: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoEditar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});