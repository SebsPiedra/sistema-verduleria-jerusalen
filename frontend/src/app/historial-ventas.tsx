import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function HistorialVentasScreen() {
  const router = useRouter();

  const [ventas, setVentas] = useState<any[]>([]);
  const [detalleVenta, setDetalleVenta] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarVentas = async () => {
    try {
      setCargando(true);
      const respuesta = await api.get('/ventas');
      setVentas(respuesta.data);
    } catch (error) {
      console.log('Error al cargar ventas:', error);
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    } finally {
      setCargando(false);
    }
  };

  const verDetalle = async (idVenta: number) => {
    try {
      setCargandoDetalle(true);
      const respuesta = await api.get(`/ventas/${idVenta}`);
      setDetalleVenta(respuesta.data);
    } catch (error) {
      console.log('Error al cargar detalle:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la venta');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalleVenta(null);
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

  const totalGeneral = ventas.reduce(
    (total, item) => total + Number(item.total || 0),
    0
  );

  useEffect(() => {
    cargarVentas();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando ventas...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Historial de ventas</Text>
      <Text style={styles.subtitulo}>Facturas internas registradas</Text>

      <View style={styles.resumen}>
        <View>
          <Text style={styles.resumenTexto}>Total vendido</Text>
          <Text style={styles.resumenMonto}>₡{totalGeneral.toFixed(2)}</Text>
        </View>

        <View style={styles.resumenCantidad}>
          <Text style={styles.resumenNumero}>{ventas.length}</Text>
          <Text style={styles.resumenLabel}>ventas</Text>
        </View>
      </View>

      {ventas.length === 0 ? (
        <View style={styles.sinDatos}>
          <Text style={styles.sinDatosIcono}>🧾</Text>
          <Text style={styles.sinDatosTitulo}>No hay ventas registradas</Text>
          <Text style={styles.sinDatosTexto}>
            Cuando registres una venta, aparecerá en este historial.
          </Text>
        </View>
      ) : (
        ventas.map((venta) => (
          <View key={venta.id_venta} style={styles.cardVenta}>
            <View style={styles.fila}>
              <Text style={styles.factura}>{venta.numero_factura}</Text>
              <Text style={styles.total}>₡{Number(venta.total).toFixed(2)}</Text>
            </View>

            <Text style={styles.detalle}>Cliente: {venta.cliente}</Text>
            <Text style={styles.detalle}>Método de pago: {venta.metodo_pago}</Text>
            <Text style={styles.detalle}>
              Fecha: {formatearFecha(venta.fecha_venta)}
            </Text>
            <Text style={styles.detalle}>
              Productos vendidos: {venta.cantidad_productos}
            </Text>

            <Pressable
              style={styles.botonDetalle}
              onPress={() => verDetalle(venta.id_venta)}
            >
              <Text style={styles.textoDetalle}>Ver detalle</Text>
            </Pressable>
          </View>
        ))
      )}

      {detalleVenta && (
        <View style={styles.detalleBox}>
          <Text style={styles.detalleTitulo}>Detalle de factura</Text>

          <Text style={styles.detalle}>
            Factura: {detalleVenta.venta.numero_factura}
          </Text>
          <Text style={styles.detalle}>Cliente: {detalleVenta.venta.cliente}</Text>
          <Text style={styles.detalle}>
            Total: ₡{Number(detalleVenta.venta.total).toFixed(2)}
          </Text>

          <View style={styles.linea} />

          {cargandoDetalle ? (
            <ActivityIndicator size="small" />
          ) : (
            detalleVenta.detalles.map((item: any) => (
              <View key={item.id_detalle} style={styles.productoDetalle}>
                <Text style={styles.productoNombre}>{item.nombre}</Text>
                <Text style={styles.detalle}>
                  Cantidad: {item.cantidad} {item.unidad_medida || 'kg'}
                </Text>
                <Text style={styles.detalle}>
                  Precio: ₡{Number(item.precio_unitario).toFixed(2)}
                </Text>
                <Text style={styles.subtotal}>
                  Subtotal: ₡{Number(item.subtotal).toFixed(2)}
                </Text>
              </View>
            ))
          )}

          <Pressable style={styles.botonCerrar} onPress={cerrarDetalle}>
            <Text style={styles.textoCerrar}>Cerrar detalle</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.botonVolver} onPress={() => router.push('/home')}>
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
    marginBottom: 18,
  },
  resumen: {
    backgroundColor: '#1b5e20',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumenTexto: {
    color: '#dcedc8',
    fontSize: 15,
  },
  resumenMonto: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  resumenCantidad: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  resumenNumero: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resumenLabel: {
    color: '#e8f5e9',
    fontSize: 13,
  },
  sinDatos: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  sinDatosIcono: {
    fontSize: 40,
    marginBottom: 8,
  },
  sinDatosTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  sinDatosTexto: {
    color: '#555',
    textAlign: 'center',
    marginTop: 6,
  },
  cardVenta: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d7ead8',
    elevation: 2,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  factura: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    flex: 1,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  detalle: {
    color: '#555',
    marginTop: 5,
  },
  botonDetalle: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoDetalle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detalleBox: {
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffe082',
    marginTop: 10,
    marginBottom: 14,
  },
  detalleTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef6c00',
    marginBottom: 8,
  },
  linea: {
    height: 1,
    backgroundColor: '#ffe082',
    marginVertical: 12,
  },
  productoDetalle: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  productoNombre: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  subtotal: {
    marginTop: 6,
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonCerrar: {
    backgroundColor: '#ef6c00',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoCerrar: {
    color: '#fff',
    fontWeight: 'bold',
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