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
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';

export default function EditarProductoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const idProducto = params.id_producto || params.id;

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [estado, setEstado] = useState('Activo');
  const [idProveedor, setIdProveedor] = useState('');
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const unidades = ['kg', 'unidad', 'bolsa', 'manojo', 'caja', 'rollo', 'paquete'];
  const estados = ['Activo', 'Inactivo'];

  const convertirNumero = (valor: string) => {
    return Number(String(valor || '0').replace(',', '.'));
  };

  const cargarProveedores = async () => {
    try {
      const respuesta = await api.get('/proveedores');
      setProveedores(respuesta.data);
    } catch (error) {
      console.log('Error al cargar proveedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    }
  };

  const cargarProducto = async () => {
    if (!idProducto) {
      Alert.alert('Error', 'No se recibió el producto a editar');
      router.push('/productos' as any);
      return;
    }

    try {
      const respuesta = await api.get(`/productos/${idProducto}`);
      const producto = respuesta.data;

      setNombre(producto.nombre || '');
      setCantidad(String(producto.cantidad ?? ''));
      setPrecioCompra(String(producto.precio_compra ?? ''));
      setPrecioVenta(String(producto.precio_venta ?? ''));
      setStockMinimo(String(producto.stock_minimo ?? '5'));
      setUnidadMedida(producto.unidad_medida || 'kg');
      setEstado(producto.estado || 'Activo');
      setIdProveedor(producto.id_proveedor ? String(producto.id_proveedor) : '');
    } catch (error) {
      console.log('Error al cargar producto:', error);
      Alert.alert('Error', 'No se pudo cargar la información del producto');
    }
  };

  useEffect(() => {
    cargarProveedores();
    cargarProducto();
  }, []);

  const guardarCambios = async () => {
    if (!nombre) {
      Alert.alert('Campo requerido', 'Debe ingresar el nombre del producto');
      return;
    }

    if (!idProveedor) {
      Alert.alert('Proveedor requerido', 'Debe seleccionar un proveedor');
      return;
    }

    try {
      setCargando(true);

      await api.put(`/productos/${idProducto}`, {
        nombre,
        cantidad: convertirNumero(cantidad),
        precio_compra: convertirNumero(precioCompra),
        precio_venta: convertirNumero(precioVenta),
        stock_minimo: convertirNumero(stockMinimo),
        unidad_medida: unidadMedida,
        id_proveedor: Number(idProveedor),
        estado,
      });

      Alert.alert('Producto actualizado', 'Los cambios se guardaron correctamente');
      router.push('/productos' as any);
    } catch (error: any) {
      console.log('Error al editar producto:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo actualizar el producto'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Editar producto</Text>

      <Text style={styles.subtitulo}>
        Modifique la información del producto y seleccione el proveedor correspondiente.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre del producto</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          style={styles.input}
          placeholder="Cantidad"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Precio de compra</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio de compra"
          value={precioCompra}
          onChangeText={setPrecioCompra}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Precio de venta</Text>
        <TextInput
          style={styles.input}
          placeholder="Precio de venta"
          value={precioVenta}
          onChangeText={setPrecioVenta}
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

        <View style={styles.opcionesContainer}>
          {unidades.map((unidad) => (
            <Pressable
              key={unidad}
              style={[
                styles.opcionBoton,
                unidadMedida === unidad && styles.opcionSeleccionada,
              ]}
              onPress={() => setUnidadMedida(unidad)}
            >
              <Text
                style={[
                  styles.opcionTexto,
                  unidadMedida === unidad && styles.opcionTextoSeleccionado,
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

        <Text style={styles.label}>Estado</Text>

        <View style={styles.opcionesContainer}>
          {estados.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.opcionBoton,
                estado === item && styles.opcionSeleccionada,
              ]}
              onPress={() => setEstado(item)}
            >
              <Text
                style={[
                  styles.opcionTexto,
                  estado === item && styles.opcionTextoSeleccionado,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.botonGuardar, cargando && styles.botonDesactivado]}
          onPress={guardarCambios}
          disabled={cargando}
        >
          <Text style={styles.textoBoton}>
            {cargando ? 'Guardando...' : 'Guardar cambios'}
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
  opcionesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  opcionBoton: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  opcionSeleccionada: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  opcionTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  opcionTextoSeleccionado: {
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