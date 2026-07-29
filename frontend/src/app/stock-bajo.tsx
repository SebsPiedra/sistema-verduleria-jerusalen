import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function StockBajoScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarStockBajo = async () => {
    try {
      setCargando(true);

      try {
        const respuesta = await api.get('/productos/stock-bajo');

        if (Array.isArray(respuesta.data)) {
          setProductos(respuesta.data);
        } else {
          setProductos([]);
        }
      } catch {
        console.log('No existe /productos/stock-bajo, se filtra desde /productos');

        const respuestaProductos = await api.get('/productos');

        const listaProductos = Array.isArray(respuestaProductos.data)
          ? respuestaProductos.data
          : [];

        const productosStockBajo = listaProductos.filter((producto: any) => {
          const cantidad = Number(producto.cantidad || 0);
          const stockMinimo = Number(producto.stock_minimo || 0);

          return cantidad <= stockMinimo;
        });

        setProductos(productosStockBajo);
      }
    } catch (error) {
      console.log('Error al cargar stock bajo:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos con stock bajo');
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarStockBajo();
  }, []);

  const irEditarProducto = (idProducto: number) => {
    router.push({
      pathname: '/editar-producto',
      params: { id_producto: String(idProducto) },
    } as any);
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text style={styles.textoCargando}>
          Cargando productos con stock bajo...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Stock bajo</Text>

      <Text style={styles.subtitulo}>
        Productos faltantes o próximos a agotarse
      </Text>

      {productos.length === 0 ? (
        <View style={styles.sinDatos}>
          <Text style={styles.iconoGrande}>✅</Text>

          <Text style={styles.sinDatosTitulo}>Todo está bien</Text>

          <Text style={styles.sinDatosTexto}>
            No hay productos con stock bajo en este momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item, index) =>
            item.id_producto ? item.id_producto.toString() : index.toString()
          }
          renderItem={({ item }) => {
            const cantidad = Number(item.cantidad || 0);
            const stockMinimo = Number(item.stock_minimo || 0);
            const unidad = item.unidad_medida || 'kg';

            return (
              <View style={styles.card}>
                <View style={styles.fila}>
                  <Text style={styles.nombre}>
                    {item.nombre || 'Producto sin nombre'}
                  </Text>

                  <Text style={styles.etiqueta}>
                    {cantidad === 0 ? 'Faltante' : 'Bajo'}
                  </Text>
                </View>

                <Text style={styles.detalle}>
                  Cantidad actual: {cantidad} {unidad}
                </Text>

                <Text style={styles.detalle}>
                  Stock mínimo: {stockMinimo} {unidad}
                </Text>

                <Text style={styles.detalle}>
                  Precio venta: ₡{Number(item.precio_venta || 0).toFixed(2)}
                </Text>

                <Text style={styles.detalle}>
                  Proveedor: {item.proveedor || 'No indicado'}
                </Text>

                <Pressable
                  style={styles.botonEditar}
                  onPress={() => irEditarProducto(item.id_producto)}
                >
                  <Text style={styles.textoEditar}>Actualizar producto</Text>
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={styles.lista}
        />
      )}

      <Pressable
        style={styles.botonVolver}
        onPress={() => router.push('/home' as any)}
      >
        <Text style={styles.textoVolver}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#eef8ef',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef8ef',
  },
  textoCargando: {
    marginTop: 10,
    color: '#555',
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 18,
  },
  lista: {
    paddingBottom: 10,
  },
  sinDatos: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginTop: 25,
  },
  iconoGrande: {
    fontSize: 45,
    marginBottom: 10,
  },
  sinDatosTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  sinDatosTexto: {
    textAlign: 'center',
    color: '#555',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b71c1c',
    flex: 1,
  },
  etiqueta: {
    backgroundColor: '#ffebee',
    color: '#b71c1c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: 'bold',
    fontSize: 12,
  },
  detalle: {
    color: '#444',
    marginTop: 6,
  },
  botonEditar: {
    backgroundColor: '#b71c1c',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  textoEditar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
