import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { eliminarDato } from '../services/storage.js';

export default function HomeScreen() {
  const router = useRouter();

  const cerrarSesion = async () => {
    await eliminarDato('token');
    await eliminarDato('usuario');
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Verdulería Jerusalén</Text>
        <Text style={styles.subtitulo}>Sistema de inventario y ventas</Text>
      </View>

      <View style={styles.grid}>
        <Pressable style={styles.card} onPress={() => router.push('/historial-ventas')}>
  <Text style={styles.icono}>📋</Text>
  <Text style={styles.cardTitulo}>Historial ventas</Text>
  <Text style={styles.cardTexto}>Ver facturas y ventas registradas</Text>
</Pressable>
        <Pressable style={styles.card} onPress={() => router.push('/desechos')}>
  <Text style={styles.icono}>🗑️</Text>
  <Text style={styles.cardTitulo}>Desechos</Text>
  <Text style={styles.cardTexto}>Registrar productos dañados y pérdidas</Text>
</Pressable>
        <Pressable style={styles.card} onPress={() => router.push('/ventas')}>
  <Text style={styles.icono}>🧾</Text>
  <Text style={styles.cardTitulo}>Ventas</Text>
  <Text style={styles.cardTexto}>Registrar ventas y generar factura interna</Text>
</Pressable>

<Pressable style={styles.card} onPress={() => router.push('/dashboard')}>
  <Text style={styles.icono}>📊</Text>
  <Text style={styles.cardTitulo}>Dashboard</Text>
  <Text style={styles.cardTexto}>Ver resumen general de productos, ventas y pérdidas</Text>
</Pressable>
<Pressable style={styles.card} onPress={() => router.push('/pedidos-admin' as any)}>
  <Text style={styles.icono}>🛍️</Text>
  <Text style={styles.cardTitulo}>Pedidos</Text>
  <Text style={styles.cardTexto}>Ver y gestionar pedidos realizados por clientes</Text>
</Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/productos')}>
          <Text style={styles.icono}>🥬</Text>
          <Text style={styles.cardTitulo}>Productos</Text>
          <Text style={styles.cardTexto}>Ver, consultar y editar productos</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/registrar-producto')}>
          <Text style={styles.icono}>➕</Text>
          <Text style={styles.cardTitulo}>Registrar</Text>
          <Text style={styles.cardTexto}>Agregar nuevos productos</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/stock-bajo')}>
          <Text style={styles.icono}>📦</Text>
          <Text style={styles.cardTitulo}>Stock bajo</Text>
          <Text style={styles.cardTexto}>Productos faltantes o por agotarse</Text>
        </Pressable>
<Pressable style={styles.card} onPress={() => router.push('/proveedores' as any)}>
  <Text style={styles.icono}>🚚</Text>
  <Text style={styles.cardTitulo}>Proveedores</Text>
  <Text style={styles.cardTexto}>Registrar y consultar proveedores de productos</Text>
</Pressable>
        <Pressable style={styles.card} onPress={() => router.push('/alertas')}>
          <Text style={styles.icono}>⚠️</Text>
          <Text style={styles.cardTitulo}>Alertas</Text>
          <Text style={styles.cardTexto}>Precios, vencimientos y stock</Text>
        </Pressable>
      </View>
      
      <Pressable style={styles.botonSalir} onPress={cerrarSesion}>
        <Text style={styles.textoSalir}>Cerrar sesión</Text>
      </Pressable>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 22,
    backgroundColor: '#eef8ef',
  },
  header: {
    backgroundColor: '#1b5e20',
    padding: 24,
    borderRadius: 22,
    marginBottom: 22,
  },
  titulo: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#dcedc8',
    fontSize: 16,
    marginTop: 6,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7ead8',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  icono: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitulo: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  cardTexto: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  botonSalir: {
    backgroundColor: '#b71c1c',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  textoSalir: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});