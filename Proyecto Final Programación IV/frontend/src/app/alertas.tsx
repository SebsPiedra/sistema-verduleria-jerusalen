import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function AlertasScreen() {
  const router = useRouter();

  const [alertas, setAlertas] = useState<any>({
    resumen: {
      stock_bajo: 0,
      sin_precio: 0,
      proximos_vencer: 0,
    },
    stock_bajo: [],
    sin_precio: [],
    proximos_vencer: [],
  });

  const [cargando, setCargando] = useState(true);

  const cargarAlertas = async () => {
    try {
      setCargando(true);

      try {
        const respuesta = await api.get('/productos/alertas');

        setAlertas({
          resumen: {
            stock_bajo: respuesta.data?.resumen?.stock_bajo || 0,
            sin_precio: respuesta.data?.resumen?.sin_precio || 0,
            proximos_vencer: respuesta.data?.resumen?.proximos_vencer || 0,
          },
          stock_bajo: respuesta.data?.stock_bajo || [],
          sin_precio: respuesta.data?.sin_precio || [],
          proximos_vencer: respuesta.data?.proximos_vencer || [],
        });
      } catch (errorAlertas) {
        console.log('No existe /productos/alertas, se calculan alertas desde /productos');

        const respuestaProductos = await api.get('/productos');

        const productos = Array.isArray(respuestaProductos.data)
          ? respuestaProductos.data
          : [];

        const stockBajo = productos.filter((producto: any) => {
          const cantidad = Number(producto.cantidad || 0);
          const stockMinimo = Number(producto.stock_minimo || 0);

          return cantidad <= stockMinimo;
        });

        const sinPrecio = productos.filter((producto: any) => {
          const precioVenta = Number(producto.precio_venta || 0);

          return precioVenta <= 0;
        });

        setAlertas({
          resumen: {
            stock_bajo: stockBajo.length,
            sin_precio: sinPrecio.length,
            proximos_vencer: 0,
          },
          stock_bajo: stockBajo,
          sin_precio: sinPrecio,
          proximos_vencer: [],
        });
      }
    } catch (error) {
      console.log('Error al cargar alertas:', error);

      Alert.alert('Error', 'No se pudieron cargar las alertas');

      setAlertas({
        resumen: {
          stock_bajo: 0,
          sin_precio: 0,
          proximos_vencer: 0,
        },
        stock_bajo: [],
        sin_precio: [],
        proximos_vencer: [],
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
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
        <Text style={styles.textoCargando}>Cargando alertas...</Text>
      </View>
    );
  }

  const stockBajo = alertas?.stock_bajo || [];
  const sinPrecio = alertas?.sin_precio || [];
  const proximosVencer = alertas?.proximos_vencer || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Alertas</Text>

      <Text style={styles.subtitulo}>Resumen del estado del inventario</Text>

      <View style={styles.resumenContainer}>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>
            {alertas?.resumen?.stock_bajo || 0}
          </Text>
          <Text style={styles.resumenTexto}>Stock bajo</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>
            {alertas?.resumen?.sin_precio || 0}
          </Text>
          <Text style={styles.resumenTexto}>Sin precio</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>
            {alertas?.resumen?.proximos_vencer || 0}
          </Text>
          <Text style={styles.resumenTexto}>Por vencer</Text>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📦 Productos con stock bajo</Text>

        {stockBajo.length === 0 ? (
          <Text style={styles.textoOk}>No hay productos con stock bajo.</Text>
        ) : (
          stockBajo.map((item: any) => {
            const unidad = item.unidad_medida || 'kg';

            return (
              <View key={item.id_producto} style={styles.alertaCard}>
                <Text style={styles.nombre}>{item.nombre}</Text>

                <Text style={styles.detalle}>
                  Cantidad actual: {item.cantidad} {unidad}
                </Text>

                <Text style={styles.detalle}>
                  Stock mínimo: {item.stock_minimo} {unidad}
                </Text>

                <Text style={styles.detalle}>
                  Precio venta: ₡{Number(item.precio_venta || 0).toFixed(2)}
                </Text>

                <Pressable
                  style={styles.botonEditar}
                  onPress={() => irEditarProducto(item.id_producto)}
                >
                  <Text style={styles.textoEditar}>Actualizar producto</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>💰 Productos sin precio</Text>

        {sinPrecio.length === 0 ? (
          <Text style={styles.textoOk}>Todos los productos tienen precio.</Text>
        ) : (
          sinPrecio.map((item: any) => (
            <View key={item.id_producto} style={styles.alertaCard}>
              <Text style={styles.nombre}>{item.nombre}</Text>

              <Text style={styles.detalle}>
                Precio compra: ₡{Number(item.precio_compra || 0).toFixed(2)}
              </Text>

              <Text style={styles.detalle}>
                Precio venta: ₡{Number(item.precio_venta || 0).toFixed(2)}
              </Text>

              <Pressable
                style={styles.botonEditar}
                onPress={() => irEditarProducto(item.id_producto)}
              >
                <Text style={styles.textoEditar}>Agregar precio</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>⏰ Próximos a vencer</Text>

        {proximosVencer.length === 0 ? (
          <Text style={styles.textoOk}>
            No hay productos próximos a vencer en los siguientes 7 días.
          </Text>
        ) : (
          proximosVencer.map((item: any) => (
            <View key={item.id_producto} style={styles.alertaCard}>
              <Text style={styles.nombre}>{item.nombre}</Text>

              <Text style={styles.detalle}>
                Fecha vencimiento:{' '}
                {item.fecha_vencimiento
                  ? String(item.fecha_vencimiento).split('T')[0]
                  : 'No indicada'}
              </Text>

              <Text style={styles.detalle}>Cantidad: {item.cantidad}</Text>
            </View>
          ))
        )}
      </View>

      <Pressable
        style={styles.botonVolver}
        onPress={() => router.push('/home' as any)}
      >
        <Text style={styles.textoVolver}>Volver al inicio</Text>
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
  resumenContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  resumenCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  resumenNumero: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b71c1c',
  },
  resumenTexto: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  seccion: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 10,
  },
  textoOk: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  alertaCard: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  nombre: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  detalle: {
    color: '#555',
    marginTop: 4,
  },
  botonEditar: {
    backgroundColor: '#ef6c00',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 8,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});