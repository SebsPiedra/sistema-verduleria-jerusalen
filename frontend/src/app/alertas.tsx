import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function AlertasScreen() {
  const router = useRouter();

  const [alertas, setAlertas] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      const respuesta = await api.get('/productos/alertas');
      setAlertas(respuesta.data);
    } catch (error) {
      console.log('Error al cargar alertas:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando alertas...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Alertas</Text>
      <Text style={styles.subtitulo}>Resumen del estado del inventario</Text>

      <View style={styles.resumenContainer}>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{alertas?.resumen?.stock_bajo || 0}</Text>
          <Text style={styles.resumenTexto}>Stock bajo</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{alertas?.resumen?.sin_precio || 0}</Text>
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

        {alertas?.stock_bajo?.length === 0 ? (
          <Text style={styles.textoOk}>No hay productos con stock bajo.</Text>
        ) : (
          alertas.stock_bajo.map((item: any) => (
            <View key={item.id_producto} style={styles.alertaCard}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>Cantidad actual: {item.cantidad}</Text>
              <Text style={styles.detalle}>Stock mínimo: {item.stock_minimo}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>💰 Productos sin precio</Text>

        {alertas?.sin_precio?.length === 0 ? (
          <Text style={styles.textoOk}>Todos los productos tienen precio.</Text>
        ) : (
          alertas.sin_precio.map((item: any) => (
            <View key={item.id_producto} style={styles.alertaCard}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>Precio compra: ₡{item.precio_compra}</Text>
              <Text style={styles.detalle}>Precio venta: ₡{item.precio_venta}</Text>

              <Pressable
                style={styles.botonEditar}
                onPress={() =>
                  router.push(`/editar-producto?id=${item.id_producto}` as any)
                }
              >
                <Text style={styles.textoEditar}>Agregar precio</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>⏰ Próximos a vencer</Text>

        {alertas?.proximos_vencer?.length === 0 ? (
          <Text style={styles.textoOk}>
            No hay productos próximos a vencer en los siguientes 7 días.
          </Text>
        ) : (
          alertas.proximos_vencer.map((item: any) => (
            <View key={item.id_producto} style={styles.alertaCard}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.detalle}>
                Fecha vencimiento: {String(item.fecha_vencimiento).split('T')[0]}
              </Text>
              <Text style={styles.detalle}>Cantidad: {item.cantidad}</Text>
            </View>
          ))
        )}
      </View>

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
    elevation: 2,
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