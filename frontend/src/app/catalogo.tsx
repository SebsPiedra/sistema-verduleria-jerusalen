import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { obtenerDato } from '../services/storage.js';

export default function CatalogoScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const respuesta = await api.get('/productos');

      const productosActivos = respuesta.data.filter(
        (producto: any) =>
          producto.estado === 'Activo' &&
          Number(producto.precio_venta) > 0
      );

      setProductos(productosActivos);
    } catch (error) {
      console.log('Error al cargar catálogo:', error);
      Alert.alert('Error', 'No se pudo cargar el catálogo de productos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const intentarHacerPedido = async () => {
    const clienteGuardado = await obtenerDato('cliente');

    if (clienteGuardado) {
      router.push('/cliente-pedido' as any);
      return;
    }

    Alert.alert(
      'Registro requerido',
      'Para realizar un pedido debe iniciar sesión o registrarse como cliente.'
    );

    router.push('/cliente-registro' as any);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🥬</Text>

      <Text style={styles.titulo}>Catálogo de productos</Text>

      <Text style={styles.subtitulo}>
        Puede revisar los productos disponibles sin registrarse. Para realizar un pedido debe tener una cuenta.
      </Text>

      <Pressable style={styles.botonPedido} onPress={intentarHacerPedido}>
        <Text style={styles.textoBotonPedido}>Quiero hacer un pedido</Text>
      </Pressable>

      {cargando ? (
        <View style={styles.card}>
          <Text style={styles.textoVacio}>Cargando productos...</Text>
        </View>
      ) : productos.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.textoVacio}>No hay productos disponibles.</Text>
        </View>
      ) : (
        productos.map((producto) => {
          const unidad = producto.unidad_medida || 'kg';

          return (
            <View key={producto.id_producto} style={styles.productoCard}>
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
                <Text style={styles.productoNombre}>{producto.nombre}</Text>

                <Text style={styles.productoDetalle}>
                  Precio: ₡{Number(producto.precio_venta || 0).toFixed(2)} por {unidad}
                </Text>

                <Text style={styles.productoDetalle}>
                  Disponible: {producto.cantidad} {unidad}
                </Text>

               
              </View>
            </View>
          );
        })
      )}

      <Pressable
        style={styles.botonLogin}
        onPress={() => router.push('/' as any)}
      >
        <Text style={styles.textoLogin}>Volver al inicio</Text>
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
  logo: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 4,
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
    marginTop: 8,
    marginBottom: 16,
  },
  botonPedido: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  textoBotonPedido: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
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
  productoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  productoDetalle: {
    color: '#555',
    marginTop: 4,
  },
  botonLogin: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoLogin: {
    color: '#fff',
    fontWeight: 'bold',
  },
});