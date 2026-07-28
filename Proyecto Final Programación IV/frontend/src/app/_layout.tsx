import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="home" options={{ title: 'Inicio' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />

      <Stack.Screen name="cliente-login" options={{ title: 'Ingreso cliente' }} />
      <Stack.Screen name="cliente-registro" options={{ title: 'Registro cliente' }} />
      <Stack.Screen name="cliente-home" options={{ title: 'Cliente' }} />
      <Stack.Screen name="cliente-pedido" options={{ title: 'Hacer pedido' }} />
      <Stack.Screen name="cliente-mis-pedidos" options={{ title: 'Mis pedidos' }} />
      <Stack.Screen name="proveedores" options={{ title: 'Proveedores' }} />

      <Stack.Screen name="productos" options={{ title: 'Productos' }} />
      <Stack.Screen name="pedidos-admin" options={{ title: 'Pedidos' }} />
      <Stack.Screen name="registrar-producto" options={{ title: 'Registrar producto' }} />
      <Stack.Screen name="editar-producto" options={{ title: 'Editar producto' }} />
      <Stack.Screen name="stock-bajo" options={{ title: 'Stock bajo' }} />
      <Stack.Screen name="alertas" options={{ title: 'Alertas' }} />
      <Stack.Screen name="ventas" options={{ title: 'Ventas' }} />
      <Stack.Screen name="historial-ventas" options={{ title: 'Historial de ventas' }} />
      <Stack.Screen name="desechos" options={{ title: 'Desechos' }} />
      
      
    </Stack>
  );
}