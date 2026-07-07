import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function RegistrarProductoScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [idProveedor, setIdProveedor] = useState('');
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const unidades = ['kg', 'unidad', 'bolsa', 'manojo', 'caja', 'rollo', 'paquete'];

  const cargarProveedores = async () => {
    try {
      const respuesta = await api.get('/proveedores');
      setProveedores(respuesta.data);

      if (respuesta.data.length > 0) {
        setIdProveedor(String(respuesta.data[0].id_proveedor));
      }
    } catch (error) {
      console.log('Error al cargar proveedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const convertirNumero = (valor: string) => {
    return Number(String(valor || '0').replace(',', '.'));
  };

  const registrarProducto = async () => {
    if (!nombre) {
      Alert.alert('Campo requerido', 'Debe ingresar el nombre del producto');
      return;
    }

    if (!idProveedor) {
      Alert.alert(
        'Proveedor requerido',
        'Debe seleccionar un proveedor para el producto'
      );
      return;
    }

    try {
      setCargando(true);

      await api.post('/productos', {
        nombre,
        cantidad: convertirNumero(cantidad),
        precio_compra: convertirNumero(precioCompra),
        precio_venta: convertirNumero(precioVenta),
        stock_minimo: convertirNumero(stockMinimo),
        unidad_medida: unidadMedida,
        id_proveedor: Number(idProveedor),
      });

      Alert.alert('Producto registrado', 'El producto fue registrado correctamente');

      setNombre('');
      setCantidad('');
      setPrecioCompra('');
      setPrecioVenta('');
      setStockMinimo('5');
      setUnidadMedida('kg');

      router.push('/productos' as any);
    } catch (error: any) {
      console.log('Error al registrar producto:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo registrar el producto'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Registrar producto</Text>

      <Text style={styles.subtitulo}>
        Complete la información del producto y seleccione el proveedor correspondiente.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre del producto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: Tomate"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Cantidad inicial</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 10"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Precio de compra</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 800"
          value={precioCompra}
          onChangeText={setPrecioCompra}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Precio de venta</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 1200"
          value={precioVenta}
          onChangeText={setPrecioVenta}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Stock mínimo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 5"
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
                  unidadMedida === unidad && styles.unidadTextoSeleccionado,
                ]}
              >
                {unidad}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Proveedor</Text>

        {proveedores.length === 0 ? (
          <View style={styles.sinProveedoresBox}>
            <Text style={styles.sinProveedoresTexto}>
              No hay proveedores registrados.
            </Text>

            <Pressable
              style={styles.botonProveedor}
              onPress={() => router.push('/proveedores' as any)}
            >
              <Text style={styles.textoProveedor}>Registrar proveedor</Text>
            </Pressable>
          </View>
        ) : (
          proveedores.map((proveedor) => (
            <Pressable
              key={proveedor.id_proveedor}
              style={[
                styles.proveedorItem,
                idProveedor === String(proveedor.id_proveedor) &&
                  styles.proveedorSeleccionado,
              ]}
              onPress={() => setIdProveedor(String(proveedor.id_proveedor))}
            >
              <Text
                style={[
                  styles.proveedorNombre,
                  idProveedor === String(proveedor.id_proveedor) &&
                    styles.proveedorNombreSeleccionado,
                ]}
              >
                {proveedor.nombre}
              </Text>

              <Text
                style={[
                  styles.proveedorDetalle,
                  idProveedor === String(proveedor.id_proveedor) &&
                    styles.proveedorDetalleSeleccionado,
                ]}
              >
                Teléfono: {proveedor.telefono || 'No indicado'}
              </Text>
            </Pressable>
          ))
        )}

        <Pressable
          style={[styles.botonGuardar, cargando && styles.botonDesactivado]}
          onPress={registrarProducto}
          disabled={cargando}
        >
          <Text style={styles.textoBoton}>
            {cargando ? 'Guardando...' : 'Guardar producto'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.botonVolver}
          onPress={() => router.push('/productos' as any)}
        >
          <Text style={styles.textoVolver}>Volver</Text>
        </Pressable>
      </View>
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
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f9fff9',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  unidadesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  unidadBoton: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  unidadSeleccionada: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  unidadTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  unidadTextoSeleccionado: {
    color: '#fff',
  },
  proveedorItem: {
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginBottom: 8,
  },
  proveedorSeleccionado: {
    backgroundColor: '#2e7d32',
    borderColor: '#1b5e20',
  },
  proveedorNombre: {
    fontWeight: 'bold',
    color: '#1b5e20',
    fontSize: 16,
  },
  proveedorNombreSeleccionado: {
    color: '#fff',
  },
  proveedorDetalle: {
    color: '#555',
    marginTop: 4,
  },
  proveedorDetalleSeleccionado: {
    color: '#e8f5e9',
  },
  sinProveedoresBox: {
    backgroundColor: '#fff8e1',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe082',
    marginBottom: 10,
  },
  sinProveedoresTexto: {
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  botonProveedor: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  textoProveedor: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonGuardar: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botonDesactivado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonVolver: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});