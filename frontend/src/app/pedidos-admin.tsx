import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function PedidosAdminScreen() {
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [pedidoAbierto, setPedidoAbierto] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  useEffect(() => {
    cargarPedidos();
    // La actualización posterior se realiza mediante la acción de la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarMensaje = (
    texto: string,
    tipo: 'ok' | 'error' | 'info' = 'info',
    alerta = false
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);

    if (alerta) {
      Alert.alert(tipo === 'error' ? 'Error' : 'Aviso', texto);
    }

    setTimeout(() => {
      setMensaje('');
    }, 4500);
  };

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuesta = await api.get('/pedidos');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.pedidos || [];

      setPedidos(datos);
    } catch (error: any) {
      console.log('Error al cargar pedidos:', error?.response?.data || error);
      setPedidos([]);
      mostrarMensaje('No se pudieron cargar los pedidos.', 'error');
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

  const formatoFecha = (fecha: any) => {
    if (!fecha) return 'Sin fecha';

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return String(fecha);
    }

    return fechaObj.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatoHora = (fecha: any) => {
    if (!fecha) return '';

    const fechaObj = new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
      return '';
    }

    return fechaObj.toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerIdPedido = (pedido: any) => {
    return Number(pedido.id_pedido || pedido.id || pedido.idPedido || 0);
  };

  const obtenerCliente = (pedido: any) => {
    return (
      pedido.cliente ||
      pedido.nombre_cliente ||
      pedido.nombre ||
      pedido.nombre_completo ||
      'Cliente no especificado'
    );
  };

  const obtenerCorreo = (pedido: any) => {
    return pedido.correo || pedido.email || pedido.correo_cliente || '';
  };

  const obtenerTelefono = (pedido: any) => {
    return pedido.telefono || pedido.telefono_cliente || '';
  };

  const obtenerTipoEntrega = (pedido: any) => {
    return pedido.tipo_entrega || pedido.tipoEntrega || 'Entrega';
  };

  const obtenerDireccion = (pedido: any) => {
    const tipoEntrega = obtenerTipoEntrega(pedido);

    if (tipoEntrega === 'Retiro en tienda') {
      return 'Retiro en tienda';
    }

    return pedido.direccion_entrega || pedido.direccion || 'Sin dirección registrada';
  };

  const obtenerMetodoPago = (pedido: any) => {
    return pedido.metodo_pago || pedido.metodo || 'Efectivo';
  };

  const obtenerEstado = (pedido: any) => {
    return pedido.estado || 'Pendiente';
  };

  const obtenerFecha = (pedido: any) => {
    return pedido.fecha_pedido || pedido.fecha || pedido.created_at || pedido.fecha_creacion;
  };

  const obtenerTotal = (pedido: any) => {
    const totalPedido = Number(pedido.total || pedido.total_pedido || pedido.monto_total || 0);

    if (totalPedido > 0) {
      return totalPedido;
    }

    return obtenerDetalles(pedido).reduce((total, item) => {
      return total + Number(item.subtotal || 0);
    }, 0);
  };

  const obtenerDetalles = (pedido: any) => {
    const detalle =
      pedido.detalles ||
      pedido.detalle ||
      pedido.productos ||
      pedido.items ||
      [];

    return Array.isArray(detalle) ? detalle : [];
  };

  const obtenerNombreProducto = (item: any) => {
    return item.nombre || item.producto || item.nombre_producto || 'Producto';
  };

  const obtenerCantidadDetalle = (item: any) => {
    return Number(item.cantidad || 0);
  };

  const obtenerPrecioDetalle = (item: any) => {
    return Number(item.precio_unitario || item.precio || item.precio_venta || 0);
  };

  const obtenerSubtotalDetalle = (item: any) => {
    const subtotal = Number(item.subtotal || 0);

    if (subtotal > 0) {
      return subtotal;
    }

    return obtenerCantidadDetalle(item) * obtenerPrecioDetalle(item);
  };

  const inventarioDescontado = (pedido: any) => {
    return Number(pedido.inventario_descontado || 0) === 1;
  };

  const obtenerEstiloEstado = (estado: string) => {
    const estadoNormalizado = estado.toLowerCase();

    if (estadoNormalizado === 'aceptado') {
      return {
        badge: styles.estadoAceptado,
        punto: styles.puntoVerde,
      };
    }

    if (estadoNormalizado === 'en preparación') {
      return {
        badge: styles.estadoPreparacion,
        punto: styles.puntoMorado,
      };
    }

    if (estadoNormalizado === 'en entrega') {
      return {
        badge: styles.estadoEntrega,
        punto: styles.puntoAzul,
      };
    }

    if (estadoNormalizado === 'entregado') {
      return {
        badge: styles.estadoEntregado,
        punto: styles.puntoAzul,
      };
    }

    if (estadoNormalizado === 'rechazado' || estadoNormalizado === 'cancelado') {
      return {
        badge: styles.estadoRechazado,
        punto: styles.puntoRojo,
      };
    }

    return {
      badge: styles.estadoPendiente,
      punto: styles.puntoNaranja,
    };
  };

  const puedeAceptar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();
    const detalles = obtenerDetalles(pedido);

    return estado === 'pendiente' && detalles.length > 0;
  };

  const puedePreparar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();
    return estado === 'aceptado';
  };

  const puedeEnviar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();
    const tipoEntrega = obtenerTipoEntrega(pedido);

    return estado === 'en preparación' && tipoEntrega === 'Entrega';
  };

  const puedeEntregar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();

    return (
      estado === 'aceptado' ||
      estado === 'en preparación' ||
      estado === 'en entrega'
    );
  };

  const puedeRechazar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();

    return (
      estado === 'pendiente' ||
      estado === 'aceptado' ||
      estado === 'en preparación'
    );
  };

  const puedeCancelar = (pedido: any) => {
    const estado = obtenerEstado(pedido).toLowerCase();

    return (
      estado === 'pendiente' ||
      estado === 'aceptado' ||
      estado === 'en preparación' ||
      estado === 'en entrega'
    );
  };

  const confirmarAccion = (mensajeConfirmacion: string) => {
    if (typeof window !== 'undefined') {
      return window.confirm(mensajeConfirmacion);
    }

    return true;
  };

  const cambiarEstado = async (pedido: any, nuevoEstado: string) => {
    const idPedido = obtenerIdPedido(pedido);

    if (!idPedido) {
      mostrarMensaje('No se pudo cambiar el estado porque el pedido no tiene ID.', 'error', true);
      return;
    }

    const detalles = obtenerDetalles(pedido);

    if (
      ['Aceptado', 'En preparación', 'En entrega', 'Entregado'].includes(nuevoEstado) &&
      detalles.length === 0
    ) {
      mostrarMensaje(
        'Este pedido no tiene productos registrados. No se puede cambiar el estado.',
        'error',
        true
      );
      return;
    }

    const textoAccion =
      nuevoEstado === 'Aceptado'
        ? 'aceptar'
        : nuevoEstado === 'En preparación'
          ? 'marcar como en preparación'
          : nuevoEstado === 'En entrega'
            ? 'marcar como en entrega'
            : nuevoEstado === 'Entregado'
              ? 'marcar como entregado'
              : nuevoEstado === 'Rechazado'
                ? 'rechazar'
                : 'cancelar';

    const confirmado = confirmarAccion(
      `¿Desea ${textoAccion} el pedido #${idPedido}?`
    );

    if (!confirmado) {
      return;
    }

    await enviarCambioEstado(idPedido, nuevoEstado);
  };

  const enviarCambioEstado = async (idPedido: number, nuevoEstado: string) => {
    try {
      setActualizando(true);
      mostrarMensaje('Actualizando pedido...', 'info');

      try {
        await api.patch(`/pedidos/${idPedido}/estado`, {
          estado: nuevoEstado,
        });
      } catch {
        const accion =
          nuevoEstado === 'Aceptado'
            ? 'aceptar'
            : nuevoEstado === 'En preparación'
              ? 'preparar'
              : nuevoEstado === 'En entrega'
                ? 'enviar'
                : nuevoEstado === 'Entregado'
                  ? 'entregar'
                  : nuevoEstado === 'Rechazado'
                    ? 'rechazar'
                    : 'cancelar';

        try {
          await api.patch(`/pedidos/${idPedido}/${accion}`);
        } catch {
          await api.put(`/pedidos/${idPedido}/${accion}`);
        }
      }

      mostrarMensaje(`Pedido actualizado a ${nuevoEstado}.`, 'ok', true);
      await cargarPedidos();
    } catch (error: any) {
      console.log('Error al cambiar estado:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          'No se pudo actualizar el estado del pedido.',
        'error',
        true
      );
    } finally {
      setActualizando(false);
    }
  };

  const estados = [
    'Todos',
    'Pendiente',
    'Aceptado',
    'En preparación',
    'En entrega',
    'Entregado',
    'Rechazado',
    'Cancelado',
  ];

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const texto = busqueda.toLowerCase();
    const idPedido = obtenerIdPedido(pedido);
    const estadoPedido = obtenerEstado(pedido);

    const coincideBusqueda =
      String(idPedido).includes(texto) ||
      obtenerCliente(pedido).toLowerCase().includes(texto) ||
      obtenerDireccion(pedido).toLowerCase().includes(texto) ||
      obtenerTipoEntrega(pedido).toLowerCase().includes(texto) ||
      obtenerMetodoPago(pedido).toLowerCase().includes(texto) ||
      obtenerTelefono(pedido).toLowerCase().includes(texto) ||
      obtenerCorreo(pedido).toLowerCase().includes(texto) ||
      estadoPedido.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === 'Todos' ||
      estadoPedido.toLowerCase() === filtroEstado.toLowerCase();

    return coincideBusqueda && coincideEstado;
  });

  const totalPedidos = pedidos.length;

  const totalPendientes = pedidos.filter(
    (pedido) => obtenerEstado(pedido).toLowerCase() === 'pendiente'
  ).length;

  const totalAceptados = pedidos.filter(
    (pedido) => obtenerEstado(pedido).toLowerCase() === 'aceptado'
  ).length;

  const totalEntregados = pedidos.filter(
    (pedido) => obtenerEstado(pedido).toLowerCase() === 'entregado'
  ).length;

  const totalMontoPedidos = pedidos.reduce((total, pedido) => {
    return total + obtenerTotal(pedido);
  }, 0);

  return (
    <AdminLayout
      titulo="Pedidos"
      subtitulo="Control de pedidos de clientes, estados y detalle de productos"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Pedidos de clientes 📋</Text>
          <Text style={styles.subtitulo}>
            Revise, acepte, prepare, envíe o entregue pedidos registrados por clientes.
          </Text>
        </View>

        <Pressable style={styles.botonActualizar} onPress={cargarPedidos}>
          <Text style={styles.textoActualizar}>
            {cargando ? 'Actualizando...' : 'Actualizar pedidos'}
          </Text>
        </Pressable>
      </View>

      {mensaje !== '' && (
        <View
          style={[
            styles.mensajeCaja,
            tipoMensaje === 'ok' && styles.mensajeOk,
            tipoMensaje === 'error' && styles.mensajeError,
            tipoMensaje === 'info' && styles.mensajeInfo,
          ]}
        >
          <Text style={styles.mensajeTexto}>{mensaje}</Text>
        </View>
      )}

      <View style={[styles.tarjetas, esTelefono && styles.tarjetasTelefono]}>
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIcono}>📋</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Pedidos totales</Text>
            <Text style={styles.tarjetaNumero}>{totalPedidos}</Text>
            <Text style={styles.tarjetaDetalle}>Registrados</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⏳</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Pendientes</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{totalPendientes}</Text>
            <Text style={styles.tarjetaDetalle}>Por revisar</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>✓</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Aceptados</Text>
            <Text style={styles.tarjetaNumero}>{totalAceptados}</Text>
            <Text style={styles.tarjetaDetalle}>Inventario descontado</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoAzul}>₡</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Monto total</Text>
            <Text style={styles.tarjetaNumeroAzul}>
              {formatoColones(totalMontoPedidos)}
            </Text>
            <Text style={styles.tarjetaDetalle}>{totalEntregados} entregados</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.filtros}>
          <TextInput
            style={styles.input}
            placeholder="Buscar por número, cliente, teléfono, dirección, entrega, método o estado..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
            <View style={[styles.filtrosFila, esTelefono && styles.filtrosTelefono]}>
              {estados.map((estado) => (
                <Pressable
                  key={estado}
                  style={[
                    styles.filtroBoton,
                    filtroEstado === estado && styles.filtroBotonActivo,
                  ]}
                  onPress={() => setFiltroEstado(estado)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      filtroEstado === estado && styles.filtroTextoActivo,
                    ]}
                  >
                    {estado}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colPedido]}>Pedido</Text>
          <Text style={[styles.th, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
          <Text style={[styles.th, styles.colPago]}>Pago</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
          <Text style={[styles.th, styles.colAccion]}>Detalle</Text>
        </View>

        {cargando ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Cargando pedidos...</Text>
          </View>
        ) : pedidosFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>📋</Text>
            <Text style={styles.vacioTitulo}>No hay pedidos para mostrar</Text>
            <Text style={styles.vacioTexto}>
              Cuando un cliente registre un pedido aparecerá en esta sección.
            </Text>
          </View>
        ) : (
          pedidosFiltrados.map((pedido, index) => {
            const idPedido = obtenerIdPedido(pedido) || index;
            const estado = obtenerEstado(pedido);
            const estiloEstado = obtenerEstiloEstado(estado);
            const abierto = pedidoAbierto === idPedido;
            const detalles = obtenerDetalles(pedido);
            const sinDetalle = detalles.length === 0;
            const tipoEntrega = obtenerTipoEntrega(pedido);

            return (
              <View key={idPedido} style={styles.pedidoBloque}>
                <View style={styles.tablaRow}>
                  <Text style={[styles.tdPedido, styles.colPedido]}>
                    #{idPedido}
                  </Text>

                  <View style={styles.colCliente}>
                    <Text style={styles.clienteNombre} numberOfLines={1}>
                      {obtenerCliente(pedido)}
                    </Text>

                    <Text style={styles.clienteDetalle} numberOfLines={1}>
                      Tel: {obtenerTelefono(pedido) || 'Sin teléfono'}
                    </Text>

                    <Text style={styles.clienteDetalle} numberOfLines={1}>
                      {obtenerCorreo(pedido) || 'Sin correo'}
                    </Text>
                  </View>

                  <View style={styles.colFecha}>
                    <Text style={styles.tdCentro}>{formatoFecha(obtenerFecha(pedido))}</Text>
                    <Text style={styles.horaTexto}>{formatoHora(obtenerFecha(pedido))}</Text>
                  </View>

                  <Text style={[styles.tdCentro, styles.colPago]}>
                    {obtenerMetodoPago(pedido)}
                  </Text>

                  <Text style={[styles.tdTotal, styles.colTotal]}>
                    {formatoColones(obtenerTotal(pedido))}
                  </Text>

                  <View style={styles.colEstado}>
                    <View style={[styles.estadoBadge, estiloEstado.badge]}>
                      <View style={[styles.puntoEstado, estiloEstado.punto]} />
                      <Text style={styles.estadoTexto}>{estado}</Text>
                    </View>
                  </View>

                  <View style={styles.colAccion}>
                    <Pressable
                      style={styles.botonDetalle}
                      onPress={() => setPedidoAbierto(abierto ? null : idPedido)}
                    >
                      <Text style={styles.textoDetalle}>
                        {abierto ? 'Ocultar' : 'Ver'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {abierto && (
                  <View style={styles.detalleCaja}>
                    <View style={styles.detalleHeader}>
                      <View style={styles.detalleHeaderTexto}>
                        <Text style={styles.detalleTitulo}>
                          Detalle del pedido #{idPedido}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Cliente: {obtenerCliente(pedido)}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Teléfono: {obtenerTelefono(pedido) || 'Sin teléfono'}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Correo: {obtenerCorreo(pedido) || 'Sin correo'}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Tipo de entrega: {tipoEntrega}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Dirección: {obtenerDireccion(pedido)}
                        </Text>

                        <Text style={styles.detalleSubtitulo}>
                          Inventario descontado: {inventarioDescontado(pedido) ? 'Sí' : 'No'}
                        </Text>

                        {pedido.observacion ? (
                          <Text style={styles.detalleSubtitulo}>
                            Observación: {pedido.observacion}
                          </Text>
                        ) : (
                          <Text style={styles.detalleSubtitulo}>
                            Observación: Sin observación
                          </Text>
                        )}
                      </View>

                      <View style={styles.detalleTotalCaja}>
                        <Text style={styles.detalleTotalLabel}>Total</Text>
                        <Text style={styles.detalleTotal}>
                          {formatoColones(obtenerTotal(pedido))}
                        </Text>
                      </View>
                    </View>

                    {sinDetalle ? (
                      <View style={styles.sinDetalleCaja}>
                        <Text style={styles.sinDetalleTitulo}>Sin detalle de productos</Text>
                        <Text style={styles.sinDetalleTexto}>
                          Este pedido fue guardado sin productos. No se puede aceptar porque no hay inventario que descontar.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.productosDetalle}>
                        {detalles.map((item: any, detalleIndex: number) => (
                          <View key={detalleIndex} style={styles.productoDetalleItem}>
                            <View>
                              <Text style={styles.productoDetalleNombre}>
                                {obtenerNombreProducto(item)}
                              </Text>

                              <Text style={styles.productoDetalleInfo}>
                                Cantidad: {obtenerCantidadDetalle(item)}
                              </Text>
                            </View>

                            <View style={styles.productoDetalleMontos}>
                              <Text style={styles.productoPrecio}>
                                {formatoColones(obtenerPrecioDetalle(item))}
                              </Text>

                              <Text style={styles.productoSubtotal}>
                                {formatoColones(obtenerSubtotalDetalle(item))}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.accionesPedido}>
                      <Pressable
                        style={[
                          styles.botonAceptar,
                          (!puedeAceptar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'Aceptado')}
                        disabled={!puedeAceptar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>Aceptar</Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.botonPreparar,
                          (!puedePreparar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'En preparación')}
                        disabled={!puedePreparar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>Preparar</Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.botonEnviar,
                          (!puedeEnviar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'En entrega')}
                        disabled={!puedeEnviar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>En entrega</Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.botonEntregar,
                          (!puedeEntregar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'Entregado')}
                        disabled={!puedeEntregar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>Entregado</Text>
                      </Pressable>
                    </View>

                    <View style={styles.accionesPedido}>
                      <Pressable
                        style={[
                          styles.botonRechazar,
                          (!puedeRechazar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'Rechazado')}
                        disabled={!puedeRechazar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>Rechazar</Text>
                      </Pressable>

                      <Pressable
                        style={[
                          styles.botonCancelar,
                          (!puedeCancelar(pedido) || actualizando) && styles.botonDesactivado,
                        ]}
                        onPress={() => cambiarEstado(pedido, 'Cancelado')}
                        disabled={!puedeCancelar(pedido) || actualizando}
                      >
                        <Text style={styles.textoBotonAccion}>Cancelar</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.footerTabla}>
          <Text style={styles.footerTexto}>
            Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
          </Text>
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
  filtrosTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
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
  mensajeCaja: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  mensajeOk: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  mensajeError: {
    backgroundColor: '#ffebee',
    borderColor: '#c62828',
  },
  mensajeInfo: {
    backgroundColor: '#fff8e1',
    borderColor: '#f9a825',
  },
  mensajeTexto: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    textAlign: 'center',
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
  tarjetaIconoVerde: {
    color: '#2e7d32',
    borderWidth: 3,
    borderColor: '#2e7d32',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 26,
    fontWeight: 'bold',
  },
  tarjetaIconoAzul: {
    color: '#1565c0',
    borderWidth: 3,
    borderColor: '#1565c0',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tarjetaLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  tarjetaNumero: {
    color: '#0f4f24',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaNumeroNaranja: {
    color: '#f58220',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaNumeroAzul: {
    color: '#1565c0',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tarjetaDetalle: {
    color: '#777',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  filtros: {
    gap: 14,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
  },
  filtrosFila: {
    flexDirection: 'row',
    gap: 10,
  },
  filtroBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filtroBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  filtroTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  filtroTextoActivo: {
    color: '#ffffff',
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingVertical: 12,
  },
  th: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pedidoBloque: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0eadb',
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tdPedido: {
    color: '#0f4f24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tdCentro: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
  },
  tdTotal: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  clienteNombre: {
    color: '#333',
    fontWeight: 'bold',
  },
  clienteDetalle: {
    color: '#777',
    fontSize: 12,
    marginTop: 3,
  },
  horaTexto: {
    color: '#777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  colPedido: {
    flex: 0.8,
  },
  colCliente: {
    flex: 1.8,
  },
  colFecha: {
    flex: 1.1,
    alignItems: 'center',
  },
  colPago: {
    flex: 1,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1.2,
    textAlign: 'center',
  },
  colEstado: {
    flex: 1.3,
    alignItems: 'center',
  },
  colAccion: {
    flex: 0.8,
    alignItems: 'center',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  estadoPendiente: {
    backgroundColor: '#fff3e0',
  },
  estadoAceptado: {
    backgroundColor: '#e8f5e9',
  },
  estadoPreparacion: {
    backgroundColor: '#f3e5f5',
  },
  estadoEntrega: {
    backgroundColor: '#e3f2fd',
  },
  estadoEntregado: {
    backgroundColor: '#e3f2fd',
  },
  estadoRechazado: {
    backgroundColor: '#ffebee',
  },
  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  puntoNaranja: {
    backgroundColor: '#f58220',
  },
  puntoVerde: {
    backgroundColor: '#2e7d32',
  },
  puntoAzul: {
    backgroundColor: '#1565c0',
  },
  puntoMorado: {
    backgroundColor: '#7b1fa2',
  },
  puntoRojo: {
    backgroundColor: '#c62828',
  },
  estadoTexto: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botonDetalle: {
    backgroundColor: '#0f4f24',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  textoDetalle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detalleCaja: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  detalleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 14,
  },
  detalleHeaderTexto: {
    flex: 1,
  },
  detalleTitulo: {
    color: '#1b5e20',
    fontSize: 20,
    fontWeight: 'bold',
  },
  detalleSubtitulo: {
    color: '#666',
    marginTop: 5,
  },
  detalleTotalCaja: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 14,
    padding: 12,
    minWidth: 160,
  },
  detalleTotalLabel: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  detalleTotal: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sinDetalleCaja: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
    borderRadius: 14,
    padding: 14,
  },
  sinDetalleTitulo: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 17,
  },
  sinDetalleTexto: {
    color: '#555',
    marginTop: 5,
    lineHeight: 20,
  },
  productosDetalle: {
    gap: 10,
  },
  productoDetalleItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  productoDetalleNombre: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productoDetalleInfo: {
    color: '#555',
    marginTop: 4,
  },
  productoDetalleMontos: {
    alignItems: 'flex-end',
  },
  productoPrecio: {
    color: '#777',
  },
  productoSubtotal: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  accionesPedido: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  botonAceptar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#2e7d32',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonPreparar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#7b1fa2',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonEnviar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#0288d1',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonEntregar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonRechazar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#c62828',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonCancelar: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#616161',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonDesactivado: {
    backgroundColor: '#bdbdbd',
  },
  textoBotonAccion: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  vacio: {
    padding: 34,
    alignItems: 'center',
  },
  vacioIcono: {
    fontSize: 42,
    marginBottom: 8,
  },
  vacioTitulo: {
    color: '#0f4f24',
    fontSize: 20,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
  footerTabla: {
    paddingTop: 14,
  },
  footerTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
});
