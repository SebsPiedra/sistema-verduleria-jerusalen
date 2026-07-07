import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function DashboardScreen() {
  const router = useRouter();

  const [resumen, setResumen] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargarResumen = async () => {
    try {
      setCargando(true);
      const respuesta = await api.get('/dashboard/resumen');
      setResumen(respuesta.data);
    } catch (error) {
      console.log('Error al cargar dashboard:', error);
      Alert.alert('Error', 'No se pudo cargar el resumen general');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando resumen...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Dashboard</Text>
      <Text style={styles.subtitulo}>Resumen general de la verdulería</Text>

      <View style={styles.cardPrincipal}>
        <Text style={styles.cardPrincipalTitulo}>Ventas totales internas</Text>
        <Text style={styles.cardPrincipalMonto}>
          ₡{Number(resumen?.monto_total_ventas || 0).toFixed(2)}
        </Text>
        <Text style={styles.cardPrincipalTexto}>
          {resumen?.total_ventas || 0} ventas registradas
        </Text>
      </View>

      <View style={styles.cardPedidoPrincipal}>
        <Text style={styles.cardPrincipalTitulo}>Pedidos de clientes</Text>
        <Text style={styles.cardPrincipalMonto}>
          ₡{Number(resumen?.monto_total_pedidos || 0).toFixed(2)}
        </Text>
        <Text style={styles.cardPrincipalTexto}>
          {resumen?.total_pedidos || 0} pedidos registrados
        </Text>
      </View>

      <Text style={styles.seccionTituloGrande}>Inventario</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.icono}>🥬</Text>
          <Text style={styles.numero}>{resumen?.total_productos || 0}</Text>
          <Text style={styles.label}>Productos</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icono}>📦</Text>
          <Text style={styles.numero}>{resumen?.productos_stock_bajo || 0}</Text>
          <Text style={styles.label}>Stock bajo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icono}>⚠️</Text>
          <Text style={styles.numero}>{resumen?.productos_sin_precio || 0}</Text>
          <Text style={styles.label}>Sin precio</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icono}>👥</Text>
          <Text style={styles.numero}>{resumen?.total_clientes || 0}</Text>
          <Text style={styles.label}>Clientes</Text>
        </View>
      </View>

      <Text style={styles.seccionTituloGrande}>Pedidos</Text>

      <View style={styles.grid}>
        <View style={styles.cardPedido}>
          <Text style={styles.icono}>🛍️</Text>
          <Text style={styles.numeroPedido}>{resumen?.total_pedidos || 0}</Text>
          <Text style={styles.labelPedido}>Pedidos totales</Text>
        </View>

        <View style={styles.cardPendiente}>
          <Text style={styles.icono}>⏳</Text>
          <Text style={styles.numeroPendiente}>{resumen?.pedidos_pendientes || 0}</Text>
          <Text style={styles.labelPendiente}>Pendientes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icono}>✅</Text>
          <Text style={styles.numero}>{resumen?.pedidos_aceptados || 0}</Text>
          <Text style={styles.label}>Aceptados</Text>
        </View>

        <View style={styles.cardEntregado}>
          <Text style={styles.icono}>🚚</Text>
          <Text style={styles.numeroEntregado}>{resumen?.pedidos_entregados || 0}</Text>
          <Text style={styles.labelEntregado}>Entregados</Text>
        </View>

        <View style={styles.cardPerdida}>
          <Text style={styles.icono}>❌</Text>
          <Text style={styles.numeroPerdida}>{resumen?.pedidos_rechazados || 0}</Text>
          <Text style={styles.labelPerdida}>Rechazados</Text>
        </View>

        <View style={styles.cardPedido}>
          <Text style={styles.icono}>💰</Text>
          <Text style={styles.numeroPedido}>
            ₡{Number(resumen?.monto_total_pedidos || 0).toFixed(2)}
          </Text>
          <Text style={styles.labelPedido}>Total pedidos</Text>
        </View>
      </View>

      <Text style={styles.seccionTituloGrande}>Ventas y pérdidas</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.icono}>🧾</Text>
          <Text style={styles.numero}>{resumen?.total_ventas || 0}</Text>
          <Text style={styles.label}>Ventas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icono}>💵</Text>
          <Text style={styles.numero}>
            ₡{Number(resumen?.monto_total_ventas || 0).toFixed(2)}
          </Text>
          <Text style={styles.label}>Monto ventas</Text>
        </View>

        <View style={styles.cardPerdida}>
          <Text style={styles.icono}>🗑️</Text>
          <Text style={styles.numeroPerdida}>{resumen?.total_desechos || 0}</Text>
          <Text style={styles.labelPerdida}>Desechos</Text>
        </View>

        <View style={styles.cardPerdida}>
          <Text style={styles.icono}>💸</Text>
          <Text style={styles.numeroPerdida}>
            ₡{Number(resumen?.monto_total_perdidas || 0).toFixed(2)}
          </Text>
          <Text style={styles.labelPerdida}>Pérdidas</Text>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Accesos rápidos</Text>

        <Pressable style={styles.boton} onPress={() => router.push('/productos' as any)}>
          <Text style={styles.textoBoton}>Ver productos</Text>
        </Pressable>

        <Pressable style={styles.boton} onPress={() => router.push('/ventas' as any)}>
          <Text style={styles.textoBoton}>Registrar venta</Text>
        </Pressable>

        <Pressable style={styles.boton} onPress={() => router.push('/pedidos-admin' as any)}>
          <Text style={styles.textoBoton}>Gestionar pedidos</Text>
        </Pressable>

        <Pressable style={styles.boton} onPress={() => router.push('/desechos' as any)}>
          <Text style={styles.textoBoton}>Registrar desecho</Text>
        </Pressable>

        <Pressable style={styles.botonSecundario} onPress={cargarResumen}>
          <Text style={styles.textoSecundario}>Actualizar resumen</Text>
        </Pressable>
      </View>

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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 18,
  },
  cardPrincipal: {
    backgroundColor: '#1b5e20',
    padding: 22,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardPedidoPrincipal: {
    backgroundColor: '#0d47a1',
    padding: 22,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardPrincipalTitulo: {
    color: '#e8f5e9',
    fontSize: 16,
  },
  cardPrincipalMonto: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardPrincipalTexto: {
    color: '#e8f5e9',
    marginTop: 6,
  },
  seccionTituloGrande: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    alignItems: 'center',
  },
  cardPedido: {
    backgroundColor: '#e3f2fd',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bbdefb',
    alignItems: 'center',
  },
  cardPendiente: {
    backgroundColor: '#fff8e1',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffe082',
    alignItems: 'center',
  },
  cardEntregado: {
    backgroundColor: '#e8f5e9',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    alignItems: 'center',
  },
  cardPerdida: {
    backgroundColor: '#ffebee',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
  },
  icono: {
    fontSize: 28,
    marginBottom: 5,
  },
  numero: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  numeroPedido: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d47a1',
    textAlign: 'center',
  },
  numeroPendiente: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#f57f17',
    textAlign: 'center',
  },
  numeroEntregado: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  numeroPerdida: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b71c1c',
    textAlign: 'center',
  },
  label: {
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  labelPedido: {
    color: '#0d47a1',
    marginTop: 4,
    textAlign: 'center',
  },
  labelPendiente: {
    color: '#f57f17',
    marginTop: 4,
    textAlign: 'center',
  },
  labelEntregado: {
    color: '#2e7d32',
    marginTop: 4,
    textAlign: 'center',
  },
  labelPerdida: {
    color: '#b71c1c',
    marginTop: 4,
    textAlign: 'center',
  },
  seccion: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 14,
  },
  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 12,
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonSecundario: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  textoSecundario: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});