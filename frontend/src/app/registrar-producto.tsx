import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function RegistrarProductoScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const unidades = ['kg', 'unidad', 'bolsa', 'manojo', 'caja', 'rollo', 'paquete'];

  const convertirNumero = (valor: string) => {
    return Number(String(valor).replace(',', '.'));
  };

  const guardarProducto = async () => {
    if (!nombre || !precioCompra || !precioVenta || !cantidad) {
      Alert.alert('Campos requeridos', 'Complete nombre, precios y cantidad');
      return;
    }

    if (convertirNumero(precioCompra) < 0 || convertirNumero(precioVenta) < 0) {
      Alert.alert('Precio inválido', 'Los precios no pueden ser negativos');
      return;
    }

    if (convertirNumero(cantidad) < 0) {
      Alert.alert('Cantidad inválida', 'La cantidad no puede ser negativa');
      return;
    }

    try {
      await api.post('/productos', {
        nombre,
        id_categoria: 6,
        id_proveedor: 1,
        precio_compra: convertirNumero(precioCompra),
        precio_venta: convertirNumero(precioVenta),
        cantidad: convertirNumero(cantidad),
        stock_minimo: convertirNumero(stockMinimo || '5'),
        unidad_medida: unidadMedida,
        fecha_vencimiento: fechaVencimiento || null,
      });

      Alert.alert('Correcto', 'Producto registrado correctamente');

      setNombre('');
      setPrecioCompra('');
      setPrecioVenta('');
      setCantidad('');
      setStockMinimo('5');
      setUnidadMedida('kg');
      setFechaVencimiento('');

      router.replace('/productos');
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el producto');
      console.log(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Registrar producto</Text>

      <Text style={styles.label}>Nombre del producto</Text>
      <TextInput
        style={styles.input}
        placeholder="Ejemplo: Tomate"
        value={nombre}
        onChangeText={setNombre}
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

      <Text style={styles.label}>Precio de compra por {unidadMedida}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Ejemplo: 1000 por ${unidadMedida}`}
        value={precioCompra}
        onChangeText={setPrecioCompra}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Precio de venta por {unidadMedida}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Ejemplo: 1500 por ${unidadMedida}`}
        value={precioVenta}
        onChangeText={setPrecioVenta}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Cantidad disponible en {unidadMedida}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Ejemplo: 10 ${unidadMedida}`}
        value={cantidad}
        onChangeText={setCantidad}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Stock mínimo en {unidadMedida}</Text>
      <TextInput
        style={styles.input}
        placeholder={`Ejemplo: 5 ${unidadMedida}`}
        value={stockMinimo}
        onChangeText={setStockMinimo}
        keyboardType="numeric"
      />

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
          Producto: {nombre || 'Sin nombre'}
        </Text>
        <Text style={styles.vistaTexto}>
          Precio venta: ₡{precioVenta || '0'} por {unidadMedida}
        </Text>
        <Text style={styles.vistaTexto}>
          Inventario: {cantidad || '0'} {unidadMedida}
        </Text>
      </View>

      <Pressable style={styles.boton} onPress={guardarProducto}>
        <Text style={styles.textoBoton}>Guardar producto</Text>
      </Pressable>

      <Pressable style={styles.botonVolver} onPress={() => router.push('/home')}>
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
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
    marginBottom: 25,
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
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  botonVolver: {
    marginTop: 18,
    alignItems: 'center',
  },
  textoVolver: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 16,
  },
});