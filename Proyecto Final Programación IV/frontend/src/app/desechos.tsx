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

export default function DesechosScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [desechos, setDesechos] = useState<any[]>([]);
  const [totalPerdida, setTotalPerdida] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('Vencido');
  const [observacion, setObservacion] = useState('');
  const [cargando, setCargando] = useState(false);

  const convertirNumero = (valor: string) => {
    return Number(String(valor).replace(',', '.'));
  };

  const cargarProductos = async () => {
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (error) {
      console.log('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  const cargarDesechos = async () => {
    try {
      const respuesta = await api.get('/desechos');
      setDesechos(respuesta.data.registros || []);
      setTotalPerdida(Number(respuesta.data.total_perdida || 0));
    } catch (error) {
      console.log('Error al cargar desechos:', error);
      Alert.alert('Error', 'No se pudieron cargar los desechos');
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarDesechos();
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarProducto = (producto: any) => {
    setProductoSeleccionado(producto);
    setBusqueda(producto.nombre);
  };

  const calcularPerdidaEstimada = () => {
    if (!productoSeleccionado || !cantidad) return 0;

    const cantidadDesechada = convertirNumero(cantidad);
    const precioCompra = Number(productoSeleccionado.precio_compra || 0);

    return precioCompra * cantidadDesechada;
  };

  const registrarDesecho = async () => {
    if (!productoSeleccionado) {
      Alert.alert('Producto requerido', 'Debe seleccionar un producto');
      return;
    }

    const cantidadDesechada = convertirNumero(cantidad);

    if (!cantidadDesechada || cantidadDesechada <= 0) {
      Alert.alert('Cantidad inválida', 'Debe ingresar una cantidad mayor a cero');
      return;
    }

    if (cantidadDesechada > Number(productoSeleccionado.cantidad)) {
      Alert.alert(
        'Inventario insuficiente',
        'No puede desechar más cantidad de la disponible'
      );
      return;
    }

    if (!motivo) {
      Alert.alert('Motivo requerido', 'Debe indicar el motivo del desecho');
      return;
    }

    try {
      setCargando(true);

      await api.post('/desechos', {
        id_producto: productoSeleccionado.id_producto,
        cantidad: cantidadDesechada,
        motivo,
        observacion,
      });

      Alert.alert('Correcto', 'Desecho registrado correctamente');

      setProductoSeleccionado(null);
      setBusqueda('');
      setCantidad('');
      setMotivo('Vencido');
      setObservacion('');

      await cargarProductos();
      await cargarDesechos();
    } catch (error: any) {
      console.log('Error al registrar desecho:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo registrar el desecho'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Productos desechados</Text>
      <Text style={styles.subtitulo}>Control de pérdidas de inventario</Text>

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>Pérdida total registrada</Text>
        <Text style={styles.resumenMonto}>₡{totalPerdida.toFixed(2)}</Text>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Registrar desecho</Text>

        <Text style={styles.label}>Buscar producto</Text>
        <TextInput
          style={styles.input}
          value={busqueda}
          onChangeText={(texto) => {
            setBusqueda(texto);
            setProductoSeleccionado(null);
          }}
          placeholder="Buscar producto..."
        />

        {busqueda.length > 0 &&
          !productoSeleccionado &&
          productosFiltrados.slice(0, 8).map((producto) => {
            const unidad = producto.unidad_medida || 'kg';

            return (
              <Pressable
                key={producto.id_producto}
                style={styles.productoResultado}
                onPress={() => seleccionarProducto(producto)}
              >
                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>
                  <Text style={styles.productoDetalle}>
                    Disponible: {producto.cantidad} {unidad}
                  </Text>
                  <Text style={styles.productoDetalle}>
                    Costo: ₡{Number(producto.precio_compra).toFixed(2)} por {unidad}
                  </Text>
                </View>

                <Text style={styles.seleccionarTexto}>Seleccionar</Text>
              </Pressable>
            );
          })}

        {productoSeleccionado && (
          <View style={styles.productoSeleccionado}>
            <Text style={styles.productoSeleccionadoTitulo}>
              Producto seleccionado
            </Text>

            <Text style={styles.productoSeleccionadoNombre}>
              {productoSeleccionado.nombre}
            </Text>

            <Text style={styles.detalle}>
              Disponible: {productoSeleccionado.cantidad}{' '}
              {productoSeleccionado.unidad_medida || 'kg'}
            </Text>

            <Text style={styles.detalle}>
              Precio compra: ₡
              {Number(productoSeleccionado.precio_compra).toFixed(2)} por{' '}
              {productoSeleccionado.unidad_medida || 'kg'}
            </Text>
          </View>
        )}

        <Text style={styles.label}>
          Cantidad a desechar{' '}
          {productoSeleccionado
            ? `en ${productoSeleccionado.unidad_medida || 'kg'}`
            : ''}
        </Text>

        <TextInput
          style={styles.input}
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          placeholder="Ejemplo: 1, 0.5, 2.25"
        />

        <Text style={styles.label}>Motivo</Text>
        <TextInput
          style={styles.input}
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Vencido, dañado, mal estado..."
        />

        <Text style={styles.label}>Observación</Text>
        <TextInput
          style={styles.input}
          value={observacion}
          onChangeText={setObservacion}
          placeholder="Observación opcional"
        />

        <View style={styles.perdidaEstimada}>
          <Text style={styles.perdidaTexto}>Pérdida estimada</Text>

          <Text style={styles.perdidaMonto}>
            ₡{calcularPerdidaEstimada().toFixed(2)}
          </Text>

          {productoSeleccionado && (
            <Text style={styles.perdidaDetalle}>
              Cálculo: {cantidad || '0'} {productoSeleccionado.unidad_medida || 'kg'} × ₡
              {Number(productoSeleccionado.precio_compra).toFixed(2)}
            </Text>
          )}
        </View>

        <Pressable
          style={[styles.botonRegistrar, cargando && styles.botonDesactivado]}
          onPress={registrarDesecho}
          disabled={cargando}
        >
          <Text style={styles.textoBoton}>
            {cargando ? 'Registrando...' : 'Registrar desecho'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Historial de desechos</Text>

        {desechos.length === 0 ? (
          <Text style={styles.textoVacio}>No hay desechos registrados.</Text>
        ) : (
          desechos.map((item) => {
            const unidad = item.unidad_medida || 'kg';

            return (
              <View key={item.id_desecho} style={styles.cardDesecho}>
                <Text style={styles.nombreDesecho}>{item.producto}</Text>

                <Text style={styles.detalle}>
                  Cantidad desechada: {item.cantidad} {unidad}
                </Text>

                <Text style={styles.detalle}>
                  Precio compra: ₡{Number(item.precio_compra).toFixed(2)} por {unidad}
                </Text>

                <Text style={styles.detalle}>Motivo: {item.motivo}</Text>

                <Text style={styles.perdidaHistorial}>
                  Pérdida: ₡{Number(item.perdida_total).toFixed(2)}
                </Text>

                {item.observacion ? (
                  <Text style={styles.detalle}>Observación: {item.observacion}</Text>
                ) : null}
              </View>
            );
          })
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
    backgroundColor: '#b71c1c',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
  },
  resumenTexto: {
    color: '#ffebee',
    fontSize: 15,
  },
  resumenMonto: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 5,
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
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fff9',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productoResultado: {
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontWeight: 'bold',
    color: '#1b5e20',
    fontSize: 16,
  },
  productoDetalle: {
    color: '#555',
    marginTop: 3,
  },
  seleccionarTexto: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  productoSeleccionado: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  productoSeleccionadoTitulo: {
    color: '#555',
    fontWeight: 'bold',
  },
  productoSeleccionadoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginTop: 4,
  },
  detalle: {
    color: '#555',
    marginTop: 4,
  },
  perdidaEstimada: {
    backgroundColor: '#ffebee',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  perdidaTexto: {
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  perdidaMonto: {
    color: '#b71c1c',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  perdidaDetalle: {
    color: '#b71c1c',
    marginTop: 5,
  },
  botonRegistrar: {
    backgroundColor: '#b71c1c',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  botonDesactivado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
    marginVertical: 12,
  },
  cardDesecho: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe082',
    marginBottom: 10,
  },
  nombreDesecho: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  perdidaHistorial: {
    color: '#b71c1c',
    fontWeight: 'bold',
    marginTop: 6,
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