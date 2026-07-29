import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [productos, setProductos] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [desechos, setDesechos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuestas = await Promise.allSettled([
        api.get('/productos'),
        api.get('/ventas'),
        api.get('/pedidos'),
        api.get('/desechos'),
        api.get('/clientes'),
      ]);

      const obtenerDatos = (respuesta: any, propiedad: string) => {
        if (respuesta.status !== 'fulfilled') return [];

        const data = respuesta.value.data;

        if (Array.isArray(data)) return data;

        return data?.[propiedad] || [];
      };

      setProductos(obtenerDatos(respuestas[0], 'productos'));
      setVentas(obtenerDatos(respuestas[1], 'ventas'));
      setPedidos(obtenerDatos(respuestas[2], 'pedidos'));
      setDesechos(obtenerDatos(respuestas[3], 'desechos'));
      setClientes(obtenerDatos(respuestas[4], 'clientes'));
    } catch (error: any) {
      console.log('Error dashboard:', error?.response?.data || error);
      setMensaje('No se pudo cargar toda la información del dashboard.');
    } finally {
      setCargando(false);
    }
  };

  const formatoColones = (valor: any) => {
    const numero = Number(valor || 0);

    return `₡${numero.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const obtenerCantidadProducto = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? 0);
  };

  const obtenerStockMinimo = (producto: any) => {
    return Number(producto.stock_minimo || 5);
  };

  const obtenerPrecioVenta = (producto: any) => {
    return Number(producto.precio_venta || producto.precio || 0);
  };

  const obtenerPrecioCompra = (producto: any) => {
    return Number(producto.precio_compra || 0);
  };

  const obtenerTotalVenta = (venta: any) => {
    return Number(venta.total || venta.monto_total || venta.total_venta || 0);
  };

  const obtenerTotalPedido = (pedido: any) => {
    const totalPedido = Number(pedido.total || pedido.total_pedido || pedido.monto_total || 0);

    if (totalPedido > 0) return totalPedido;

    const detalles = pedido.detalles || pedido.detalle || pedido.productos || [];

    if (!Array.isArray(detalles)) return 0;

    return detalles.reduce((total: number, item: any) => {
      return total + Number(item.subtotal || 0);
    }, 0);
  };

  const obtenerEstadoPedido = (pedido: any) => {
    return String(pedido.estado || 'Pendiente');
  };

  const obtenerPerdidaDesecho = (desecho: any) => {
    const perdida = Number(desecho.perdida_total || desecho.total_perdida || 0);

    if (perdida > 0) return perdida;

    return Number(desecho.cantidad || 0) * Number(desecho.precio_compra || 0);
  };

  const productosActivos = productos.filter(
    (producto) => String(producto.estado || 'Activo').toLowerCase() !== 'inactivo'
  );

  const productosSinStock = productosActivos.filter(
    (producto) => obtenerCantidadProducto(producto) <= 0
  );

  const productosStockBajo = productosActivos.filter((producto) => {
    const cantidad = obtenerCantidadProducto(producto);
    const minimo = obtenerStockMinimo(producto);

    return cantidad > 0 && cantidad <= minimo;
  });

  const productosBuenEstado = productosActivos.filter((producto) => {
    const cantidad = obtenerCantidadProducto(producto);
    const minimo = obtenerStockMinimo(producto);

    return cantidad > minimo;
  });

  const valorInventarioVenta = productosActivos.reduce((total, producto) => {
    return total + obtenerCantidadProducto(producto) * obtenerPrecioVenta(producto);
  }, 0);

  const valorInventarioCompra = productosActivos.reduce((total, producto) => {
    return total + obtenerCantidadProducto(producto) * obtenerPrecioCompra(producto);
  }, 0);

  const totalVentas = ventas.reduce((total, venta) => {
    return total + obtenerTotalVenta(venta);
  }, 0);

  const totalPedidos = pedidos.reduce((total, pedido) => {
    return total + obtenerTotalPedido(pedido);
  }, 0);

  const pedidosPendientes = pedidos.filter(
    (pedido) => obtenerEstadoPedido(pedido).toLowerCase() === 'pendiente'
  );

  const pedidosAceptados = pedidos.filter(
    (pedido) => obtenerEstadoPedido(pedido).toLowerCase() === 'aceptado'
  );

  const pedidosEntregados = pedidos.filter(
    (pedido) => obtenerEstadoPedido(pedido).toLowerCase() === 'entregado'
  );

  const totalPerdidas = desechos.reduce((total, desecho) => {
    return total + obtenerPerdidaDesecho(desecho);
  }, 0);

  const totalAlertas =
    productosStockBajo.length +
    productosSinStock.length +
    pedidosPendientes.length;

  const porcentajeBuenEstado =
    productosActivos.length > 0
      ? Math.round((productosBuenEstado.length / productosActivos.length) * 100)
      : 0;

  const porcentajeStockBajo =
    productosActivos.length > 0
      ? Math.round((productosStockBajo.length / productosActivos.length) * 100)
      : 0;

  const porcentajeSinStock =
    productosActivos.length > 0
      ? Math.round((productosSinStock.length / productosActivos.length) * 100)
      : 0;

  const barra = (porcentaje: number) => {
    const ancho = Math.max(4, Math.min(100, porcentaje));

    return (
      <View style={styles.barraFondo}>
        <View style={[styles.barraRelleno, { width: `${ancho}%` }]} />
      </View>
    );
  };

  return (
    <AdminLayout
      titulo="Dashboard"
      subtitulo="Resumen gerencial de inventario, pedidos, ventas y pérdidas"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Dashboard general 📊</Text>
          <Text style={styles.subtitulo}>
            Indicadores principales para tomar decisiones rápidas del negocio.
          </Text>
        </View>

        <Pressable style={styles.botonActualizar} onPress={cargarDashboard}>
          <Text style={styles.textoActualizar}>
            {cargando ? 'Actualizando...' : 'Actualizar dashboard'}
          </Text>
        </Pressable>
      </View>

      {mensaje !== '' && (
        <View style={styles.mensajeError}>
          <Text style={styles.mensajeTexto}>{mensaje}</Text>
        </View>
      )}

      <View style={[styles.tarjetas, esTelefono && styles.tarjetasTelefono]}>
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIcono}>📦</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Productos activos</Text>
            <Text style={styles.tarjetaNumero}>{productosActivos.length}</Text>
            <Text style={styles.tarjetaDetalle}>En inventario</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>₡</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Ventas registradas</Text>
            <Text style={styles.tarjetaNumero}>{formatoColones(totalVentas)}</Text>
            <Text style={styles.tarjetaDetalle}>{ventas.length} ventas</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⏳</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Pedidos pendientes</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{pedidosPendientes.length}</Text>
            <Text style={styles.tarjetaDetalle}>Por revisar</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>!</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Alertas activas</Text>
            <Text style={styles.tarjetaNumeroRojo}>{totalAlertas}</Text>
            <Text style={styles.tarjetaDetalle}>Requieren atención</Text>
          </View>
        </View>
      </View>

      <View style={[styles.contenidoGrid, esTelefono && styles.contenidoGridTelefono]}>
        <View style={styles.cardGrande}>
          <Text style={styles.cardTitulo}>Estado del inventario</Text>
          <Text style={styles.cardSubtitulo}>
            Distribución de productos según disponibilidad.
          </Text>

          <View style={styles.indicadorFila}>
            <View style={styles.indicadorTextoArea}>
              <Text style={styles.indicadorTitulo}>En buen estado</Text>
              <Text style={styles.indicadorDetalle}>
                {productosBuenEstado.length} productos
              </Text>
            </View>

            <Text style={styles.indicadorPorcentaje}>{porcentajeBuenEstado}%</Text>
          </View>
          {barra(porcentajeBuenEstado)}

          <View style={styles.indicadorFila}>
            <View style={styles.indicadorTextoArea}>
              <Text style={styles.indicadorTitulo}>Stock bajo</Text>
              <Text style={styles.indicadorDetalle}>
                {productosStockBajo.length} productos
              </Text>
            </View>

            <Text style={styles.indicadorPorcentajeNaranja}>{porcentajeStockBajo}%</Text>
          </View>
          {barra(porcentajeStockBajo)}

          <View style={styles.indicadorFila}>
            <View style={styles.indicadorTextoArea}>
              <Text style={styles.indicadorTitulo}>Sin stock</Text>
              <Text style={styles.indicadorDetalle}>
                {productosSinStock.length} productos
              </Text>
            </View>

            <Text style={styles.indicadorPorcentajeRojo}>{porcentajeSinStock}%</Text>
          </View>
          {barra(porcentajeSinStock)}
        </View>

        <View style={styles.cardGrande}>
          <Text style={styles.cardTitulo}>Resumen financiero</Text>
          <Text style={styles.cardSubtitulo}>
            Montos estimados según registros actuales.
          </Text>

          <View style={styles.montoFila}>
            <Text style={styles.montoLabel}>Valor inventario venta</Text>
            <Text style={styles.montoValor}>{formatoColones(valorInventarioVenta)}</Text>
          </View>

          <View style={styles.montoFila}>
            <Text style={styles.montoLabel}>Valor inventario compra</Text>
            <Text style={styles.montoValor}>{formatoColones(valorInventarioCompra)}</Text>
          </View>

          <View style={styles.montoFila}>
            <Text style={styles.montoLabel}>Total pedidos</Text>
            <Text style={styles.montoValor}>{formatoColones(totalPedidos)}</Text>
          </View>

          <View style={styles.montoFilaRoja}>
            <Text style={styles.montoLabelRojo}>Pérdidas por desechos</Text>
            <Text style={styles.montoValorRojo}>{formatoColones(totalPerdidas)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.contenidoGrid, esTelefono && styles.contenidoGridTelefono]}>
        <View style={styles.cardGrande}>
          <Text style={styles.cardTitulo}>Pedidos</Text>
          <Text style={styles.cardSubtitulo}>
            Estado actual de los pedidos de clientes.
          </Text>

          <View style={styles.estadoPedidoGrid}>
            <View style={styles.estadoPedidoCard}>
              <Text style={styles.estadoPedidoNumeroNaranja}>{pedidosPendientes.length}</Text>
              <Text style={styles.estadoPedidoTexto}>Pendientes</Text>
            </View>

            <View style={styles.estadoPedidoCard}>
              <Text style={styles.estadoPedidoNumeroVerde}>{pedidosAceptados.length}</Text>
              <Text style={styles.estadoPedidoTexto}>Aceptados</Text>
            </View>

            <View style={styles.estadoPedidoCard}>
              <Text style={styles.estadoPedidoNumeroAzul}>{pedidosEntregados.length}</Text>
              <Text style={styles.estadoPedidoTexto}>Entregados</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardGrande}>
          <Text style={styles.cardTitulo}>Clientes y operación</Text>
          <Text style={styles.cardSubtitulo}>
            Resumen de registros operativos del sistema.
          </Text>

          <View style={styles.operacionFila}>
            <Text style={styles.operacionIcono}>👥</Text>
            <View>
              <Text style={styles.operacionTitulo}>{clientes.length}</Text>
              <Text style={styles.operacionTexto}>Clientes registrados</Text>
            </View>
          </View>

          <View style={styles.operacionFila}>
            <Text style={styles.operacionIcono}>🧾</Text>
            <View>
              <Text style={styles.operacionTitulo}>{ventas.length}</Text>
              <Text style={styles.operacionTexto}>Ventas en historial</Text>
            </View>
          </View>

          <View style={styles.operacionFila}>
            <Text style={styles.operacionIcono}>🗑️</Text>
            <View>
              <Text style={styles.operacionTitulo}>{desechos.length}</Text>
              <Text style={styles.operacionTexto}>Desechos registrados</Text>
            </View>
          </View>
        </View>
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    color: '#063f22',
    fontSize: 40,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#666',
    fontSize: 16,
    marginTop: 6,
  },
  heroTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  tarjetasTelefono: {
    flexDirection: 'column',
  },
  contenidoGridTelefono: {
    flexDirection: 'column',
  },
  botonActualizar: {
    backgroundColor: '#7bb51e',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  textoActualizar: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mensajeError: {
    backgroundColor: '#ffebee',
    borderColor: '#c62828',
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  mensajeTexto: {
    color: '#c62828',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tarjetas: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tarjeta: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  tarjetaIcono: {
    fontSize: 36,
  },
  tarjetaIconoVerde: {
    color: '#2e7d32',
    borderWidth: 3,
    borderColor: '#2e7d32',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 25,
    fontWeight: 'bold',
  },
  tarjetaIconoNaranja: {
    color: '#f58220',
    borderWidth: 3,
    borderColor: '#f58220',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 22,
    fontWeight: 'bold',
  },
  tarjetaIconoRojo: {
    color: '#c62828',
    borderWidth: 3,
    borderColor: '#c62828',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  tarjetaNumero: {
    color: '#0f4f24',
    fontSize: 25,
    fontWeight: 'bold',
  },
  tarjetaNumeroNaranja: {
    color: '#f58220',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaNumeroRojo: {
    color: '#c62828',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaDetalle: {
    color: '#777',
    fontSize: 12,
  },
  contenidoGrid: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
  },
  cardGrande: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 22,
  },
  cardTitulo: {
    color: '#0f4f24',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardSubtitulo: {
    color: '#666',
    marginTop: 5,
    marginBottom: 18,
  },
  indicadorFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  indicadorTextoArea: {
    flex: 1,
  },
  indicadorTitulo: {
    color: '#333',
    fontWeight: 'bold',
  },
  indicadorDetalle: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
  indicadorPorcentaje: {
    color: '#2e7d32',
    fontSize: 20,
    fontWeight: 'bold',
  },
  indicadorPorcentajeNaranja: {
    color: '#f58220',
    fontSize: 20,
    fontWeight: 'bold',
  },
  indicadorPorcentajeRojo: {
    color: '#c62828',
    fontSize: 20,
    fontWeight: 'bold',
  },
  barraFondo: {
    height: 12,
    backgroundColor: '#f7f2dc',
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: 12,
    backgroundColor: '#7bb51e',
    borderRadius: 10,
  },
  montoFila: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  montoFilaRoja: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  montoLabel: {
    color: '#555',
    fontWeight: 'bold',
  },
  montoValor: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  montoLabelRojo: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  montoValorRojo: {
    color: '#c62828',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  estadoPedidoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  estadoPedidoCard: {
    flex: 1,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  estadoPedidoNumeroNaranja: {
    color: '#f58220',
    fontSize: 34,
    fontWeight: 'bold',
  },
  estadoPedidoNumeroVerde: {
    color: '#2e7d32',
    fontSize: 34,
    fontWeight: 'bold',
  },
  estadoPedidoNumeroAzul: {
    color: '#1565c0',
    fontSize: 34,
    fontWeight: 'bold',
  },
  estadoPedidoTexto: {
    color: '#555',
    fontWeight: 'bold',
    marginTop: 4,
  },
  operacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  operacionIcono: {
    fontSize: 32,
  },
  operacionTitulo: {
    color: '#0f4f24',
    fontSize: 24,
    fontWeight: 'bold',
  },
  operacionTexto: {
    color: '#666',
    fontWeight: 'bold',
  },
});
