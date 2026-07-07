import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function HistorialVentasScreen() {
  const router = useRouter();

  const [ventas, setVentas] = useState<any[]>([]);
  const [detalleVenta, setDetalleVenta] = useState<any>(null);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargarVentas = async () => {
    try {
      const respuesta = await api.get('/ventas');
      setVentas(respuesta.data);
    } catch (error) {
      console.log('Error al cargar ventas:', error);
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const verDetalle = async (idVenta: number) => {
    if (idVentaSeleccionada === idVenta) {
      setIdVentaSeleccionada(null);
      setDetalleVenta(null);
      return;
    }

    try {
      setCargando(true);

      const respuesta = await api.get(`/ventas/${idVenta}`);

      setIdVentaSeleccionada(idVenta);
      setDetalleVenta(respuesta.data);
    } catch (error) {
      console.log('Error al obtener detalle de venta:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la venta');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'Sin fecha';

    const fechaObj = new Date(fecha);

    return fechaObj.toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerDetalles = () => {
    if (!detalleVenta) return [];

    if (Array.isArray(detalleVenta.detalles)) {
      return detalleVenta.detalles;
    }

    if (Array.isArray(detalleVenta.detalle)) {
      return detalleVenta.detalle;
    }

    if (Array.isArray(detalleVenta.productos)) {
      return detalleVenta.productos;
    }

    return [];
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Historial de ventas</Text>

      <Text style={styles.subtitulo}>
        Consulte las ventas registradas y revise el detalle de cada factura.
      </Text>

      {ventas.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.textoVacio}>No hay ventas registradas.</Text>
        </View>
      ) : (
        ventas.map((venta) => {
          const estaSeleccionada = idVentaSeleccionada === venta.id_venta;
          const detalles = estaSeleccionada ? obtenerDetalles() : [];

          return (
            <View key={venta.id_venta} style={styles.card}>
              <View style={styles.fila}>
                <Text style={styles.factura}>
                  Factura: {venta.numero_factura || `#${venta.id_venta}`}
                </Text>

                <Text style={styles.estado}>Registrada</Text>
              </View>

              <Text style={styles.detalle}>
                Fecha: {formatearFecha(venta.fecha_venta)}
              </Text>

              <Text style={styles.detalle}>
                Cliente: {venta.cliente || 'Cliente contado'}
              </Text>

              <Text style={styles.detalle}>
                Método de pago: {venta.metodo_pago || 'Efectivo'}
              </Text>

              <Text style={styles.total}>
                Total: ₡{Number(venta.total || 0).toFixed(2)}
              </Text>

              <Pressable
                style={styles.botonDetalle}
                onPress={() => verDetalle(venta.id_venta)}
              >
                <Text style={styles.textoBotonDetalle}>
                  {estaSeleccionada ? 'Ocultar detalle' : 'Ver detalle'}
                </Text>
              </Pressable>

              {estaSeleccionada && (
                <View style={styles.detalleBox}>
                  <Text style={styles.detalleTitulo}>Detalle de la venta</Text>

                  {cargando ? (
                    <Text style={styles.textoVacio}>Cargando detalle...</Text>
                  ) : detalles.length === 0 ? (
                    <Text style={styles.textoVacio}>
                      No hay productos en el detalle.
                    </Text>
                  ) : (
                    detalles.map((item: any, index: number) => {
                      const nombre =
                        item.nombre ||
                        item.producto ||
                        item.nombre_producto ||
                        'Producto';

                      const cantidad = Number(item.cantidad || 0);
                      const precio = Number(
                        item.precio_unitario ||
                          item.precio_venta ||
                          item.precio ||
                          0
                      );
                      const subtotal = Number(
                        item.subtotal || cantidad * precio
                      );

                      return (
                        <View key={index} style={styles.productoDetalle}>
                          <Text style={styles.productoNombre}>{nombre}</Text>

                          <Text style={styles.productoTexto}>
                            Cantidad: {cantidad}
                          </Text>

                          <Text style={styles.productoTexto}>
                            Precio unitario: ₡{precio.toFixed(2)}
                          </Text>

                          <Text style={styles.productoSubtotal}>
                            Subtotal: ₡{subtotal.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
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
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 14,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  factura: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    flex: 1,
  },
  estado: {
    backgroundColor: '#e8f5e9',
    color: '#1b5e20',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontWeight: 'bold',
  },
  detalle: {
    color: '#555',
    marginTop: 6,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 10,
  },
  botonDetalle: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBotonDetalle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detalleBox: {
    backgroundColor: '#f1f8e9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginTop: 12,
  },
  detalleTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 10,
  },
  productoDetalle: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 10,
  },
  productoNombre: {
    fontWeight: 'bold',
    color: '#1b5e20',
    fontSize: 16,
  },
  productoTexto: {
    color: '#555',
    marginTop: 4,
  },
  productoSubtotal: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: 6,
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
    marginVertical: 10,
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