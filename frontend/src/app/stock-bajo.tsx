import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
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
      const respuesta = await api.get('/productos/stock-bajo');
      setProductos(respuesta.data);
    } catch (error) {
      console.log('Error al cargar stock bajo:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarStockBajo();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando productos con stock bajo...</Text>
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
          keyExtractor={(item) => item.id_producto.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.fila}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.etiqueta}>
                  {item.cantidad === 0 ? 'Faltante' : 'Bajo'}
                </Text>
              </View>

              <Text style={styles.detalle}>Cantidad actual: {item.cantidad}</Text>
              <Text style={styles.detalle}>Stock mínimo: {item.stock_minimo}</Text>
              <Text style={styles.detalle}>Precio venta: ₡{item.precio_venta}</Text>

              <Pressable
                style={styles.botonEditar}
                onPress={() =>
                  router.push(`/editar-producto?id=${item.id_producto}` as any)
                }
              >
                <Text style={styles.textoEditar}>Actualizar producto</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={styles.botonVolver} onPress={() => router.push('/home')}>
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
    elevation: 2,
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