import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function PedidosAdminScreen() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [detallePedido, setDetallePedido] = useState<any>(null);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const respuesta = await api.get('/pedidos');
      setPedidos(respuesta.data);
    } catch (error) {
      console.log('Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalle = async (idPedido: number) => {
    try {
      if (detalleAbierto === idPedido) {
        setDetalleAbierto(null);
        setDetallePedido(null);
        return;
      }

      const respuesta = await api.get(`/pedidos/${idPedido}`);
      setDetallePedido(respuesta.data);
      setDetalleAbierto(idPedido);
    } catch (error) {
      console.log('Error al cargar detalle:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido');
    }
  };

  const cambiarEstado = async (idPedido: number, estado: string) => {
    try {
      await api.patch(`/pedidos/${idPedido}/estado`, {
        estado,
      });

      Alert.alert('Correcto', `Pedido actualizado a: ${estado}`);

      setDetalleAbierto(null);
      setDetallePedido(null);

      await cargarPedidos();
    } catch (error: any) {
      console.log('Error al cambiar estado:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo cambiar el estado'
      );
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Pedidos de clientes</Text>
      <Text style={styles.subtitulo}>{pedidos.length} pedidos registrados</Text>

      <Pressable style={styles.botonActualizar} onPress={cargarPedidos}>
        <Text style={styles.textoBoton}>Actualizar pedidos</Text>
      </Pressable>

      {pedidos.length === 0 ? (
        <View style={styles.vacioBox}>
          <Text style={styles.textoVacio}>No hay pedidos registrados.</Text>
        </View>
      ) : (
        pedidos.map((pedido) => {
          const estado = pedido.estado;

          return (
            <View key={pedido.id_pedido} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.numeroPedido}>Pedido #{pedido.id_pedido}</Text>

                <Text
                  style={[
                    styles.estado,
                    estado === 'Pendiente' && styles.estadoPendiente,
                    estado === 'Aceptado' && styles.estadoAceptado,
                    estado === 'Rechazado' && styles.estadoRechazado,
                    estado === 'Entregado' && styles.estadoEntregado,
                  ]}
                >
                  {estado}
                </Text>
              </View>

              <Text style={styles.detalle}>Cliente: {pedido.cliente}</Text>
              <Text style={styles.detalle}>Teléfono: {pedido.telefono || 'No indicado'}</Text>
               <Text style={styles.detalle}>
  Dirección de entrega: {pedido.direccion_entrega || pedido.direccion_registrada || 'No indicada'}
</Text>
              <Text style={styles.detalle}>Método de pago: {pedido.metodo_pago}</Text>
              <Text style={styles.detalle}>
                Productos: {pedido.cantidad_productos}
              </Text>

              {pedido.observacion ? (
                <Text style={styles.observacion}>Observación: {pedido.observacion}</Text>
              ) : null}

              <Text style={styles.total}>
                Total: ₡{Number(pedido.total).toFixed(2)}
              </Text>

              <Pressable
                style={styles.botonDetalle}
                onPress={() => cargarDetalle(pedido.id_pedido)}
              >
                <Text style={styles.textoDetalle}>
                  {detalleAbierto === pedido.id_pedido ? 'Ocultar detalle' : 'Ver detalle'}
                </Text>
              </Pressable>

              {detalleAbierto === pedido.id_pedido && detallePedido && (
                <View style={styles.detalleBox}>
                  <Text style={styles.detalleTitulo}>Detalle del pedido</Text>

                  {detallePedido.detalles.map((item: any) => {
                    const unidad = item.unidad_medida || 'kg';

                    return (
                      <View key={item.id_detalle_pedido} style={styles.productoDetalle}>
                        <Text style={styles.productoNombre}>{item.nombre}</Text>
                        <Text style={styles.detalle}>
                          Cantidad: {item.cantidad} {unidad}
                        </Text>
                        <Text style={styles.detalle}>
                          Precio: ₡{Number(item.precio_unitario).toFixed(2)} por {unidad}
                        </Text>
                        <Text style={styles.subtotal}>
                          Subtotal: ₡{Number(item.subtotal).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}

                  <View style={styles.botonesEstado}>
                    <Pressable
                      style={styles.botonAceptar}
                      onPress={() => cambiarEstado(pedido.id_pedido, 'Aceptado')}
                    >
                      <Text style={styles.textoBoton}>Aceptar</Text>
                    </Pressable>

                    <Pressable
                      style={styles.botonRechazar}
                      onPress={() => cambiarEstado(pedido.id_pedido, 'Rechazado')}
                    >
                      <Text style={styles.textoBoton}>Rechazar</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.botonEntregado}
                    onPress={() => cambiarEstado(pedido.id_pedido, 'Entregado')}
                  >
                    <Text style={styles.textoBoton}>Marcar como entregado</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      <Pressable style={styles.botonVolver} onPress={() => router.push('/home' as any)}>
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
  botonActualizar: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vacioBox: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  numeroPedido: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  estado: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  estadoPendiente: {
    backgroundColor: '#fff8e1',
    color: '#f57f17',
  },
  estadoAceptado: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  estadoRechazado: {
    backgroundColor: '#ffebee',
    color: '#b71c1c',
  },
  estadoEntregado: {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
  },
  detalle: {
    color: '#555',
    marginTop: 4,
  },
  observacion: {
    color: '#444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  total: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  botonDetalle: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoDetalle: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  detalleBox: {
    backgroundColor: '#f9fff9',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  detalleTitulo: {
    fontWeight: 'bold',
    color: '#1b5e20',
    fontSize: 17,
    marginBottom: 8,
  },
  productoDetalle: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  productoNombre: {
    fontWeight: 'bold',
    color: '#444',
  },
  subtotal: {
    color: '#1b5e20',
    fontWeight: 'bold',
    marginTop: 4,
  },
  botonesEstado: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  botonAceptar: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonRechazar: {
    flex: 1,
    backgroundColor: '#b71c1c',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonEntregado: {
    backgroundColor: '#0d47a1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  botonVolver: {
    backgroundColor: '#757575',
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