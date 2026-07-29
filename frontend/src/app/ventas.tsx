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
import { useRouter } from 'expo-router';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import { obtenerCategoriaProducto as inferirCategoriaProducto } from '../utils/productos';

export default function VentasScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;

  const [ventas, setVentas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [cliente, setCliente] = useState('Cliente general');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observacion, setObservacion] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  const metodosPago = ['Efectivo', 'SINPE Móvil', 'Tarjeta', 'Transferencia'];

  useEffect(() => {
    cargarDatos();
    // La pantalla controla manualmente cuándo refrescar sus datos.
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

  const extraerLista = (data: any, claves: string[]) => {
    if (Array.isArray(data)) return data;

    for (const clave of claves) {
      if (Array.isArray(data?.[clave])) {
        return data[clave];
      }
    }

    if (Array.isArray(data?.data)) return data.data;

    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const [respuestaVentas, respuestaProductos] = await Promise.allSettled([
        api.get('/ventas'),
        api.get('/productos'),
      ]);

      if (respuestaVentas.status === 'fulfilled') {
        const datosVentas = extraerLista(respuestaVentas.value.data, [
          'ventas',
          'facturas',
        ]);

        setVentas(datosVentas);
      } else {
        console.log(
          'No se pudieron cargar ventas:',
          respuestaVentas.reason?.response?.data || respuestaVentas.reason
        );

        setVentas([]);
      }

      if (respuestaProductos.status === 'fulfilled') {
        const datosProductos = extraerLista(respuestaProductos.value.data, [
          'productos',
        ]);

        setProductos(datosProductos);
      } else {
        console.log(
          'No se pudieron cargar productos:',
          respuestaProductos.reason?.response?.data || respuestaProductos.reason
        );

        setProductos([]);
        mostrarMensaje('No se pudieron cargar los productos.', 'error', true);
      }
    } catch (error: any) {
      console.log('Error general al cargar datos:', error?.response?.data || error);
      mostrarMensaje('No se pudieron cargar los datos.', 'error', true);
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

  const obtenerIdProducto = (producto: any) => {
    return Number(producto.id_producto || producto.id || producto.producto_id || 0);
  };

  const obtenerNombreProducto = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerCategoriaProducto = (producto: any) => {
    return inferirCategoriaProducto(producto);
  };

  const obtenerCantidadProducto = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? producto.existencia ?? 0);
  };

  const obtenerPrecioProducto = (producto: any) => {
    return Number(producto.precio_venta || producto.precio || producto.precio_unitario || 0);
  };

  const obtenerUnidadProducto = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerFactura = (venta: any) => {
    const idVenta = venta.id_venta || venta.id || venta.id_factura || '';

    return (
      venta.numero_factura ||
      venta.factura ||
      venta.consecutivo ||
      `FAC-${String(idVenta).padStart(6, '0')}`
    );
  };

  const obtenerClienteVenta = (venta: any) => {
    return venta.cliente || venta.nombre_cliente || venta.nombre || 'Cliente general';
  };

  const obtenerMetodoVenta = (venta: any) => {
    return venta.metodo_pago || venta.metodo || 'Efectivo';
  };

  const obtenerTotalVenta = (venta: any) => {
    return Number(venta.total || venta.monto_total || venta.total_venta || 0);
  };

  const obtenerFechaVenta = (venta: any) => {
    return venta.fecha_venta || venta.fecha || venta.created_at || venta.fecha_creacion;
  };

  const productosDisponibles = productos.filter((producto) => {
    const texto = busquedaProducto.trim().toLowerCase();
    const estado = String(producto.estado || 'Activo').toLowerCase();
    const cantidad = obtenerCantidadProducto(producto);

    const coincideBusqueda =
      texto === '' ||
      obtenerNombreProducto(producto).toLowerCase().includes(texto) ||
      obtenerCategoriaProducto(producto).toLowerCase().includes(texto);

    return estado !== 'inactivo' && cantidad > 0 && coincideBusqueda;
  });

  const ventasFiltradas = ventas.filter((venta) => {
    const texto = busquedaVenta.toLowerCase();

    return (
      obtenerFactura(venta).toLowerCase().includes(texto) ||
      obtenerClienteVenta(venta).toLowerCase().includes(texto) ||
      obtenerMetodoVenta(venta).toLowerCase().includes(texto)
    );
  });

  const totalCarrito = carrito.reduce((total, item) => {
    return total + Number(item.subtotal || 0);
  }, 0);

  const totalVendido = ventas.reduce((total, venta) => {
    return total + obtenerTotalVenta(venta);
  }, 0);

  const agregarProducto = (producto: any) => {
    const idProducto = obtenerIdProducto(producto);
    const nombreProducto = obtenerNombreProducto(producto);
    const precio = obtenerPrecioProducto(producto);
    const disponible = obtenerCantidadProducto(producto);
    const unidad = obtenerUnidadProducto(producto);

    if (!idProducto) {
      mostrarMensaje('Este producto no tiene ID válido.', 'error', true);
      return;
    }

    if (precio <= 0) {
      mostrarMensaje(`El producto ${nombreProducto} no tiene precio de venta válido.`, 'error', true);
      return;
    }

    if (disponible <= 0) {
      mostrarMensaje(`El producto ${nombreProducto} no tiene inventario disponible.`, 'error', true);
      return;
    }

    setCarrito((actual) => {
      const existe = actual.find((item) => item.id_producto === idProducto);

      if (existe) {
        const nuevaCantidad = Number(existe.cantidad) + 1;

        if (nuevaCantidad > disponible) {
          mostrarMensaje(`No hay más inventario disponible para ${nombreProducto}.`, 'error', true);
          return actual;
        }

        return actual.map((item) =>
          item.id_producto === idProducto
            ? {
                ...item,
                cantidad: nuevaCantidad,
                subtotal: nuevaCantidad * item.precio_unitario,
              }
            : item
        );
      }

      return [
        ...actual,
        {
          id_producto: idProducto,
          nombre: nombreProducto,
          producto: nombreProducto,
          nombre_producto: nombreProducto,
          precio_unitario: precio,
          cantidad: 1,
          subtotal: precio,
          disponible,
          unidad_medida: unidad,
        },
      ];
    });

    mostrarMensaje(`${nombreProducto} agregado a la venta.`, 'ok');
  };

  const cambiarCantidad = (idProducto: number, valor: string) => {
    const cantidadNueva = Number(valor.replace(',', '.'));

    if (Number.isNaN(cantidadNueva) || cantidadNueva < 0) {
      return;
    }

    setCarrito((actual) =>
      actual.map((item) => {
        if (item.id_producto !== idProducto) {
          return item;
        }

        const cantidadFinal =
          cantidadNueva > item.disponible ? item.disponible : cantidadNueva;

        return {
          ...item,
          cantidad: cantidadFinal,
          subtotal: cantidadFinal * item.precio_unitario,
        };
      })
    );
  };

  const quitarProducto = (idProducto: number) => {
    setCarrito((actual) => actual.filter((item) => item.id_producto !== idProducto));
  };

  const limpiarVenta = () => {
    setCarrito([]);
    setCliente('Cliente general');
    setMetodoPago('Efectivo');
    setObservacion('');
    setBusquedaProducto('');
  };

  const cerrarFormulario = () => {
    limpiarVenta();
    setMostrarFormulario(false);
  };

  const registrarVenta = async () => {
    const clienteLimpio = cliente.trim() || 'Cliente general';

    if (carrito.length === 0) {
      mostrarMensaje('Debe agregar al menos un producto a la venta.', 'error', true);
      return;
    }

    const productoCantidadCero = carrito.find((item) => Number(item.cantidad) <= 0);

    if (productoCantidadCero) {
      mostrarMensaje('Todos los productos deben tener una cantidad mayor a cero.', 'error', true);
      return;
    }

    const productoSinStock = carrito.find(
      (item) => Number(item.cantidad) > Number(item.disponible)
    );

    if (productoSinStock) {
      mostrarMensaje(
        `La cantidad de ${productoSinStock.nombre} supera el inventario disponible.`,
        'error',
        true
      );
      return;
    }

    try {
      setGuardando(true);
      mostrarMensaje('Registrando venta y generando factura...', 'info');

      const datosVenta = {
        cliente: clienteLimpio,
        metodo_pago: metodoPago,
        observacion: observacion.trim(),
        productos: carrito.map((item) => ({
          id_producto: item.id_producto,
          producto: item.nombre,
          nombre_producto: item.nombre,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          subtotal: Number(item.subtotal),
          unidad_medida: item.unidad_medida,
        })),
      };

      const respuesta = await api.post('/ventas', datosVenta);

      const numeroFactura =
        respuesta.data?.numero_factura ||
        respuesta.data?.factura ||
        'factura generada';

      mostrarMensaje(
        `Venta registrada correctamente. Factura: ${numeroFactura}`,
        'ok',
        true
      );

      limpiarVenta();
      setMostrarFormulario(false);

      await cargarDatos();
    } catch (error: any) {
      console.log('Error al registrar venta:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          'No se pudo registrar la venta.',
        'error',
        true
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout
      titulo="Ventas"
      subtitulo="Registro manual de ventas, facturas y control de historial"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Ventas manuales 📈</Text>
          <Text style={styles.subtitulo}>
            Registre ventas realizadas directamente por el administrador.
          </Text>
        </View>

        <Pressable
          style={styles.botonAgregar}
          onPress={() => setMostrarFormulario(true)}
        >
          <Text style={styles.textoAgregar}>＋ Registrar venta</Text>
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
          <Text style={styles.tarjetaIcono}>🧾</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Ventas registradas</Text>
            <Text style={styles.tarjetaNumero}>{ventas.length}</Text>
            <Text style={styles.tarjetaDetalle}>Historial de ventas</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>₡</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Total vendido</Text>
            <Text style={styles.tarjetaNumero}>{formatoColones(totalVendido)}</Text>
            <Text style={styles.tarjetaDetalle}>Monto acumulado</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>📦</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Productos disponibles</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{productosDisponibles.length}</Text>
            <Text style={styles.tarjetaDetalle}>Para vender</Text>
          </View>
        </View>
      </View>

      {mostrarFormulario && (
        <View style={styles.formularioCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitulo}>Registrar nueva venta</Text>
              <Text style={styles.formSubtitulo}>
                Seleccione productos, cantidades y método de pago.
              </Text>
            </View>

            <Pressable style={styles.botonCerrar} onPress={cerrarFormulario}>
              <Text style={styles.textoCerrar}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={styles.filaDoble}>
            <View style={styles.campo}>
              <Text style={styles.label}>Cliente</Text>
              <TextInput
                style={styles.input}
                placeholder="Cliente general"
                value={cliente}
                onChangeText={setCliente}
                editable={!guardando}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Método de pago</Text>

              <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
                <View style={[styles.metodosFila, esTelefono && styles.opcionesTelefono]}>
                  {metodosPago.map((metodo) => (
                    <Pressable
                      key={metodo}
                      style={[
                        styles.metodoBoton,
                        metodoPago === metodo && styles.metodoBotonActivo,
                      ]}
                      onPress={() => setMetodoPago(metodo)}
                      disabled={guardando}
                    >
                      <Text
                        style={[
                          styles.metodoTexto,
                          metodoPago === metodo && styles.metodoTextoActivo,
                        ]}
                      >
                        {metodo}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text style={styles.label}>Buscar producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Escriba el nombre del producto..."
            value={busquedaProducto}
            onChangeText={setBusquedaProducto}
            editable={!guardando}
          />

          <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
            <View style={[styles.productosFila, esTelefono && styles.opcionesTelefono]}>
              {productosDisponibles.length === 0 ? (
                <Text style={styles.sinProductosTexto}>
                  No hay productos disponibles para vender.
                </Text>
              ) : (
                productosDisponibles.slice(0, 30).map((producto, index) => (
                  <Pressable
                    key={obtenerIdProducto(producto) || index}
                    style={styles.productoCard}
                    onPress={() => agregarProducto(producto)}
                    disabled={guardando}
                  >
                    <Text style={styles.productoNombre} numberOfLines={1}>
                      {obtenerNombreProducto(producto)}
                    </Text>

                    <Text style={styles.productoDetalle}>
                      Disponible: {obtenerCantidadProducto(producto)} {obtenerUnidadProducto(producto)}
                    </Text>

                    <Text style={styles.productoPrecio}>
                      {formatoColones(obtenerPrecioProducto(producto))}
                    </Text>

                    <Text style={styles.productoAgregar}>Agregar</Text>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>

          <View style={styles.carritoCard}>
            <Text style={styles.carritoTitulo}>Productos de la venta</Text>

            {carrito.length === 0 ? (
              <View style={styles.carritoVacio}>
                <Text style={styles.carritoVacioTexto}>
                  Todavía no hay productos agregados.
                </Text>
              </View>
            ) : (
              carrito.map((item) => (
                <View key={item.id_producto} style={styles.carritoItem}>
                  <View style={styles.carritoInfo}>
                    <Text style={styles.carritoNombre}>{item.nombre}</Text>
                    <Text style={styles.carritoDetalle}>
                      Precio: {formatoColones(item.precio_unitario)} · Disponible: {item.disponible} {item.unidad_medida}
                    </Text>
                  </View>

                  <TextInput
                    style={styles.inputCantidad}
                    value={String(item.cantidad)}
                    onChangeText={(valor) => cambiarCantidad(item.id_producto, valor)}
                    keyboardType="numeric"
                    editable={!guardando}
                  />

                  <Text style={styles.carritoSubtotal}>
                    {formatoColones(item.subtotal)}
                  </Text>

                  <Pressable
                    style={styles.botonQuitar}
                    onPress={() => quitarProducto(item.id_producto)}
                    disabled={guardando}
                  >
                    <Text style={styles.textoQuitar}>X</Text>
                  </Pressable>
                </View>
              ))
            )}

            <View style={styles.totalCaja}>
              <Text style={styles.totalLabel}>Total de la venta</Text>
              <Text style={styles.totalValor}>{formatoColones(totalCarrito)}</Text>
            </View>
          </View>

          <Text style={styles.label}>Observación</Text>
          <TextInput
            style={styles.inputMultilinea}
            placeholder="Observación opcional de la venta..."
            value={observacion}
            onChangeText={setObservacion}
            multiline
            editable={!guardando}
          />

          <View style={styles.botonesFila}>
            <Pressable
              style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
              onPress={registrarVenta}
              disabled={guardando}
            >
              <Text style={styles.textoGuardar}>
                {guardando ? 'Registrando venta...' : 'Guardar venta y generar factura'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.botonLimpiar}
              onPress={limpiarVenta}
              disabled={guardando}
            >
              <Text style={styles.textoLimpiar}>Limpiar</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={[styles.filtrosFila, esTelefono && styles.filtrosTelefono]}>
          <TextInput
            style={styles.inputBuscar}
            placeholder="Buscar venta por factura, cliente o método de pago..."
            value={busquedaVenta}
            onChangeText={setBusquedaVenta}
          />

          <Pressable style={styles.botonActualizar} onPress={cargarDatos}>
            <Text style={styles.textoActualizar}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.botonHistorial}
            onPress={() => router.push('/historial-ventas' as any)}
          >
            <Text style={styles.textoHistorial}>Ver historial</Text>
          </Pressable>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colFactura]}>Factura</Text>
          <Text style={[styles.th, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
          <Text style={[styles.th, styles.colPago]}>Pago</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
        </View>

        {cargando ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Cargando ventas...</Text>
          </View>
        ) : ventasFiltradas.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>🧾</Text>
            <Text style={styles.vacioTitulo}>No hay ventas para mostrar</Text>
            <Text style={styles.vacioTexto}>
              Registre una venta manual para verla en esta tabla.
            </Text>
          </View>
        ) : (
          ventasFiltradas.map((venta, index) => (
            <View key={venta.id_venta || venta.id || index} style={styles.tablaRow}>
              <Text style={[styles.tdFactura, styles.colFactura]}>
                {obtenerFactura(venta)}
              </Text>

              <Text style={[styles.td, styles.colCliente]} numberOfLines={1}>
                {obtenerClienteVenta(venta)}
              </Text>

              <Text style={[styles.tdCentro, styles.colFecha]}>
                {formatoFecha(obtenerFechaVenta(venta))}
              </Text>

              <Text style={[styles.tdCentro, styles.colPago]}>
                {obtenerMetodoVenta(venta)}
              </Text>

              <Text style={[styles.tdTotal, styles.colTotal]}>
                {formatoColones(obtenerTotalVenta(venta))}
              </Text>

              <View style={styles.colEstado}>
                <View style={[styles.estadoBadge, esTelefono && styles.estadoBadgeTelefono]}>
                  <View style={styles.puntoVerde} />
                  <Text style={styles.estadoTexto}>
                    {venta.estado || 'Completada'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.footerTabla}>
          <Text style={styles.footerTexto}>
            Mostrando {ventasFiltradas.length} de {ventas.length} ventas
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
  opcionesTelefono: {
    flexWrap: 'wrap',
  },
  botonAgregar: {
    backgroundColor: '#7bb51e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  textoAgregar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
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
    minWidth: 220,
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
    fontSize: 23,
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
  tarjetaDetalle: {
    color: '#777',
    fontSize: 12,
  },
  formularioCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitulo: {
    color: '#1b5e20',
    fontSize: 25,
    fontWeight: 'bold',
  },
  formSubtitulo: {
    color: '#666',
    marginTop: 4,
  },
  botonCerrar: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  textoCerrar: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  filaDoble: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  campo: {
    flex: 1,
  },
  label: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
  },
  inputMultilinea: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 72,
  },
  metodosFila: {
    flexDirection: 'row',
    gap: 10,
  },
  metodoBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  metodoBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  metodoTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  metodoTextoActivo: {
    color: '#ffffff',
  },
  productosFila: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingBottom: 8,
  },
  productoCard: {
    width: 210,
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 16,
    padding: 14,
  },
  productoNombre: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productoDetalle: {
    color: '#555',
    fontSize: 12,
    marginTop: 5,
  },
  productoPrecio: {
    color: '#f58220',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 8,
  },
  productoAgregar: {
    color: '#ffffff',
    backgroundColor: '#0f4f24',
    textAlign: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    fontWeight: 'bold',
  },
  sinProductosTexto: {
    color: '#777',
    fontWeight: 'bold',
    padding: 12,
  },
  carritoCard: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  carritoTitulo: {
    color: '#0f4f24',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  carritoVacio: {
    padding: 20,
    alignItems: 'center',
  },
  carritoVacioTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
  carritoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  carritoInfo: {
    flex: 1,
  },
  carritoNombre: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  carritoDetalle: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  inputCantidad: {
    width: 80,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 12,
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  carritoSubtotal: {
    width: 120,
    color: '#0f4f24',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  botonQuitar: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoQuitar: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  totalCaja: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  totalLabel: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  totalValor: {
    color: '#0f4f24',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 4,
  },
  botonesFila: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: '#f58220',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  botonDesactivado: {
    backgroundColor: '#9e9e9e',
  },
  textoGuardar: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  botonLimpiar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c62828',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  textoLimpiar: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  filtrosFila: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  inputBuscar: {
    flex: 1,
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
  },
  botonActualizar: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: 'center',
  },
  textoActualizar: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonHistorial: {
    backgroundColor: '#0f4f24',
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: 'center',
  },
  textoHistorial: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingVertical: 12,
  },
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0eadb',
    paddingVertical: 14,
  },
  th: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  td: {
    color: '#333',
    fontSize: 13,
  },
  tdFactura: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tdCentro: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
  },
  tdTotal: {
    color: '#0f4f24',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colFactura: {
    flex: 1.2,
  },
  colCliente: {
    flex: 1.6,
  },
  colFecha: {
    flex: 1.1,
    textAlign: 'center',
  },
  colPago: {
    flex: 1.1,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1.2,
    textAlign: 'center',
  },
  colEstado: {
    flex: 1.2,
    alignItems: 'center',
  },
  estadoBadge: {
    backgroundColor: '#e8f5e9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  estadoBadgeTelefono: {
    gap: 3,
    paddingHorizontal: 4,
  },
  puntoVerde: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2e7d32',
  },
  estadoTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 12,
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
