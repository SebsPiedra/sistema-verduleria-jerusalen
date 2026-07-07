import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ProductosScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);

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

  const aumentarInventario = async (idProducto: number) => {
    try {
      await api.patch(`/productos/${idProducto}/aumentar`, {
        cantidad: 1,
      });

      await cargarProductos();
    } catch (error) {
      console.log('Error al aumentar inventario:', error);
      Alert.alert('Error', 'No se pudo aumentar el inventario');
    }
  };

  const disminuirInventario = async (idProducto: number) => {
    try {
      await api.patch(`/productos/${idProducto}/disminuir`, {
        cantidad: 1,
      });

      await cargarProductos();
    } catch (error: any) {
      console.log('Error al disminuir inventario:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo disminuir el inventario'
      );
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Productos</Text>
      <Text style={styles.subtitulo}>{productos.length} productos registrados</Text>

      <TextInput
        style={styles.buscador}
        placeholder="Buscar producto..."
        value={filtro}
        onChangeText={setFiltro}
      />

      <FlatList
        data={productosFiltrados}
        keyExtractor={(item) => item.id_producto.toString()}
        renderItem={({ item }) => {
          const unidad = item.unidad_medida || 'kg';
          const stockBajo =
            Number(item.cantidad) <= Number(item.stock_minimo);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.nombre}>{item.nombre}</Text>

                <Text style={[styles.estado, stockBajo && styles.estadoAlerta]}>
                  {stockBajo ? 'Stock bajo' : 'Activo'}
                </Text>
              </View>

              <View style={styles.precioBox}>
                <Text style={styles.precioLabel}>Precio de venta</Text>
                <Text style={styles.precioValor}>
                  ₡{Number(item.precio_venta).toFixed(2)} por {unidad}
                </Text>
              </View>

              <Text style={styles.detalle}>Categoría: {item.categoria}</Text>
              <Text style={styles.detalle}>
                Precio compra: ₡{Number(item.precio_compra).toFixed(2)} por {unidad}
              </Text>
              <Text style={styles.detalle}>
                Disponible: {item.cantidad} {unidad}
              </Text>
              <Text style={styles.detalle}>
                Stock mínimo: {item.stock_minimo} {unidad}
              </Text>

              <View style={styles.contenedorCantidad}>
                <Pressable
                  style={styles.botonMenos}
                  onPress={() => disminuirInventario(item.id_producto)}
                >
                  <Text style={styles.textoCantidad}>-1</Text>
                </Pressable>

                <View style={styles.cantidadCentro}>
                  <Text style={styles.cantidadActual}>{item.cantidad}</Text>
                  <Text style={styles.cantidadUnidad}>{unidad}</Text>
                </View>

                <Pressable
                  style={styles.botonMas}
                  onPress={() => aumentarInventario(item.id_producto)}
                >
                  <Text style={styles.textoCantidad}>+1</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.botonEditar}
                onPress={() =>
                  router.push(`/editar-producto?id=${item.id_producto}` as any)
                }
              >
                <Text style={styles.textoEditar}>Editar producto</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Pressable style={styles.boton} onPress={() => router.push('/home')}>
        <Text style={styles.textoBoton}>Volver al inicio</Text>
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
    marginBottom: 14,
  },
  buscador: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d7ead8',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    flex: 1,
  },
  estado: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
  estadoAlerta: {
    backgroundColor: '#ffebee',
    color: '#b71c1c',
  },
  precioBox: {
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  precioLabel: {
    color: '#555',
    fontSize: 13,
  },
  precioValor: {
    color: '#1b5e20',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detalle: {
    marginTop: 5,
    color: '#444',
  },
  contenedorCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: '#f1f8e9',
    padding: 10,
    borderRadius: 14,
  },
  botonMenos: {
    backgroundColor: '#b71c1c',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  botonMas: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  textoCantidad: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cantidadCentro: {
    alignItems: 'center',
  },
  cantidadActual: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  cantidadUnidad: {
    fontSize: 13,
    color: '#555',
  },
  botonEditar: {
    marginTop: 12,
    backgroundColor: '#1b5e20',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoEditar: {
    color: '#fff',
    fontWeight: 'bold',
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
});