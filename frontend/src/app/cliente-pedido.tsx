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
import { obtenerDato } from '../services/storage.js';

export default function ClientePedidoScreen() {
  const router = useRouter();

  const [cliente, setCliente] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [observacion, setObservacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pedidoGenerado, setPedidoGenerado] = useState<any>(null);

  const cargarCliente = async () => {
    const clienteGuardado = await obtenerDato('cliente');

    if (clienteGuardado) {
      const clienteData = JSON.parse(clienteGuardado);
      setCliente(clienteData);
      setDireccionEntrega(clienteData.direccion || '');
    } else {
      Alert.alert('Sesión requerida', 'Debe iniciar sesión');
      router.replace('/' as any);
    }
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

  useEffect(() => {
    cargarCliente();
    cargarProductos();
  }, []);

  const convertirNumero = (valor: string) => {
    return Number(String(valor).replace(',', '.'));
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarProducto = (producto: any) => {
    const existe = carrito.find(
      (item) => item.id_producto === producto.id_producto
    );

    if (existe) {
      Alert.alert('Aviso', 'Este producto ya está agregado al pedido');
      return;
    }

    if (Number(producto.precio_venta) <= 0) {
      Alert.alert(
        'Producto no disponible',
        'Este producto todavía no tiene precio de venta'
      );
      return;
    }

    if (Number(producto.cantidad) <= 0) {
      Alert.alert(
        'Sin inventario',
        'Este producto no tiene cantidad disponible'
      );
      return;
    }

    setCarrito([
      ...carrito,
      {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio_venta: Number(producto.precio_venta),
        cantidad: '1',
        disponible: Number(producto.cantidad),
        unidad_medida: producto.unidad_medida || 'kg',
      },
    ]);

    setBusqueda('');
    setPedidoGenerado(null);
  };

  const cambiarCantidad = (idProducto: number, valor: string) => {
    setCarrito(
      carrito.map((item) =>
        item.id_producto === idProducto ? { ...item, cantidad: valor } : item
      )
    );
  };

  const eliminarProducto = (idProducto: number) => {
    setCarrito(carrito.filter((item) => item.id_producto !== idProducto));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => {
      const cantidad = convertirNumero(item.cantidad || '0');
      return total + cantidad * Number(item.precio_venta);
    }, 0);
  };

  const usarDireccionRegistrada = () => {
    if (cliente?.direccion) {
      setDireccionEntrega(cliente.direccion);
    } else {
      Alert.alert(
        'Sin dirección registrada',
        'El cliente no tiene dirección registrada. Puede escribir una dirección manualmente.'
      );
    }
  };

  const confirmarPedido = async () => {
    if (!cliente) {
      Alert.alert('Sesión requerida', 'Debe iniciar sesión');
      return;
    }

    if (!direccionEntrega) {
      Alert.alert(
        'Dirección requerida',
        'Debe ingresar una dirección de entrega'
      );
      return;
    }

    if (carrito.length === 0) {
      Alert.alert('Pedido vacío', 'Debe agregar al menos un producto');
      return;
    }

    for (const item of carrito) {
      const cantidad = convertirNumero(item.cantidad);

      if (!cantidad || cantidad <= 0) {
        Alert.alert('Cantidad inválida', `Revise la cantidad de ${item.nombre}`);
        return;
      }

      if (cantidad > Number(item.disponible)) {
        Alert.alert(
          'Inventario insuficiente',
          `No hay suficiente inventario de ${item.nombre}`
        );
        return;
      }
    }

    try {
      setCargando(true);

      const datosPedido = {
        id_cliente: cliente.id_cliente,
        metodo_pago: metodoPago || 'Efectivo',
        direccion_entrega: direccionEntrega,
        observacion: observacion || null,
        productos: carrito.map((item) => ({
          id_producto: item.id_producto,
          cantidad: convertirNumero(item.cantidad),
        })),
      };

      const respuesta = await api.post('/pedidos', datosPedido);

      setPedidoGenerado(respuesta.data);

      Alert.alert(
        'Pedido registrado',
        `Pedido #${respuesta.data.id_pedido}\nEstado: ${respuesta.data.estado}\nTotal: ₡${Number(
          respuesta.data.total
        ).toFixed(2)}`
      );

      setCarrito([]);
      setMetodoPago('Efectivo');
      setObservacion('');
      setBusqueda('');

      await cargarProductos();
    } catch (error: any) {
      console.log('Error al registrar pedido:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo registrar el pedido'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Realizar pedido</Text>

      <Text style={styles.subtitulo}>
        Cliente: {cliente?.nombre || 'Cliente'}
      </Text>

      {pedidoGenerado && (
        <View style={styles.pedidoBox}>
          <Text style={styles.pedidoTitulo}>Pedido registrado</Text>

          <Text style={styles.pedidoTexto}>
            Número de pedido: #{pedidoGenerado.id_pedido}
          </Text>

          <Text style={styles.pedidoTexto}>
            Estado: {pedidoGenerado.estado}
          </Text>

          <Text style={styles.pedidoTexto}>
            Dirección: {pedidoGenerado.direccion_entrega}
          </Text>

          <Text style={styles.pedidoTotal}>
            Total: ₡{Number(pedidoGenerado.total).toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Buscar productos</Text>

        <TextInput
          style={styles.input}
          placeholder="Buscar producto..."
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {busqueda.length > 0 &&
          productosFiltrados.slice(0, 8).map((producto) => {
            const unidad = producto.unidad_medida || 'kg';

            return (
              <Pressable
                key={producto.id_producto}
                style={styles.productoResultado}
                onPress={() => agregarProducto(producto)}
              >
                <View style={styles.productoInfo}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>

                  <Text style={styles.productoDetalle}>
                    ₡{Number(producto.precio_venta).toFixed(2)} por {unidad}
                  </Text>

                  <Text style={styles.productoDetalle}>
                    Disponible: {producto.cantidad} {unidad}
                  </Text>
                </View>

                <Text style={styles.agregarTexto}>Agregar</Text>
              </Pressable>
            );
          })}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Carrito del pedido</Text>

        {carrito.length === 0 ? (
          <Text style={styles.textoVacio}>No hay productos agregados.</Text>
        ) : (
          carrito.map((item) => {
            const cantidad = convertirNumero(item.cantidad || '0');
            const subtotal = cantidad * Number(item.precio_venta);

            return (
              <View key={item.id_producto} style={styles.itemCarrito}>
                <View style={styles.fila}>
                  <Text style={styles.itemNombre}>{item.nombre}</Text>

                  <Pressable onPress={() => eliminarProducto(item.id_producto)}>
                    <Text style={styles.eliminar}>Eliminar</Text>
                  </Pressable>
                </View>

                <Text style={styles.itemDetalle}>
                  Precio: ₡{item.precio_venta.toFixed(2)} por{' '}
                  {item.unidad_medida}
                </Text>

                <Text style={styles.itemDetalle}>
                  Disponible: {item.disponible} {item.unidad_medida}
                </Text>

                <Text style={styles.labelCantidad}>
                  Cantidad en {item.unidad_medida}
                </Text>

                <TextInput
                  style={styles.inputCantidad}
                  value={item.cantidad}
                  onChangeText={(valor) =>
                    cambiarCantidad(item.id_producto, valor)
                  }
                  keyboardType="numeric"
                  placeholder={`Ejemplo: 1 ${item.unidad_medida}`}
                />

                <Text style={styles.subtotal}>
                  Subtotal: ₡{subtotal.toFixed(2)}
                </Text>
              </View>
            );
          })
        )}

        <Text style={styles.label}>Dirección de entrega</Text>

        <TextInput
          style={styles.input}
          placeholder="Ejemplo: Alajuela, Turrúcares, frente a la iglesia"
          value={direccionEntrega}
          onChangeText={setDireccionEntrega}
        />

        <Pressable
          style={styles.botonDireccion}
          onPress={usarDireccionRegistrada}
        >
          <Text style={styles.textoDireccion}>Usar dirección registrada</Text>
        </Pressable>

        <Text style={styles.textoAyuda}>
          Puede cambiar esta dirección si desea recibir el pedido en otro lugar.
        </Text>

        <Text style={styles.label}>Método de pago</Text>

        <TextInput
          style={styles.input}
          placeholder="Efectivo, SINPE, tarjeta..."
          value={metodoPago}
          onChangeText={setMetodoPago}
        />

        <Text style={styles.label}>Observación del pedido</Text>

        <TextInput
          style={styles.input}
          placeholder="Ejemplo: entregar en la tarde, llamar antes..."
          value={observacion}
          onChangeText={setObservacion}
        />

        <View style={styles.totalBox}>
          <Text style={styles.totalTexto}>Total</Text>
          <Text style={styles.totalMonto}>₡{calcularTotal().toFixed(2)}</Text>
        </View>

        <Pressable
          style={[styles.botonConfirmar, cargando && styles.botonDesactivado]}
          onPress={confirmarPedido}
          disabled={cargando}
        >
          <Text style={styles.textoBoton}>
            {cargando ? 'Registrando...' : 'Confirmar pedido'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.botonVolver}
        onPress={() => router.push('/cliente-home' as any)}
      >
        <Text style={styles.textoVolver}>Volver</Text>
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
  pedidoBox: {
    backgroundColor: '#1b5e20',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  pedidoTitulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pedidoTexto: {
    color: '#e8f5e9',
    marginTop: 3,
  },
  pedidoTotal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
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
  agregarTexto: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
    marginVertical: 12,
  },
  itemCarrito: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe082',
    marginBottom: 10,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemNombre: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 17,
    flex: 1,
  },
  eliminar: {
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  itemDetalle: {
    color: '#555',
    marginTop: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  labelCantidad: {
    fontWeight: 'bold',
    color: '#444',
    marginTop: 10,
  },
  inputCantidad: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffe082',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  subtotal: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  botonDireccion: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  textoDireccion: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  textoAyuda: {
    color: '#666',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  totalBox: {
    marginTop: 12,
    backgroundColor: '#1b5e20',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalMonto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botonConfirmar: {
    backgroundColor: '#2e7d32',
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