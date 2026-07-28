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
import { obtenerDato } from '../services/storage.js';

export default function ClienteMisPedidosScreen() {
  const router = useRouter();

  const [cliente, setCliente] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [detallePedido, setDetallePedido] = useState<any>(null);

  const cargarClienteYPedidos = async () => {
    try {
      setCargando(true);

      const clienteGuardado = await obtenerDato('cliente');

      if (!clienteGuardado) {
        Alert.alert('Sesión requerida', 'Debe iniciar sesión como cliente');
        router.replace('/cliente-login' as any);
        return;
      }

      const clienteData = JSON.parse(clienteGuardado);
      setCliente(clienteData);

      const respuesta = await api.get(`/pedidos/cliente/${clienteData.id_cliente}`);
      setPedidos(respuesta.data);
    } catch (error) {
      console.log('Error al cargar pedidos del cliente:', error);
      Alert.alert('Error', 'No se pudieron cargar sus pedidos');
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
      console.log('Error al cargar detalle del pedido:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido');
    }
  };

  useEffect(() => {
    cargarClienteYPedidos();
  }, []);

  const obtenerMensajeEstado = (estado: string) => {
    if (estado === 'Pendiente') {
      return 'Su pedido fue recibido y está esperando revisión.';
    }

    if (estado === 'Aceptado') {
      return 'Su pedido fue aceptado y está en preparación.';
    }

    if (estado === 'Rechazado') {
      return 'Su pedido fue rechazado por la administración.';
    }

    if (estado === 'Entregado') {
      return 'Su pedido ya fue entregado.';
    }

    if (estado === 'Cancelado') {
      return 'Su pedido fue cancelado.';
    }

    return 'Estado del pedido en revisión.';
  };

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
      <Text style={styles.titulo}>Mis pedidos</Text>

      <Text style={styles.subtitulo}>
        Cliente: {cliente?.nombre || 'Cliente'}
      </Text>

      <Pressable style={styles.botonActualizar} onPress={cargarClienteYPedidos}>
        <Text style={styles.textoBoton}>Actualizar seguimiento</Text>
      </Pressable>

      {pedidos.length === 0 ? (
        <View style={styles.vacioBox}>
          <Text style={styles.textoVacio}>
            Todavía no tiene pedidos registrados.
          </Text>
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
                    estado === 'Cancelado' && styles.estadoCancelado,
                  ]}
                >
                  {estado}
                </Text>
              </View>

              <View style={styles.seguimientoBox}>
                <Text style={styles.seguimientoTitulo}>Seguimiento</Text>
                <Text style={styles.seguimientoTexto}>
                  {obtenerMensajeEstado(estado)}
                </Text>
              </View>

              <Text style={styles.detalle}>
                Método de pago: {pedido.metodo_pago}
              </Text>
              <Text style={styles.detalle}>
  Dirección de entrega: {pedido.direccion_entrega || 'No indicada'}
</Text>

              {pedido.observacion ? (
                <Text style={styles.detalle}>
                  Observación: {pedido.observacion}
                </Text>
              ) : null}

              <Text style={styles.total}>
                Total: ₡{Number(pedido.total).toFixed(2)}
              </Text>

              <Text style={styles.detalle}>
                Inventario descontado:{' '}
                {Number(pedido.inventario_descontado) === 1 ? 'Sí' : 'No'}
              </Text>

              <Pressable
                style={styles.botonDetalle}
                onPress={() => cargarDetalle(pedido.id_pedido)}
              >
                <Text style={styles.textoDetalle}>
                  {detalleAbierto === pedido.id_pedido
                    ? 'Ocultar detalle'
                    : 'Ver detalle del pedido'}
                </Text>
              </Pressable>

              {detalleAbierto === pedido.id_pedido && detallePedido && (
                <View style={styles.detalleBox}>
                  <Text style={styles.detalleTitulo}>Productos solicitados</Text>

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
                </View>
              )}
            </View>
          );
        })
      )}

      <Pressable
        style={styles.botonNuevoPedido}
        onPress={() => router.push('/cliente-pedido' as any)}
      >
        <Text style={styles.textoBoton}>Hacer nuevo pedido</Text>
      </Pressable>

      <Pressable
        style={styles.botonVolver}
        onPress={() => router.push('/cliente-home' as any)}
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
  estadoCancelado: {
    backgroundColor: '#eeeeee',
    color: '#424242',
  },
  seguimientoBox: {
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  seguimientoTitulo: {
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  seguimientoTexto: {
    color: '#555',
    marginTop: 4,
  },
  detalle: {
    color: '#555',
    marginTop: 4,
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
  botonNuevoPedido: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botonVolver: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});