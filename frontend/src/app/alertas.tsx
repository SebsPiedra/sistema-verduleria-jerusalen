import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function AlertasScreen() {
  const router = useRouter();

  const [productos, setProductos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [desechos, setDesechos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todas');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuestas = await Promise.allSettled([
        api.get('/productos'),
        api.get('/pedidos'),
        api.get('/desechos'),
      ]);

      const obtenerDatos = (respuesta: any, propiedad: string) => {
        if (respuesta.status !== 'fulfilled') return [];

        const data = respuesta.value.data;

        if (Array.isArray(data)) return data;

        return data?.[propiedad] || [];
      };

      setProductos(obtenerDatos(respuestas[0], 'productos'));
      setPedidos(obtenerDatos(respuestas[1], 'pedidos'));
      setDesechos(obtenerDatos(respuestas[2], 'desechos'));
    } catch (error: any) {
      console.log('Error al cargar alertas:', error?.response?.data || error);
      setMensaje('No se pudieron cargar las alertas.');
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

  const obtenerNombreProducto = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerCategoriaProducto = (producto: any) => {
    return producto.categoria || producto.nombre_categoria || producto.categoria_nombre || 'General';
  };

  const obtenerCantidadProducto = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? 0);
  };

  const obtenerStockMinimo = (producto: any) => {
    return Number(producto.stock_minimo || 5);
  };

  const obtenerUnidad = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerEstadoPedido = (pedido: any) => {
    return String(pedido.estado || 'Pendiente');
  };

  const obtenerIdPedido = (pedido: any) => {
    return pedido.id_pedido || pedido.id || pedido.idPedido || '';
  };

  const obtenerClientePedido = (pedido: any) => {
    return pedido.cliente || pedido.nombre_cliente || pedido.nombre || 'Cliente no especificado';
  };

  const obtenerFechaPedido = (pedido: any) => {
    return pedido.fecha_pedido || pedido.fecha || pedido.created_at || pedido.fecha_creacion;
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

  const obtenerNombreDesecho = (desecho: any) => {
    return desecho.producto || desecho.nombre_producto || desecho.nombre || 'Producto no especificado';
  };

  const obtenerMotivoDesecho = (desecho: any) => {
    return desecho.motivo || desecho.razon || 'Sin motivo';
  };

  const obtenerFechaDesecho = (desecho: any) => {
    return desecho.fecha_desecho || desecho.fecha || desecho.created_at;
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

  const pedidosPendientes = pedidos.filter(
    (pedido) => obtenerEstadoPedido(pedido).toLowerCase() === 'pendiente'
  );

  const pedidosSinDetalle = pedidos.filter((pedido) => {
    const detalles = pedido.detalles || pedido.detalle || pedido.productos || [];
    return Array.isArray(detalles) && detalles.length === 0;
  });

  const desechosAltos = desechos.filter((desecho) => obtenerPerdidaDesecho(desecho) >= 1000);

  const alertas = [
    ...productosSinStock.map((producto) => ({
      tipo: 'Sin stock',
      prioridad: 'Alta',
      icono: '🚫',
      titulo: obtenerNombreProducto(producto),
      descripcion: `Producto agotado. Cantidad actual: ${obtenerCantidadProducto(producto)} ${obtenerUnidad(producto)}.`,
      detalle: `Categoría: ${obtenerCategoriaProducto(producto)}`,
      accion: 'Ir al inventario',
      ruta: '/productos',
      color: 'rojo',
    })),
    ...productosStockBajo.map((producto) => ({
      tipo: 'Stock bajo',
      prioridad: 'Media',
      icono: '⚠️',
      titulo: obtenerNombreProducto(producto),
      descripcion: `Quedan ${obtenerCantidadProducto(producto)} ${obtenerUnidad(producto)}. Stock mínimo: ${obtenerStockMinimo(producto)}.`,
      detalle: `Categoría: ${obtenerCategoriaProducto(producto)}`,
      accion: 'Revisar producto',
      ruta: '/productos',
      color: 'naranja',
    })),
    ...pedidosPendientes.map((pedido) => ({
      tipo: 'Pedido pendiente',
      prioridad: 'Media',
      icono: '📋',
      titulo: `Pedido #${obtenerIdPedido(pedido)}`,
      descripcion: `Cliente: ${obtenerClientePedido(pedido)}. Total: ${formatoColones(obtenerTotalPedido(pedido))}.`,
      detalle: `Fecha: ${formatoFecha(obtenerFechaPedido(pedido))}`,
      accion: 'Revisar pedido',
      ruta: '/pedidos-admin',
      color: 'azul',
    })),
    ...pedidosSinDetalle.map((pedido) => ({
      tipo: 'Pedido sin detalle',
      prioridad: 'Alta',
      icono: '❗',
      titulo: `Pedido #${obtenerIdPedido(pedido)}`,
      descripcion: 'Este pedido no tiene productos registrados y no se puede aceptar.',
      detalle: `Cliente: ${obtenerClientePedido(pedido)}`,
      accion: 'Ver pedido',
      ruta: '/pedidos-admin',
      color: 'rojo',
    })),
    ...desechosAltos.map((desecho) => ({
      tipo: 'Pérdida alta',
      prioridad: 'Media',
      icono: '🗑️',
      titulo: obtenerNombreDesecho(desecho),
      descripcion: `Pérdida registrada: ${formatoColones(obtenerPerdidaDesecho(desecho))}.`,
      detalle: `${obtenerMotivoDesecho(desecho)} · ${formatoFecha(obtenerFechaDesecho(desecho))}`,
      accion: 'Ver desechos',
      ruta: '/desechos',
      color: 'naranja',
    })),
  ];

  const tipos = ['Todas', 'Sin stock', 'Stock bajo', 'Pedido pendiente', 'Pedido sin detalle', 'Pérdida alta'];

  const alertasFiltradas = alertas.filter((alerta) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      alerta.titulo.toLowerCase().includes(texto) ||
      alerta.descripcion.toLowerCase().includes(texto) ||
      alerta.detalle.toLowerCase().includes(texto) ||
      alerta.tipo.toLowerCase().includes(texto);

    const coincideTipo = filtroTipo === 'Todas' || alerta.tipo === filtroTipo;

    return coincideBusqueda && coincideTipo;
  });

  const alertasAltas = alertas.filter((alerta) => alerta.prioridad === 'Alta');
  const alertasMedias = alertas.filter((alerta) => alerta.prioridad === 'Media');

  const obtenerEstilos = (color: string) => {
    if (color === 'rojo') {
      return {
        card: styles.alertaRoja,
        badge: styles.badgeRojo,
        texto: styles.textoRojo,
      };
    }

    if (color === 'naranja') {
      return {
        card: styles.alertaNaranja,
        badge: styles.badgeNaranja,
        texto: styles.textoNaranja,
      };
    }

    return {
      card: styles.alertaAzul,
      badge: styles.badgeAzul,
      texto: styles.textoAzul,
    };
  };

  return (
    <AdminLayout
      titulo="Alertas"
      subtitulo="Avisos importantes de inventario, pedidos y pérdidas"
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.titulo}>Centro de alertas 🔔</Text>
          <Text style={styles.subtitulo}>
            Revise situaciones que requieren atención para evitar pérdidas o atrasos.
          </Text>
        </View>

        <Pressable style={styles.botonActualizar} onPress={cargarAlertas}>
          <Text style={styles.textoActualizar}>
            {cargando ? 'Actualizando...' : 'Actualizar alertas'}
          </Text>
        </Pressable>
      </View>

      {mensaje !== '' && (
        <View style={styles.mensajeError}>
          <Text style={styles.mensajeTexto}>{mensaje}</Text>
        </View>
      )}

      <View style={styles.tarjetas}>
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIcono}>🔔</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Alertas totales</Text>
            <Text style={styles.tarjetaNumero}>{alertas.length}</Text>
            <Text style={styles.tarjetaDetalle}>Situaciones detectadas</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>!</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Prioridad alta</Text>
            <Text style={styles.tarjetaNumeroRojo}>{alertasAltas.length}</Text>
            <Text style={styles.tarjetaDetalle}>Atender primero</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⚠</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Prioridad media</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{alertasMedias.length}</Text>
            <Text style={styles.tarjetaDetalle}>Revisar pronto</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>✓</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Productos revisados</Text>
            <Text style={styles.tarjetaNumero}>{productosActivos.length}</Text>
            <Text style={styles.tarjetaDetalle}>Inventario analizado</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.filtros}>
          <TextInput
            style={styles.input}
            placeholder="Buscar alerta por producto, pedido, motivo o tipo..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtrosFila}>
              {tipos.map((tipo) => (
                <Pressable
                  key={tipo}
                  style={[
                    styles.filtroBoton,
                    filtroTipo === tipo && styles.filtroBotonActivo,
                  ]}
                  onPress={() => setFiltroTipo(tipo)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      filtroTipo === tipo && styles.filtroTextoActivo,
                    ]}
                  >
                    {tipo}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {cargando ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Cargando alertas...</Text>
          </View>
        ) : alertasFiltradas.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>✅</Text>
            <Text style={styles.vacioTitulo}>No hay alertas para mostrar</Text>
            <Text style={styles.vacioTexto}>
              El inventario y los pedidos no presentan alertas con los filtros actuales.
            </Text>
          </View>
        ) : (
          <View style={styles.listaAlertas}>
            {alertasFiltradas.map((alerta, index) => {
              const estilos = obtenerEstilos(alerta.color);

              return (
                <View key={`${alerta.tipo}-${alerta.titulo}-${index}`} style={[styles.alertaCard, estilos.card]}>
                  <View style={styles.alertaIconoCaja}>
                    <Text style={styles.alertaIcono}>{alerta.icono}</Text>
                  </View>

                  <View style={styles.alertaContenido}>
                    <View style={styles.alertaHeader}>
                      <View>
                        <Text style={styles.alertaTitulo}>{alerta.titulo}</Text>
                        <Text style={styles.alertaDescripcion}>{alerta.descripcion}</Text>
                      </View>

                      <View style={[styles.badgePrioridad, estilos.badge]}>
                        <Text style={[styles.badgeTexto, estilos.texto]}>
                          {alerta.prioridad}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.alertaDetalle}>{alerta.detalle}</Text>

                    <View style={styles.alertaFooter}>
                      <View style={styles.tipoBadge}>
                        <Text style={styles.tipoBadgeTexto}>{alerta.tipo}</Text>
                      </View>

                      <Pressable
                        style={styles.botonAccion}
                        onPress={() => router.push(alerta.ruta as any)}
                      >
                        <Text style={styles.textoAccion}>{alerta.accion}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footerTabla}>
          <Text style={styles.footerTexto}>
            Mostrando {alertasFiltradas.length} de {alertas.length} alertas
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
  tarjetaIconoNaranja: {
    color: '#f58220',
    borderWidth: 3,
    borderColor: '#f58220',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 26,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  tarjetaLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  tarjetaNumero: {
    color: '#0f4f24',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaNumeroRojo: {
    color: '#c62828',
    fontSize: 30,
    fontWeight: 'bold',
  },
  tarjetaNumeroNaranja: {
    color: '#f58220',
    fontSize: 30,
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
  listaAlertas: {
    gap: 14,
  },
  alertaCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  alertaRoja: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
  alertaNaranja: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffcc80',
  },
  alertaAzul: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  alertaIconoCaja: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaIcono: {
    fontSize: 28,
  },
  alertaContenido: {
    flex: 1,
  },
  alertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertaTitulo: {
    color: '#0f4f24',
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertaDescripcion: {
    color: '#333',
    marginTop: 4,
  },
  alertaDetalle: {
    color: '#666',
    marginTop: 8,
  },
  badgePrioridad: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeRojo: {
    backgroundColor: '#ffcdd2',
  },
  badgeNaranja: {
    backgroundColor: '#ffe0b2',
  },
  badgeAzul: {
    backgroundColor: '#bbdefb',
  },
  badgeTexto: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  textoRojo: {
    color: '#c62828',
  },
  textoNaranja: {
    color: '#e65100',
  },
  textoAzul: {
    color: '#1565c0',
  },
  alertaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  tipoBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tipoBadgeTexto: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botonAccion: {
    backgroundColor: '#0f4f24',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  textoAccion: {
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