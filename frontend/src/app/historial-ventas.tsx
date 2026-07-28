import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function HistorialVentasScreen() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [detalles, setDetalles] = useState<any>({});
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      setCargando(true);
      setMensaje('');
      setDetalles({});
      setVentaSeleccionada(null);

      const respuesta = await api.get('/ventas');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.ventas || respuesta.data?.facturas || [];

      setVentas(datos);
    } catch (error: any) {
      console.log('Error historial ventas:', error?.response?.data || error);
      setVentas([]);
      setMensaje('No se pudo cargar el historial de ventas.');
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

  const obtenerIdVenta = (venta: any) => {
    return venta.id_venta || venta.id || venta.id_factura || '';
  };

  const obtenerFactura = (venta: any) => {
    const idVenta = obtenerIdVenta(venta);

    return (
      venta.numero_factura ||
      venta.factura ||
      venta.consecutivo ||
      `FAC-${String(idVenta).padStart(6, '0')}`
    );
  };

  const obtenerCliente = (venta: any) => {
    return venta.cliente || venta.nombre_cliente || venta.nombre || 'Cliente general';
  };

  const obtenerMetodo = (venta: any) => {
    return venta.metodo_pago || venta.metodo || 'Efectivo';
  };

  const obtenerEstado = (venta: any) => {
    return venta.estado || 'Completada';
  };

  const obtenerFecha = (venta: any) => {
    return venta.fecha_venta || venta.fecha || venta.created_at || venta.fecha_creacion;
  };

  const obtenerTotal = (venta: any) => {
    return Number(venta.total || venta.monto_total || venta.total_venta || 0);
  };

  const cargarDetalle = async (venta: any) => {
    const idVenta = Number(obtenerIdVenta(venta));

    if (!idVenta) {
      Alert.alert('Aviso', 'No se pudo abrir la factura porque la venta no tiene ID.');
      return;
    }

    setVentaSeleccionada(venta);

    if (Array.isArray(venta.detalles) && venta.detalles.length > 0) {
      setDetalles((actual: any) => ({
        ...actual,
        [idVenta]: venta.detalles,
      }));

      return;
    }

    if (detalles[idVenta]) {
      return;
    }

    try {
      const respuesta = await api.get(`/ventas/${idVenta}`);

      const detalleVenta =
        respuesta.data?.detalles ||
        respuesta.data?.detalle ||
        respuesta.data?.productos ||
        [];

      setVentaSeleccionada(respuesta.data);

      setDetalles((actual: any) => ({
        ...actual,
        [idVenta]: Array.isArray(detalleVenta) ? detalleVenta : [],
      }));
    } catch (error: any) {
      console.log('Error detalle factura:', error?.response?.data || error);

      setDetalles((actual: any) => ({
        ...actual,
        [idVenta]: [],
      }));

      Alert.alert('Aviso', 'No se pudo cargar el detalle de la factura.');
    }
  };

  const obtenerDetalleActual = () => {
    if (!ventaSeleccionada) return [];

    const idVenta = Number(obtenerIdVenta(ventaSeleccionada));

    if (detalles[idVenta]) {
      return detalles[idVenta];
    }

    if (Array.isArray(ventaSeleccionada.detalles)) {
      return ventaSeleccionada.detalles;
    }

    return [];
  };

  const obtenerNombreProducto = (item: any) => {
    return item.nombre_producto || item.producto || item.nombre || 'Producto';
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

  const prepararPDF = () => {
    if (!ventaSeleccionada) {
      Alert.alert('Aviso', 'Primero seleccione una factura.');
      return;
    }

    const detalle = obtenerDetalleActual();

    if (detalle.length === 0) {
      Alert.alert(
        'Aviso',
        'Esta factura no tiene detalle de productos, por eso no se puede preparar el PDF.'
      );
      return;
    }

    if (typeof window === 'undefined') {
      Alert.alert('Aviso', 'La impresión de PDF está disponible desde la versión web.');
      return;
    }

    const html = generarHTMLFactura(ventaSeleccionada, detalle);
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
  };

  const generarHTMLFactura = (venta: any, detalle: any[]) => {
    const filas = detalle
      .map((item) => {
        return `
          <tr>
            <td>${limpiarHTML(obtenerNombreProducto(item))}</td>
            <td class="centro">${limpiarHTML(obtenerCantidad(item))}</td>
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
        <title>${limpiarHTML(obtenerFactura(venta))}</title>
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
            max-width: 800px;
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

          .factura-numero {
            text-align: right;
            background: #f7f2dc;
            border-radius: 14px;
            padding: 14px;
            min-width: 190px;
          }

          .factura-numero span {
            display: block;
            color: #777;
            font-weight: bold;
            font-size: 13px;
          }

          .factura-numero strong {
            display: block;
            color: #0f4f24;
            font-size: 24px;
            margin-top: 6px;
          }

          .datos {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
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
            max-width: 800px;
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

            <div class="factura-numero">
              <span>Factura</span>
              <strong>${limpiarHTML(obtenerFactura(venta))}</strong>
            </div>
          </div>

          <div class="datos">
            <div class="dato">
              <label>Cliente</label>
              <strong>${limpiarHTML(obtenerCliente(venta))}</strong>
            </div>

            <div class="dato">
              <label>Fecha</label>
              <strong>${limpiarHTML(formatoFecha(obtenerFecha(venta)))}</strong>
            </div>

            <div class="dato">
              <label>Método de pago</label>
              <strong>${limpiarHTML(obtenerMetodo(venta))}</strong>
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
              <span>Total de la factura</span>
              <strong>${limpiarHTML(formatoColones(obtenerTotal(venta)))}</strong>
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

  const metodos = [
    'Todos',
    ...Array.from(new Set(ventas.map((venta) => obtenerMetodo(venta)))),
  ];

  const ventasFiltradas = ventas.filter((venta) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      obtenerFactura(venta).toLowerCase().includes(texto) ||
      obtenerCliente(venta).toLowerCase().includes(texto) ||
      obtenerMetodo(venta).toLowerCase().includes(texto) ||
      obtenerEstado(venta).toLowerCase().includes(texto);

    const coincideMetodo =
      filtroMetodo === 'Todos' || obtenerMetodo(venta) === filtroMetodo;

    return coincideBusqueda && coincideMetodo;
  });

  const totalFacturado = ventas.reduce((total, venta) => {
    return total + obtenerTotal(venta);
  }, 0);

  const totalFacturas = ventas.length;

  const ventaMayor = ventas.reduce((mayor, venta) => {
    return obtenerTotal(venta) > obtenerTotal(mayor) ? venta : mayor;
  }, ventas[0] || {});

  const detalleActual = obtenerDetalleActual();

  return (
    <AdminLayout
      titulo="Historial de ventas"
      subtitulo="Consulta de ventas registradas y vista previa de facturas"
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.titulo}>Historial y facturas 🧾</Text>
          <Text style={styles.subtitulo}>
            Consulte las ventas realizadas y revise la información de factura.
          </Text>
        </View>

        <Pressable style={styles.botonActualizar} onPress={cargarVentas}>
          <Text style={styles.textoActualizar}>
            {cargando ? 'Actualizando...' : 'Actualizar historial'}
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
          <Text style={styles.tarjetaIcono}>🧾</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Facturas</Text>
            <Text style={styles.tarjetaNumero}>{totalFacturas}</Text>
            <Text style={styles.tarjetaDetalle}>Ventas registradas</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>₡</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Total facturado</Text>
            <Text style={styles.tarjetaNumero}>{formatoColones(totalFacturado)}</Text>
            <Text style={styles.tarjetaDetalle}>Monto acumulado</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoAzul}>#</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Venta mayor</Text>
            <Text style={styles.tarjetaNumeroAzul}>
              {formatoColones(obtenerTotal(ventaMayor))}
            </Text>
            <Text style={styles.tarjetaDetalle}>
              {ventaMayor ? obtenerFactura(ventaMayor) : 'Sin datos'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.contenido}>
        <View style={styles.listaCard}>
          <View style={styles.filtros}>
            <TextInput
              style={styles.input}
              placeholder="Buscar por factura, cliente, método o estado..."
              value={busqueda}
              onChangeText={setBusqueda}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtrosFila}>
                {metodos.map((metodo) => (
                  <Pressable
                    key={metodo}
                    style={[
                      styles.filtroBoton,
                      filtroMetodo === metodo && styles.filtroBotonActivo,
                    ]}
                    onPress={() => setFiltroMetodo(metodo)}
                  >
                    <Text
                      style={[
                        styles.filtroTexto,
                        filtroMetodo === metodo && styles.filtroTextoActivo,
                      ]}
                    >
                      {metodo}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.tablaHeader}>
            <Text style={[styles.th, styles.colFactura]}>Factura</Text>
            <Text style={[styles.th, styles.colCliente]}>Cliente</Text>
            <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
            <Text style={[styles.th, styles.colAccion]}>Acción</Text>
          </View>

          {cargando ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTexto}>Cargando historial...</Text>
            </View>
          ) : ventasFiltradas.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioIcono}>🧾</Text>
              <Text style={styles.vacioTitulo}>No hay ventas para mostrar</Text>
              <Text style={styles.vacioTexto}>
                Cuando existan ventas registradas aparecerán aquí.
              </Text>
            </View>
          ) : (
            ventasFiltradas.map((venta, index) => {
              const seleccionada =
                ventaSeleccionada &&
                obtenerIdVenta(ventaSeleccionada) === obtenerIdVenta(venta);

              return (
                <View
                  key={obtenerIdVenta(venta) || index}
                  style={[
                    styles.tablaRow,
                    seleccionada && styles.tablaRowSeleccionada,
                  ]}
                >
                  <View style={styles.colFactura}>
                    <Text style={styles.facturaTexto}>{obtenerFactura(venta)}</Text>
                    <Text style={styles.estadoTexto}>{obtenerEstado(venta)}</Text>
                  </View>

                  <Text style={[styles.td, styles.colCliente]} numberOfLines={1}>
                    {obtenerCliente(venta)}
                  </Text>

                  <View style={styles.colFecha}>
                    <Text style={styles.tdCentro}>{formatoFecha(obtenerFecha(venta))}</Text>
                    <Text style={styles.horaTexto}>{formatoHora(obtenerFecha(venta))}</Text>
                  </View>

                  <Text style={[styles.tdTotal, styles.colTotal]}>
                    {formatoColones(obtenerTotal(venta))}
                  </Text>

                  <View style={styles.colAccion}>
                    <Pressable
                      style={styles.botonVer}
                      onPress={() => cargarDetalle(venta)}
                    >
                      <Text style={styles.textoVer}>Ver factura</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.footerTabla}>
            <Text style={styles.footerTexto}>
              Mostrando {ventasFiltradas.length} de {ventas.length} ventas
            </Text>
          </View>
        </View>

        <View style={styles.facturaCard}>
          {!ventaSeleccionada ? (
            <View style={styles.facturaVacia}>
              <Text style={styles.vacioIcono}>🧾</Text>
              <Text style={styles.vacioTitulo}>Seleccione una factura</Text>
              <Text style={styles.vacioTexto}>
                Presione “Ver factura” en una venta para revisar el comprobante.
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.facturaEncabezado}>
                <View>
                  <Text style={styles.logoTexto}>VERDULERÍA</Text>
                  <Text style={styles.logoNombre}>JERUSALÉN</Text>
                  <Text style={styles.logoSubtitulo}>
                    FRUTAS · VERDURAS · JUGOS NATURALES
                  </Text>
                </View>

                <View style={styles.facturaNumeroCaja}>
                  <Text style={styles.facturaNumeroLabel}>Factura</Text>
                  <Text style={styles.facturaNumero}>
                    {obtenerFactura(ventaSeleccionada)}
                  </Text>
                </View>
              </View>

              <View style={styles.facturaInfo}>
                <View>
                  <Text style={styles.infoLabel}>Cliente</Text>
                  <Text style={styles.infoValor}>{obtenerCliente(ventaSeleccionada)}</Text>
                </View>

                <View>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValor}>
                    {formatoFecha(obtenerFecha(ventaSeleccionada))}
                  </Text>
                </View>

                <View>
                  <Text style={styles.infoLabel}>Método de pago</Text>
                  <Text style={styles.infoValor}>{obtenerMetodo(ventaSeleccionada)}</Text>
                </View>
              </View>

              <View style={styles.facturaTablaHeader}>
                <Text style={[styles.facturaTh, styles.facturaColProducto]}>Producto</Text>
                <Text style={[styles.facturaTh, styles.facturaColCantidad]}>Cant.</Text>
                <Text style={[styles.facturaTh, styles.facturaColPrecio]}>Precio</Text>
                <Text style={[styles.facturaTh, styles.facturaColSubtotal]}>Subtotal</Text>
              </View>

              {detalleActual.length === 0 ? (
                <View style={styles.facturaSinDetalle}>
                  <Text style={styles.facturaSinDetalleTexto}>
                    Esta venta no tiene detalle de productos registrado.
                  </Text>
                </View>
              ) : (
                detalleActual.map((item: any, index: number) => (
                  <View key={index} style={styles.facturaTablaRow}>
                    <Text style={[styles.facturaTd, styles.facturaColProducto]}>
                      {obtenerNombreProducto(item)}
                    </Text>

                    <Text style={[styles.facturaTdCentro, styles.facturaColCantidad]}>
                      {obtenerCantidad(item)}
                    </Text>

                    <Text style={[styles.facturaTdCentro, styles.facturaColPrecio]}>
                      {formatoColones(obtenerPrecio(item))}
                    </Text>

                    <Text style={[styles.facturaTdTotal, styles.facturaColSubtotal]}>
                      {formatoColones(obtenerSubtotal(item))}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.totalFacturaCaja}>
                <Text style={styles.totalFacturaLabel}>Total de la factura</Text>
                <Text style={styles.totalFacturaValor}>
                  {formatoColones(obtenerTotal(ventaSeleccionada))}
                </Text>
              </View>

              <View style={styles.botonesFactura}>
                <Pressable style={styles.botonImprimir} onPress={prepararPDF}>
                  <Text style={styles.textoImprimir}>Preparar PDF</Text>
                </Pressable>

                <Pressable
                  style={styles.botonCerrarFactura}
                  onPress={() => setVentaSeleccionada(null)}
                >
                  <Text style={styles.textoCerrarFactura}>Cerrar factura</Text>
                </Pressable>
              </View>
            </View>
          )}
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
    minWidth: 230,
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
  tarjetaIconoAzul: {
    color: '#1565c0',
    borderWidth: 3,
    borderColor: '#1565c0',
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 25,
    fontWeight: 'bold',
  },
  tarjetaLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  tarjetaNumero: {
    color: '#0f4f24',
    fontSize: 26,
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
  contenido: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  listaCard: {
    flex: 1.2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  facturaCard: {
    flex: 0.9,
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
  tablaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0eadb',
    paddingVertical: 14,
  },
  tablaRowSeleccionada: {
    backgroundColor: '#f7f2dc',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  colFactura: {
    flex: 1.3,
  },
  colCliente: {
    flex: 1.4,
  },
  colFecha: {
    flex: 1,
    alignItems: 'center',
  },
  colTotal: {
    flex: 1.1,
    textAlign: 'center',
  },
  colAccion: {
    flex: 1,
    alignItems: 'center',
  },
  facturaTexto: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  estadoTexto: {
    color: '#777',
    fontSize: 12,
    marginTop: 3,
  },
  td: {
    color: '#333',
    fontSize: 13,
  },
  tdCentro: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
  },
  horaTexto: {
    color: '#777',
    fontSize: 11,
    marginTop: 2,
  },
  tdTotal: {
    color: '#0f4f24',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botonVer: {
    backgroundColor: '#0f4f24',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  textoVer: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footerTabla: {
    paddingTop: 14,
  },
  footerTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
  vacio: {
    padding: 34,
    alignItems: 'center',
  },
  facturaVacia: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
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
  facturaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingBottom: 16,
    marginBottom: 16,
  },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  logoNombre: {
    color: '#0f4f24',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 31,
  },
  logoSubtitulo: {
    color: '#e07b18',
    fontSize: 8,
    fontWeight: 'bold',
  },
  facturaNumeroCaja: {
    backgroundColor: '#f7f2dc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-end',
  },
  facturaNumeroLabel: {
    color: '#777',
    fontWeight: 'bold',
    fontSize: 12,
  },
  facturaNumero: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
  },
  facturaInfo: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  infoLabel: {
    color: '#777',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoValor: {
    color: '#333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  facturaTablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingBottom: 10,
  },
  facturaTablaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0eadb',
    paddingVertical: 10,
  },
  facturaTh: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 12,
  },
  facturaTd: {
    color: '#333',
    fontSize: 12,
  },
  facturaTdCentro: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
  },
  facturaTdTotal: {
    color: '#0f4f24',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  facturaColProducto: {
    flex: 1.6,
  },
  facturaColCantidad: {
    flex: 0.7,
    textAlign: 'center',
  },
  facturaColPrecio: {
    flex: 1,
    textAlign: 'center',
  },
  facturaColSubtotal: {
    flex: 1,
    textAlign: 'right',
  },
  facturaSinDetalle: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffcc80',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  facturaSinDetalleTexto: {
    color: '#e65100',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totalFacturaCaja: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
  },
  totalFacturaLabel: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  totalFacturaValor: {
    color: '#0f4f24',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  botonesFactura: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  botonImprimir: {
    flex: 1,
    backgroundColor: '#f58220',
    padding: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoImprimir: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  botonCerrarFactura: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c62828',
    padding: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  textoCerrarFactura: {
    color: '#c62828',
    fontWeight: 'bold',
  },
});