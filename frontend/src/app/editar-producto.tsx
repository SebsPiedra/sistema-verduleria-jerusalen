import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';

export default function EditarProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const unidades = ['kg', 'unidad', 'bolsa', 'manojo', 'caja', 'rollo', 'paquete'];

  const cargarProducto = async () => {
    try {
      const respuesta = await api.get(`/productos/${id}`);
      const p = respuesta.data;

      setNombre(p.nombre || '');
      setPrecioCompra(String(p.precio_compra || '0'));
      setPrecioVenta(String(p.precio_venta || '0'));
      setCantidad(String(p.cantidad || '0'));
      setStockMinimo(String(p.stock_minimo || '5'));
      setUnidadMedida(p.unidad_medida || 'kg');
      setFechaVencimiento(
        p.fecha_vencimiento ? String(p.fecha_vencimiento).split('T')[0] : ''
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el producto');
      console.log(error);
    } finally {
      setCargando(false);
    }
  };

  const convertirNumero = (valor: string) => {
    return Number(String(valor).replace(',', '.'));
  };

  const guardarCambios = async () => {
    if (!nombre || !precioCompra || !precioVenta || !cantidad) {
      Alert.alert('Campos requeridos', 'Complete los datos principales');
      return;
    }

    try {
      await api.put(`/productos/${id}`, {
        nombre,
        precio_compra: convertirNumero(precioCompra),
        precio_venta: convertirNumero(precioVenta),
        cantidad: convertirNumero(cantidad),
        stock_minimo: convertirNumero(stockMinimo || '5'),
        unidad_medida: unidadMedida,
        fecha_vencimiento: fechaVencimiento || null,
        estado: 'Activo',
      });

      Alert.alert('Correcto', 'Producto actualizado correctamente');
      router.replace('/productos');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto');
      console.log(error);
    }
  };

  useEffect(() => {
    cargarProducto();
  }, []);

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando producto...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Editar producto</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Precio compra</Text>
      <TextInput
        style={styles.input}
        placeholder="Precio compra"
        value={precioCompra}
        onChangeText={setPrecioCompra}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Precio venta</Text>
      <TextInput
        style={styles.input}
        placeholder="Precio venta"
        value={precioVenta}
        onChangeText={setPrecioVenta}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Cantidad disponible</Text>
      <TextInput
        style={styles.input}
        placeholder="Cantidad"
        value={cantidad}
        onChangeText={setCantidad}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Stock mínimo</Text>
      <TextInput
        style={styles.input}
        placeholder="Stock mínimo"
        value={stockMinimo}
        onChangeText={setStockMinimo}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Unidad de medida</Text>

      <View style={styles.unidadesContainer}>
        {unidades.map((unidad) => (
          <Pressable
            key={unidad}
            style={[
              styles.unidadBoton,
              unidadMedida === unidad && styles.unidadSeleccionada,
            ]}
            onPress={() => setUnidadMedida(unidad)}
          >
            <Text
              style={[
                styles.unidadTexto,
                unidadMedida === unidad && styles.unidadTextoSeleccionada,
              ]}
            >
              {unidad}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Fecha de vencimiento</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={fechaVencimiento}
        onChangeText={setFechaVencimiento}
      />

      <View style={styles.vistaPrevia}>
        <Text style={styles.vistaTitulo}>Vista previa</Text>
        <Text style={styles.vistaTexto}>
          Precio venta: ₡{precioVenta || '0'} / {unidadMedida}
        </Text>
        <Text style={styles.vistaTexto}>
          Inventario: {cantidad || '0'} {unidadMedida}
        </Text>
      </View>

      <Pressable style={styles.boton} onPress={guardarCambios}>
        <Text style={styles.textoBoton}>Guardar cambios</Text>
      </Pressable>

      <Pressable style={styles.botonVolver} onPress={() => router.push('/productos')}>
        <Text style={styles.textoVolver}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#eef8ef',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
    marginBottom: 22,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  unidadesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unidadBoton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  unidadSeleccionada: {
    backgroundColor: '#2e7d32',
  },
  unidadTexto: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  unidadTextoSeleccionada: {
    color: '#fff',
  },
  vistaPrevia: {
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  vistaTitulo: {
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 4,
  },
  vistaTexto: {
    color: '#444',
    marginTop: 3,
  },
  boton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonVolver: {
    marginTop: 18,
    alignItems: 'center',
  },
  textoVolver: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});