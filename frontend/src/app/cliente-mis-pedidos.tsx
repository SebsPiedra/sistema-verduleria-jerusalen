import { createAppStyles, useAppStyles } from '../theme/appStyles';
import ClientHeader from '../components/ClientHeader';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { obtenerDato } from '../services/storage.js';

export default function ClienteMisPedidosScreen() {
  const styles = useAppStyles(baseStyles);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const [cliente, setCliente] = useState<any>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalleAbierto, setDetalleAbierto] = useState<number | null>(null);
  const [detallePedido, setDetallePedido] = useState<any>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [errorVisible,setErrorVisible] = useState('');

  useEffect(() => {
    cargarClienteYPedidos();
    // La consulta inicial se repite manualmente con el botón de actualización.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarClienteYPedidos = async () => {
    try {
      setCargando(true);
      setErrorVisible('');

      const clienteGuardado = await obtenerDato('cliente');

      if (!clienteGuardado) {
        Alert.alert('Sesión requerida', 'Debe iniciar sesión como cliente.');
        router.replace('/cliente-login' as any);
        return;
      }

      const clienteData = JSON.parse(clienteGuardado);
      setCliente(clienteData);

      const respuesta = await api.get(`/pedidos/cliente/${clienteData.id_cliente}`);

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.pedidos || [];

      setPedidos(datos);
    } catch (error: any) {
      console.log('Error al cargar pedidos del cliente:', error?.response?.data || error);
      Alert.alert('Error', 'No se pudieron cargar sus pedidos.');
      setErrorVisible('No se pudieron cargar tus pedidos. Pulsa Actualizar para reintentar.');
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalle = async (idPedido: number) => {
    try {
      if (detalleAbierto === idPedido) {
        setDetalleAbierto(null);
        setDetallePedido(null);
        return;
      }

      setCargandoDetalle(idPedido);
      const respuesta = await api.get(`/pedidos/${idPedido}`);
      setDetallePedido(respuesta.data);
      setDetalleAbierto(idPedido);
    } catch (error: any) {
      console.log('Error al cargar detalle del pedido:', error?.response?.data || error);
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido.');
      setErrorVisible('No se pudo abrir el detalle. Intenta nuevamente.');
    } finally {
      setCargandoDetalle(null);
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

  const obtenerEstado = (estado: any) => {
    return estado || 'Pendiente';
  };

  const obtenerTipoEntrega = (pedido: any) => {
    return pedido.tipo_entrega || pedido.tipoEntrega || 'Entrega';
  };

  const obtenerDireccion = (pedido: any) => {
    const tipoEntrega = obtenerTipoEntrega(pedido);

    if (tipoEntrega === 'Retiro en tienda') {
      return 'Retiro en tienda';
    }

    return pedido.direccion_entrega || pedido.direccion || 'No indicada';
  };

  const obtenerTelefono = (pedido: any) => {
    return pedido.telefono || pedido.telefono_cliente || cliente?.telefono || '';
  };

  const obtenerCorreo = (pedido: any) => {
    return pedido.correo || pedido.correo_cliente || pedido.email || cliente?.correo || cliente?.email || '';
  };

  const obtenerMensajeEstado = (estadoPedido: string) => {
    const estado = obtenerEstado(estadoPedido);

    if (estado === 'Pendiente') {
      return 'Su pedido fue recibido y está esperando revisión por parte de la administración.';
    }

    if (estado === 'Aceptado') {
      return 'Su pedido fue aceptado y está en preparación.';
    }

    if (estado === 'En preparación') {
      return 'Su pedido está siendo preparado por la verdulería.';
    }

    if (estado === 'En entrega') {
      return 'Su pedido va en camino o se encuentra en proceso de entrega.';
    }

    if (estado === 'Rechazado') {
      return 'Su pedido fue rechazado por la administración.';
    }

    if (estado === 'Entregado') {
      return 'Su pedido ya fue entregado.';
    }

    if (estado === 'Cancelado') {
      return 'Su pedido fue cancelado.';
    }

    return 'El pedido se encuentra en revisión.';
  };

  const obtenerIconoEstado = (estadoPedido: string) => {
    const estado = obtenerEstado(estadoPedido);

    if (estado === 'Pendiente') return '⏳';
    if (estado === 'Aceptado') return '✅';
    if (estado === 'En preparación') return '🥬';
    if (estado === 'En entrega') return '🚚';
    if (estado === 'Rechazado') return '❌';
    if (estado === 'Entregado') return '📦';
    if (estado === 'Cancelado') return '🚫';

    return '📋';
  };

  const obtenerEstiloEstado = (estadoPedido: string) => {
    const estado = obtenerEstado(estadoPedido);

    if (estado === 'Pendiente') {
      return {
        caja: styles.estadoPendiente,
        texto: styles.estadoTextoPendiente,
      };
    }

    if (estado === 'Aceptado') {
      return {
        caja: styles.estadoAceptado,
        texto: styles.estadoTextoAceptado,
      };
    }

    if (estado === 'En preparación') {
      return {
        caja: styles.estadoPreparacion,
        texto: styles.estadoTextoPreparacion,
      };
    }

    if (estado === 'En entrega') {
      return {
        caja: styles.estadoEntrega,
        texto: styles.estadoTextoEntrega,
      };
    }

    if (estado === 'Rechazado') {
      return {
        caja: styles.estadoRechazado,
        texto: styles.estadoTextoRechazado,
      };
    }

    if (estado === 'Entregado') {
      return {
        caja: styles.estadoEntregado,
        texto: styles.estadoTextoEntregado,
      };
    }

    if (estado === 'Cancelado') {
      return {
        caja: styles.estadoCancelado,
        texto: styles.estadoTextoCancelado,
      };
    }

    return {
      caja: styles.estadoPendiente,
      texto: styles.estadoTextoPendiente,
    };
  };

  const obtenerDetallesActuales = () => {
    if (!detallePedido) return [];

    if (Array.isArray(detallePedido.detalles)) {
      return detallePedido.detalles;
    }

    if (Array.isArray(detallePedido?.pedido?.detalles)) {
      return detallePedido.pedido.detalles;
    }

    if (Array.isArray(detallePedido.productos)) {
      return detallePedido.productos;
    }

    if (Array.isArray(detallePedido.detalle)) {
      return detallePedido.detalle;
    }

    return [];
  };

  const obtenerNombreProducto = (item: any) => {
    return item.nombre || item.producto || item.nombre_producto || 'Producto';
  };

  const obtenerCantidad = (item: any) => {
    return Number(item.cantidad || 0);
  };

  const obtenerPrecio = (item: any) => {
    return Number(item.precio_unitario || item.precio || item.precio_venta || 0);
  };

  const obtenerSubtotal = (item: any) => {
    const subtotal = Number(item.subtotal || 0);

    if (subtotal > 0) return subtotal;

    return obtenerCantidad(item) * obtenerPrecio(item);
  };

  const limpiarHTML = (texto: any) => {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const prepararPDF = async (pedido: any) => {
    try {
      const idPedido = Number(pedido.id_pedido);

      if (!idPedido) {
        Alert.alert('Aviso', 'No se pudo preparar el PDF porque el pedido no tiene ID.');
        return;
      }

      let pedidoCompleto = pedido;
      let detalles = pedido.detalles || [];

      if (!Array.isArray(detalles) || detalles.length === 0) {
        const respuesta = await api.get(`/pedidos/${idPedido}`);
        pedidoCompleto = respuesta.data?.pedido || respuesta.data;
        detalles = respuesta.data?.detalles || pedidoCompleto?.detalles || [];
      }

      if (!Array.isArray(detalles) || detalles.length === 0) {
        Alert.alert('Aviso', 'Este pedido no tiene detalle de productos para generar el PDF.');
        return;
      }

      if (typeof window === 'undefined') {
        Alert.alert('Aviso', 'El PDF está disponible desde la versión web.');
        return;
      }

      const html = generarHTMLPedido(pedidoCompleto, detalles);
      const ventana = window.open('', '_blank', 'width=900,height=900');

      if (!ventana) {
        Alert.alert(
          'Aviso',
          'El navegador bloqueó la ventana emergente. Permita ventanas emergentes para generar el PDF.'
        );
        return;
      }

      ventana.document.open();
      ventana.document.write(html);
      ventana.document.close();

      setTimeout(() => {
        ventana.focus();
        ventana.print();
      }, 500);
    } catch (error: any) {
      console.log('Error al preparar PDF:', error?.response?.data || error);
      Alert.alert('Error', 'No se pudo preparar el PDF del pedido.');
    }
  };

  const generarHTMLPedido = (pedido: any, detalles: any[]) => {
    const filas = detalles
      .map((item) => {
        const unidad = item.unidad_medida || item.unidad || 'kg';

        return `
          <tr>
            <td>${limpiarHTML(obtenerNombreProducto(item))}</td>
            <td class="centro">${limpiarHTML(obtenerCantidad(item))} ${limpiarHTML(unidad)}</td>
            <td class="derecha">${limpiarHTML(formatoColones(obtenerPrecio(item)))}</td>
            <td class="derecha">${limpiarHTML(formatoColones(obtenerSubtotal(item)))}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Pedido #${limpiarHTML(pedido.id_pedido)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 30px;
            background: #f4f4f4;
            color: #222;
          }

          .factura {
            max-width: 820px;
            margin: auto;
            background: #ffffff;
            padding: 35px;
            border-radius: 16px;
            border: 1px solid #e5e5e5;
          }

          .encabezado {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 3px solid #0f4f24;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }

          .marca-pequena {
            color: #0f4f24;
            font-size: 14px;
            letter-spacing: 4px;
            font-weight: bold;
          }

          .marca {
            color: #0f4f24;
            font-size: 38px;
            font-weight: bold;
            line-height: 38px;
          }

          .submarca {
            color: #e07b18;
            font-size: 12px;
            font-weight: bold;
            margin-top: 4px;
          }

          .pedido-numero {
            text-align: right;
            background: #f7f2dc;
            border-radius: 14px;
            padding: 14px;
            min-width: 190px;
          }

          .pedido-numero span {
            display: block;
            color: #777;
            font-weight: bold;
            font-size: 13px;
          }

          .pedido-numero strong {
            display: block;
            color: #0f4f24;
            font-size: 24px;
            margin-top: 6px;
          }

          .datos {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            background: #fffdf6;
            border: 1px solid #ebe4d3;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 22px;
          }

          .dato label {
            display: block;
            color: #777;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .dato strong {
            color: #222;
            font-size: 15px;
          }

          .estado {
            display: inline-block;
            background: #e8f5e9;
            color: #0f4f24;
            border-radius: 999px;
            padding: 7px 12px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th {
            background: #0f4f24;
            color: #ffffff;
            text-align: left;
            padding: 12px;
            font-size: 13px;
          }

          td {
            border-bottom: 1px solid #eeeeee;
            padding: 12px;
            font-size: 13px;
          }

          .centro {
            text-align: center;
          }

          .derecha {
            text-align: right;
          }

          .total {
            margin-top: 25px;
            display: flex;
            justify-content: flex-end;
          }

          .total-caja {
            background: #e8f5e9;
            border: 1px solid #2e7d32;
            border-radius: 14px;
            padding: 18px;
            width: 280px;
          }

          .total-caja span {
            display: block;
            color: #1b5e20;
            font-weight: bold;
          }

          .total-caja strong {
            display: block;
            color: #0f4f24;
            font-size: 30px;
            margin-top: 5px;
          }

          .pie {
            margin-top: 35px;
            border-top: 1px solid #eeeeee;
            padding-top: 18px;
            text-align: center;
            color: #555;
            font-size: 13px;
          }

          .botones {
            max-width: 820px;
            margin: 18px auto 0;
            text-align: center;
          }

          .botones button {
            background: #0f4f24;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px 18px;
            font-weight: bold;
            cursor: pointer;
            margin: 4px;
          }

          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }

            .factura {
              border: none;
              border-radius: 0;
              max-width: 100%;
            }

            .botones {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="factura">
          <div class="encabezado">
            <div>
              <div class="marca-pequena">VERDULERÍA</div>
              <div class="marca">JERUSALÉN</div>
              <div class="submarca">FRUTAS · VERDURAS · JUGOS NATURALES</div>
            </div>

            <div class="pedido-numero">
              <span>Pedido</span>
              <strong>#${limpiarHTML(pedido.id_pedido)}</strong>
            </div>
          </div>

          <div class="datos">
            <div class="dato">
              <label>Cliente</label>
              <strong>${limpiarHTML(cliente?.nombre || pedido.cliente || 'Cliente')}</strong>
            </div>

            <div class="dato">
              <label>Fecha</label>
              <strong>${limpiarHTML(formatoFecha(pedido.fecha_pedido || pedido.fecha))}</strong>
            </div>

            <div class="dato">
              <label>Estado</label>
              <strong class="estado">${limpiarHTML(obtenerEstado(pedido.estado))}</strong>
            </div>

            <div class="dato">
              <label>Método de pago</label>
              <strong>${limpiarHTML(pedido.metodo_pago || 'Efectivo')}</strong>
            </div>

            <div class="dato">
              <label>Tipo de entrega</label>
              <strong>${limpiarHTML(obtenerTipoEntrega(pedido))}</strong>
            </div>

            <div class="dato">
              <label>Teléfono</label>
              <strong>${limpiarHTML(obtenerTelefono(pedido) || 'Sin teléfono')}</strong>
            </div>

            <div class="dato">
              <label>Correo</label>
              <strong>${limpiarHTML(obtenerCorreo(pedido) || 'Sin correo')}</strong>
            </div>

            <div class="dato">
              <label>Dirección</label>
              <strong>${limpiarHTML(obtenerDireccion(pedido))}</strong>
            </div>

            <div class="dato">
              <label>Observación</label>
              <strong>${limpiarHTML(pedido.observacion || 'Sin observación')}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="centro">Cantidad</th>
                <th class="derecha">Precio</th>
                <th class="derecha">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="total">
            <div class="total-caja">
              <span>Total del pedido</span>
              <strong>${limpiarHTML(formatoColones(pedido.total))}</strong>
            </div>
          </div>

          <div class="pie">
            Gracias por su compra. Verdulería Jerusalén.
          </div>
        </div>

        <div class="botones">
          <button onclick="window.print()">Guardar / imprimir PDF</button>
          <button onclick="window.close()">Cerrar</button>
        </div>
      </body>
      </html>
    `;
  };

  const totalPedidos = pedidos.length;

  const pedidosPendientes = pedidos.filter(
    (pedido) => obtenerEstado(pedido.estado) === 'Pendiente'
  ).length;

  const pedidosAceptados = pedidos.filter(
    (pedido) => obtenerEstado(pedido.estado) === 'Aceptado'
  ).length;

  const estadosDisponibles = [
    'Todos',
    ...Array.from(new Set(pedidos.map((pedido) => obtenerEstado(pedido.estado)))),
  ];

  const pedidosFiltrados = filtroEstado === 'Todos'
    ? pedidos
    : pedidos.filter((pedido) => obtenerEstado(pedido.estado) === filtroEstado);

  const pedidosVisibles = [...pedidosFiltrados].sort((a, b) => {
    const fechaA = new Date(a.fecha_pedido || a.fecha || a.created_at || 0).getTime();
    const fechaB = new Date(b.fecha_pedido || b.fecha || b.created_at || 0).getTime();
    return fechaB - fechaA;
  });

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#0f4f24" />
        <Text style={styles.cargandoTexto}>Cargando sus pedidos...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, isPhone && styles.containerPhone]}>
      <ClientHeader />
      {!!errorVisible&&<Text accessibilityRole="alert" style={{padding:14,color:'#a02020',backgroundColor:'#fff0f0'}}>{errorVisible}</Text>}
      <View style={[styles.hero, isPhone && styles.heroPhone]}>
        <View style={styles.heroTexto}>
          <Text style={styles.heroEtiqueta}>TU CUENTA</Text>
          <Text style={styles.titulo}>Pedidos recientes</Text>
          <Text style={styles.subtitulo}>
            Hola, {cliente?.nombre || 'cliente'}. Revisa el estado y los productos de cada compra.
          </Text>
        </View>

        <View style={styles.heroIconoCaja}>
          <Text style={styles.heroIcono}>📦</Text>
        </View>
      </View>

      <View style={[styles.accionesSuperiores, isPhone && styles.accionesSuperioresPhone]}>
        <Pressable accessibilityRole="button" style={styles.botonActualizar} onPress={cargarClienteYPedidos}>
          <Text style={styles.textoBotonClaro}>Actualizar</Text>
        </Pressable>

        <Pressable accessibilityRole="button"
          style={styles.botonNuevoSuperior}
          onPress={() => router.push('/cliente-pedido' as any)}
        >
          <Text style={styles.textoBotonOscuro}>Nuevo pedido</Text>
        </Pressable>
      </View>

      <View style={styles.resumenFila}>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenLabel}>Pedidos</Text>
          <Text style={styles.resumenNumero}>{totalPedidos}</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenLabel}>Pendientes</Text>
          <Text style={styles.resumenNumeroNaranja}>{pedidosPendientes}</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenLabel}>Aceptados</Text>
          <Text style={styles.resumenNumeroVerde}>{pedidosAceptados}</Text>
        </View>

      </View>

      {pedidos.length > 0 ? (
        <View style={styles.filtrosArea}>
          <View>
            <Text style={styles.seccionTitulo}>Tus compras</Text>
            <Text style={styles.seccionSubtitulo}>
              {pedidosVisibles.length} {pedidosVisibles.length === 1 ? 'pedido' : 'pedidos'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosFila}>
            {estadosDisponibles.map((estado) => {
              const activo = filtroEstado === estado;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  key={estado}
                  onPress={() => setFiltroEstado(estado)}
                  style={[styles.filtroBoton, activo && styles.filtroBotonActivo]}
                >
                  <Text style={[styles.filtroTexto, activo && styles.filtroTextoActivo]}>{estado}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {pedidos.length === 0 ? (
        <View style={styles.vacioBox}>
          <Text style={styles.vacioIcono}>🧺</Text>
          <Text style={styles.vacioTitulo}>Todavía no tiene pedidos</Text>
          <Text style={styles.vacioTexto}>
            Cuando realice un pedido desde el catálogo, aparecerá aquí con su seguimiento.
          </Text>

          <Pressable accessibilityRole="button"
            style={styles.botonPedidoVacio}
            onPress={() => router.push('/cliente-home' as any)}
          >
            <Text style={styles.textoBotonClaro}>Ir al catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.listaPedidos}>
          {pedidosVisibles.map((pedido) => {
            const estado = obtenerEstado(pedido.estado);
            const estiloEstado = obtenerEstiloEstado(estado);
            const estaAbierto = detalleAbierto === pedido.id_pedido;
            const detallesActuales = estaAbierto ? obtenerDetallesActuales() : [];

            return (
              <View key={pedido.id_pedido} style={styles.card}>
                <View style={[styles.cardHeader, isPhone && styles.cardHeaderPhone]}>
                  <View>
                    <Text style={styles.numeroPedido}>Pedido #{pedido.id_pedido}</Text>
                    <Text style={styles.fechaPedido}>
                      {formatoFecha(pedido.fecha_pedido || pedido.fecha || pedido.created_at)}
                    </Text>
                  </View>

                  <View style={[styles.estadoCaja, estiloEstado.caja]}>
                    <Text style={styles.estadoIcono}>{obtenerIconoEstado(estado)}</Text>
                    <Text style={[styles.estadoTexto, estiloEstado.texto]}>
                      {estado}
                    </Text>
                  </View>
                </View>

                <View style={[styles.seguimientoBox, estiloEstado.caja]}>
                  <View style={styles.seguimientoTituloFila}>
                    <Text style={styles.seguimientoIcono}>{obtenerIconoEstado(estado)}</Text>
                    <Text style={styles.seguimientoTitulo}>Ahora</Text>
                  </View>

                  <Text style={styles.seguimientoTexto}>
                    {obtenerMensajeEstado(estado)}
                  </Text>
                </View>

                <View style={[styles.infoGrid, isPhone && styles.infoGridPhone]}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Método de pago</Text>
                    <Text style={styles.infoValor}>
                      {pedido.metodo_pago || 'No indicado'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tipo de entrega</Text>
                    <Text style={styles.infoValor}>
                      {obtenerTipoEntrega(pedido)}
                    </Text>
                  </View>

                </View>

                <View style={styles.direccionBox}>
                  <Text style={styles.infoLabel}>Dirección / retiro</Text>
                  <Text style={styles.direccionTexto}>
                    {obtenerDireccion(pedido)}
                  </Text>
                </View>

                {pedido.observacion ? (
                  <View style={styles.observacionBox}>
                    <Text style={styles.infoLabel}>Observación</Text>
                    <Text style={styles.observacionTexto}>{pedido.observacion}</Text>
                  </View>
                ) : null}

                <View style={[styles.totalFila, isPhone && styles.totalFilaPhone]}>
                  <View>
                    <Text style={styles.totalLabel}>Total del pedido</Text>
                    <Text style={styles.total}>{formatoColones(pedido.total)}</Text>
                  </View>

                  <View style={[styles.accionesPedido, isPhone && styles.accionesPedidoPhone]}>
                    <Pressable accessibilityRole="button"
                      disabled={cargandoDetalle === pedido.id_pedido}
                      style={[
                        styles.botonDetalle,
                        estaAbierto && styles.botonDetalleActivo,
                      ]}
                      onPress={() => cargarDetalle(pedido.id_pedido)}
                    >
                      <Text
                        style={[
                          styles.textoDetalle,
                          estaAbierto && styles.textoDetalleActivo,
                        ]}
                      >
                        {cargandoDetalle === pedido.id_pedido
                          ? 'Cargando...'
                          : estaAbierto ? 'Ocultar productos' : 'Ver productos'}
                      </Text>
                    </Pressable>

                    <Pressable accessibilityRole="button"
                      style={styles.botonPDF}
                      onPress={() => prepararPDF(pedido)}
                    >
                      <Text style={styles.textoPDF}>Comprobante PDF</Text>
                    </Pressable>
                  </View>
                </View>

                {estaAbierto && (
                  <View style={styles.detalleBox}>
                    <Text style={styles.detalleTitulo}>Productos solicitados</Text>

                    {detallesActuales.length === 0 ? (
                      <View style={styles.detalleVacio}>
                        <Text style={styles.detalleVacioTexto}>
                          No hay productos registrados en este pedido.
                        </Text>
                      </View>
                    ) : (
                      detallesActuales.map((item: any, index: number) => {
                        const unidad = item.unidad_medida || item.unidad || 'kg';
                        const nombre = obtenerNombreProducto(item);

                        return (
                          <View
                            key={item.id_detalle_pedido || item.id_detalle || index}
                            style={styles.productoDetalle}
                          >
                            <View style={[styles.productoHeader, isPhone && styles.productoHeaderPhone]}>
                              <Text style={styles.productoNombre}>{nombre}</Text>
                              <Text style={styles.productoSubtotal}>
                                {formatoColones(obtenerSubtotal(item))}
                              </Text>
                            </View>

                            <View style={[styles.productoInfoFila, isPhone && styles.productoInfoFilaPhone]}>
                              <Text style={styles.productoTexto}>
                                Cantidad: {obtenerCantidad(item)} {unidad}
                              </Text>

                              <Text style={styles.productoTexto}>
                                Precio: {formatoColones(obtenerPrecio(item))} / {unidad}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.botonesFinales}>
        <Pressable accessibilityRole="button"
          style={styles.botonNuevoPedido}
          onPress={() => router.push('/cliente-pedido' as any)}
        >
          <Text style={styles.textoBotonClaro}>Hacer nuevo pedido</Text>
        </Pressable>

        <Pressable accessibilityRole="button"
          style={styles.botonVolver}
          onPress={() => router.push('/cliente-home' as any)}
        >
          <Text style={styles.textoVolver}>Volver al catálogo</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const baseStyles = createAppStyles({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f1df',
    padding: 22,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  containerPhone: { padding: 12 },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f1df',
  },
  cargandoTexto: {
    color: '#0f4f24',
    fontWeight: 'bold',
    marginTop: 12,
  },
  hero: {
    backgroundColor: '#073f3d',
    borderRadius: 28,
    padding: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
    marginBottom: 18,
  },
  heroPhone: { padding: 18, borderRadius: 20 },
  heroTexto: {
    flex: 1,
  },
  heroEtiqueta: {
    color: '#f7c948',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#e8f5e9',
    fontSize: 16,
    marginTop: 6,
  },
  heroIconoCaja: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#dff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcono: {
    fontSize: 36,
  },
  accionesSuperiores: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  accionesSuperioresPhone: { flexDirection: 'column' },
  botonActualizar: {
    flex: 1,
    backgroundColor: '#7bb51e',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  botonNuevoSuperior: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f4f24',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  textoBotonClaro: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  textoBotonOscuro: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  resumenFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  resumenCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 16,
  },
  resumenIcono: {
    fontSize: 28,
    marginBottom: 8,
  },
  resumenLabel: {
    color: '#555',
    fontWeight: 'bold',
  },
  resumenNumero: {
    color: '#0f4f24',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resumenNumeroNaranja: {
    color: '#f58220',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  resumenNumeroVerde: {
    color: '#2e7d32',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  vacioBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 18,
  },
  vacioIcono: {
    fontSize: 55,
    marginBottom: 8,
  },
  vacioTitulo: {
    color: '#0f4f24',
    fontSize: 24,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  botonPedidoVacio: {
    backgroundColor: '#0f4f24',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  listaPedidos: {
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 5px 12px rgba(8, 47, 45, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderPhone: { flexDirection: 'column' },
  numeroPedido: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f4f24',
  },
  fechaPedido: {
    color: '#777',
    marginTop: 4,
    fontWeight: 'bold',
  },
  estadoCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
  },
  estadoIcono: {
    fontSize: 15,
  },
  estadoTexto: {
    fontWeight: 'bold',
  },
  estadoPendiente: {
    backgroundColor: '#fff8e1',
  },
  estadoTextoPendiente: {
    color: '#f57f17',
  },
  estadoAceptado: {
    backgroundColor: '#e8f5e9',
  },
  estadoTextoAceptado: {
    color: '#2e7d32',
  },
  estadoPreparacion: {
    backgroundColor: '#f3e5f5',
  },
  estadoTextoPreparacion: {
    color: '#7b1fa2',
  },
  estadoEntrega: {
    backgroundColor: '#e3f2fd',
  },
  estadoTextoEntrega: {
    color: '#0d47a1',
  },
  estadoRechazado: {
    backgroundColor: '#ffebee',
  },
  estadoTextoRechazado: {
    color: '#b71c1c',
  },
  estadoEntregado: {
    backgroundColor: '#e3f2fd',
  },
  estadoTextoEntregado: {
    color: '#0d47a1',
  },
  estadoCancelado: {
    backgroundColor: '#eeeeee',
  },
  estadoTextoCancelado: {
    color: '#424242',
  },
  seguimientoBox: {
    backgroundColor: '#eef8f5',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    padding: 13,
    borderRadius: 15,
    marginBottom: 14,
  },
  seguimientoTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  seguimientoIcono: {
    fontSize: 16,
  },
  seguimientoTitulo: {
    fontWeight: 'bold',
    color: '#0f4f24',
  },
  seguimientoTexto: {
    color: '#555',
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoGridPhone: { flexDirection: 'column' },
  infoItem: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 15,
    padding: 13,
  },
  infoLabel: {
    color: '#777',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoValor: {
    color: '#333',
    fontWeight: 'bold',
  },
  direccionBox: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 15,
    padding: 13,
    marginBottom: 12,
  },
  direccionTexto: {
    color: '#333',
    lineHeight: 20,
  },
  observacionBox: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#f9d77e',
    borderRadius: 15,
    padding: 13,
    marginBottom: 12,
  },
  observacionTexto: {
    color: '#5d4037',
    lineHeight: 20,
  },
  totalFila: {
    backgroundColor: '#eff9f5',
    borderWidth: 0,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  totalFilaPhone: { flexDirection: 'column', alignItems: 'stretch' },
  totalLabel: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  total: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 25,
    marginTop: 4,
  },
  accionesPedido: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  accionesPedidoPhone: { flexDirection: 'column' },
  botonDetalle: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f4f24',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  botonDetalleActivo: {
    backgroundColor: '#0f4f24',
  },
  textoDetalle: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  textoDetalleActivo: {
    color: '#ffffff',
  },
  botonPDF: {
    backgroundColor: '#f58220',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  textoPDF: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  detalleBox: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    padding: 15,
    borderRadius: 18,
    marginTop: 14,
  },
  detalleTitulo: {
    fontWeight: 'bold',
    color: '#0f4f24',
    fontSize: 20,
    marginBottom: 12,
  },
  detalleVacio: {
    padding: 18,
    alignItems: 'center',
  },
  detalleVacioTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
  productoDetalle: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    padding: 13,
    borderRadius: 15,
    marginBottom: 10,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  productoHeaderPhone: { flexDirection: 'column' },
  productoNombre: {
    flex: 1,
    fontWeight: 'bold',
    color: '#0f4f24',
    fontSize: 16,
  },
  productoSubtotal: {
    color: '#f58220',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productoInfoFila: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  productoInfoFilaPhone: { flexDirection: 'column' },
  productoTexto: {
    color: '#555',
    fontWeight: 'bold',
  },
  botonesFinales: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  botonNuevoPedido: {
    flex: 1,
    backgroundColor: '#0f4f24',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  botonVolver: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f4f24',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  textoVolver: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  filtrosArea: {
    gap: 12,
    marginBottom: 16,
  },
  seccionTitulo: {
    color: '#073f3d',
    fontSize: 24,
    fontWeight: '800',
  },
  seccionSubtitulo: {
    color: '#62716f',
    marginTop: 3,
  },
  filtrosFila: {
    gap: 8,
    paddingRight: 8,
  },
  filtroBoton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfe1dd',
  },
  filtroBotonActivo: {
    backgroundColor: '#087f73',
    borderColor: '#087f73',
  },
  filtroTexto: {
    color: '#0b625c',
    fontWeight: '700',
  },
  filtroTextoActivo: {
    color: '#ffffff',
  },
});
