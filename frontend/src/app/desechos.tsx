import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function DesechosScreen() {
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [desechos, setDesechos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('Producto dañado');
  const [observacion, setObservacion] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  const motivos = [
    'Producto dañado',
    'Producto vencido',
    'Producto golpeado',
    'Producto podrido',
    'Merma natural',
    'Otro',
  ];

  useEffect(() => {
    cargarDatos();
    // La carga inicial solo debe ejecutarse al montar la pantalla.
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

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuestaDesechos = await api.get('/desechos');

      const datosDesechos = Array.isArray(respuestaDesechos.data)
        ? respuestaDesechos.data
        : respuestaDesechos.data?.desechos ||
          respuestaDesechos.data?.registros ||
          [];

      setDesechos(datosDesechos);

      try {
        const respuestaProductos = await api.get('/productos');

        const datosProductos = Array.isArray(respuestaProductos.data)
          ? respuestaProductos.data
          : respuestaProductos.data?.productos || [];

        setProductos(datosProductos);
      } catch (error) {
        console.log('No se pudieron cargar productos:', error);
        setProductos([]);
      }
    } catch (error: any) {
      console.log('Error al cargar desechos:', error?.response?.data || error);
      setDesechos([]);
      mostrarMensaje('No se pudieron cargar los desechos.', 'error');
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
    return producto.id_producto || producto.id || producto.producto_id;
  };

  const obtenerNombreProducto = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerCantidadProducto = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? 0);
  };

  const obtenerPrecioCompraProducto = (producto: any) => {
    return Number(producto.precio_compra || 0);
  };

  const obtenerUnidadProducto = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerEstadoProducto = (producto: any) => {
    return String(producto.estado || 'Activo').toLowerCase();
  };

  const obtenerNombreDesecho = (desecho: any) => {
    return (
      desecho.producto ||
      desecho.nombre_producto ||
      desecho.nombre ||
      'Producto no especificado'
    );
  };

  const obtenerCantidadDesecho = (desecho: any) => {
    return Number(desecho.cantidad || 0);
  };

  const obtenerPrecioCompraDesecho = (desecho: any) => {
    return Number(desecho.precio_compra || desecho.precio_unitario || 0);
  };

  const obtenerPerdidaDesecho = (desecho: any) => {
    const perdida = Number(desecho.perdida_total || desecho.total_perdida || 0);

    if (perdida > 0) {
      return perdida;
    }

    return obtenerCantidadDesecho(desecho) * obtenerPrecioCompraDesecho(desecho);
  };

  const obtenerMotivoDesecho = (desecho: any) => {
    return desecho.motivo || desecho.razon || 'Sin motivo';
  };

  const obtenerFechaDesecho = (desecho: any) => {
    return desecho.fecha_desecho || desecho.fecha || desecho.created_at;
  };

  const limpiarFormulario = () => {
    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setCantidad('');
    setMotivo('Producto dañado');
    setObservacion('');
  };

  const abrirFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(false);
  };

  const perdidaCalculada = productoSeleccionado
    ? Number(cantidad || 0) * obtenerPrecioCompraProducto(productoSeleccionado)
    : 0;

  const productosFiltrados = productos
    .filter((producto) => {
      const texto = busquedaProducto.toLowerCase();
      const cantidadDisponible = obtenerCantidadProducto(producto);
      const estado = obtenerEstadoProducto(producto);

      return (
        obtenerNombreProducto(producto).toLowerCase().includes(texto) &&
        cantidadDisponible > 0 &&
        estado !== 'inactivo'
      );
    })
    .slice(0, 12);

  const desechosFiltrados = desechos.filter((desecho) => {
    const texto = busqueda.toLowerCase();

    return (
      obtenerNombreDesecho(desecho).toLowerCase().includes(texto) ||
      obtenerMotivoDesecho(desecho).toLowerCase().includes(texto) ||
      String(desecho.observacion || '').toLowerCase().includes(texto)
    );
  });

  const registrarDesecho = async () => {
    if (!productoSeleccionado) {
      mostrarMensaje('Debe seleccionar un producto.', 'error', true);
      return;
    }

    if (!cantidad || Number(cantidad) <= 0 || Number.isNaN(Number(cantidad))) {
      mostrarMensaje('Debe ingresar una cantidad válida.', 'error', true);
      return;
    }

    const cantidadNumero = Number(cantidad);
    const cantidadDisponible = obtenerCantidadProducto(productoSeleccionado);

    if (cantidadNumero > cantidadDisponible) {
      mostrarMensaje(
        `La cantidad de desecho no puede ser mayor al inventario disponible (${cantidadDisponible}).`,
        'error',
        true
      );
      return;
    }

    try {
      setGuardando(true);
      mostrarMensaje('Registrando desecho...', 'info');

      const idProducto = obtenerIdProducto(productoSeleccionado);
      const nombreProducto = obtenerNombreProducto(productoSeleccionado);
      const precioCompra = obtenerPrecioCompraProducto(productoSeleccionado);
      const perdidaTotal = cantidadNumero * precioCompra;

      await api.post('/desechos', {
        id_producto: idProducto,
        producto_id: idProducto,
        producto: nombreProducto,
        nombre_producto: nombreProducto,
        cantidad: cantidadNumero,
        precio_compra: precioCompra,
        perdida_total: perdidaTotal,
        total_perdida: perdidaTotal,
        motivo,
        observacion: observacion.trim(),
        fecha_desecho: new Date().toISOString(),
        estado: 'Registrado',
      });

      mostrarMensaje('Desecho registrado correctamente.', 'ok', true);

      cerrarFormulario();
      await cargarDatos();
    } catch (error: any) {
      console.log('Error al registrar desecho:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          'No se pudo registrar el desecho.',
        'error',
        true
      );
    } finally {
      setGuardando(false);
    }
  };

  const totalDesechos = desechos.length;

  const perdidaTotal = desechos.reduce((total, desecho) => {
    return total + obtenerPerdidaDesecho(desecho);
  }, 0);

  const cantidadTotalDesechada = desechos.reduce((total, desecho) => {
    return total + obtenerCantidadDesecho(desecho);
  }, 0);

  const hoy = new Date().toISOString().slice(0, 10);

  const desechosHoy = desechos.filter((desecho) => {
    const fecha = obtenerFechaDesecho(desecho);

    if (!fecha) return false;

    return new Date(fecha).toISOString().slice(0, 10) === hoy;
  });

  return (
    <AdminLayout
      titulo="Desechos"
      subtitulo="Registro de productos dañados, vencidos o dados de baja"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Control de desechos 🗑️</Text>
          <Text style={styles.subtitulo}>
            Registre pérdidas para mejorar el control del inventario.
          </Text>
        </View>

        <Pressable style={styles.botonAgregar} onPress={abrirFormulario}>
          <Text style={styles.textoAgregar}>＋ Registrar desecho</Text>
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
          <Text style={styles.tarjetaIcono}>🗑️</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Registros</Text>
            <Text style={styles.tarjetaNumero}>{totalDesechos}</Text>
            <Text style={styles.tarjetaDetalle}>Desechos guardados</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>₡</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Pérdida total</Text>
            <Text style={styles.tarjetaNumeroRojo}>
              {formatoColones(perdidaTotal)}
            </Text>
            <Text style={styles.tarjetaDetalle}>Monto acumulado</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoNaranja}>⚠</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Cantidad desechada</Text>
            <Text style={styles.tarjetaNumeroNaranja}>{cantidadTotalDesechada}</Text>
            <Text style={styles.tarjetaDetalle}>Unidades/kg registrados</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>☀</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Desechos de hoy</Text>
            <Text style={styles.tarjetaNumero}>{desechosHoy.length}</Text>
            <Text style={styles.tarjetaDetalle}>Registrados hoy</Text>
          </View>
        </View>
      </View>

      {mostrarFormulario && (
        <View style={styles.formularioCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitulo}>Registrar desecho</Text>
              <Text style={styles.formSubtitulo}>
                Seleccione el producto y la cantidad que se va a dar de baja.
              </Text>
            </View>

            <Pressable style={styles.botonCerrar} onPress={cerrarFormulario}>
              <Text style={styles.textoCerrar}>Cerrar</Text>
            </Pressable>
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
              {productosFiltrados.length === 0 ? (
                <Text style={styles.sinProductosTexto}>
                  No hay productos disponibles.
                </Text>
              ) : (
                productosFiltrados.map((producto, index) => {
                  const seleccionado =
                    obtenerIdProducto(producto) ===
                    obtenerIdProducto(productoSeleccionado || {});

                  return (
                    <Pressable
                      key={obtenerIdProducto(producto) || index}
                      style={[
                        styles.productoOpcion,
                        seleccionado && styles.productoOpcionActiva,
                      ]}
                      onPress={() => setProductoSeleccionado(producto)}
                      disabled={guardando}
                    >
                      <Text
                        style={[
                          styles.productoOpcionNombre,
                          seleccionado && styles.productoOpcionNombreActivo,
                        ]}
                        numberOfLines={1}
                      >
                        {obtenerNombreProducto(producto)}
                      </Text>

                      <Text
                        style={[
                          styles.productoOpcionDetalle,
                          seleccionado && styles.productoOpcionDetalleActivo,
                        ]}
                      >
                        Disponible: {obtenerCantidadProducto(producto)}{' '}
                        {obtenerUnidadProducto(producto)}
                      </Text>

                      <Text
                        style={[
                          styles.productoOpcionDetalle,
                          seleccionado && styles.productoOpcionDetalleActivo,
                        ]}
                      >
                        Compra: {formatoColones(obtenerPrecioCompraProducto(producto))}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>

          <View style={styles.filaDoble}>
            <View style={styles.campo}>
              <Text style={styles.label}>Cantidad a desechar</Text>
              <TextInput
                style={styles.input}
                placeholder="Ejemplo: 2"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                editable={!guardando}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Pérdida calculada</Text>
              <View style={styles.totalCalculado}>
                <Text style={styles.totalCalculadoTexto}>
                  {formatoColones(perdidaCalculada)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Motivo</Text>
          <ScrollView horizontal={!esTelefono} showsHorizontalScrollIndicator={false}>
            <View style={[styles.motivosFila, esTelefono && styles.opcionesTelefono]}>
              {motivos.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.motivoBoton,
                    motivo === item && styles.motivoBotonActivo,
                  ]}
                  onPress={() => setMotivo(item)}
                  disabled={guardando}
                >
                  <Text
                    style={[
                      styles.motivoTexto,
                      motivo === item && styles.motivoTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Observación</Text>
          <TextInput
            style={styles.inputMultilinea}
            placeholder="Ejemplo: Producto dañado durante almacenamiento."
            value={observacion}
            onChangeText={setObservacion}
            multiline
            editable={!guardando}
          />

          <View style={styles.botonesFila}>
            <Pressable
              style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
              onPress={registrarDesecho}
              disabled={guardando}
            >
              <Text style={styles.textoGuardar}>
                {guardando ? 'Registrando...' : 'Guardar desecho'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.botonCancelar}
              onPress={cerrarFormulario}
              disabled={guardando}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={[styles.filtrosFila, esTelefono && styles.filtrosTelefono]}>
          <TextInput
            style={styles.inputBuscar}
            placeholder="Buscar por producto, motivo u observación..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <Pressable style={styles.botonActualizar} onPress={cargarDatos}>
            <Text style={styles.textoActualizar}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colProducto]}>Producto</Text>
          <Text style={[styles.th, styles.colCantidad]}>Cantidad</Text>
          <Text style={[styles.th, styles.colPrecio]}>Precio compra</Text>
          <Text style={[styles.th, styles.colPerdida]}>Pérdida</Text>
          <Text style={[styles.th, styles.colMotivo]}>Motivo</Text>
          <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
        </View>

        {cargando ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Cargando desechos...</Text>
          </View>
        ) : desechosFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>🗑️</Text>
            <Text style={styles.vacioTitulo}>No hay desechos para mostrar</Text>
            <Text style={styles.vacioTexto}>
              Registre un desecho o revise la búsqueda.
            </Text>
          </View>
        ) : (
          desechosFiltrados.map((desecho, index) => (
            <View
              key={desecho.id_desecho || desecho.id || index}
              style={styles.tablaRow}
            >
              <View style={[styles.colProducto, styles.productoInfo]}>
                <View style={styles.avatarDesecho}>
                  <Text style={styles.avatarTexto}>🗑️</Text>
                </View>

                <View style={styles.nombreArea}>
                  <Text style={styles.nombreProducto} numberOfLines={1}>
                    {obtenerNombreDesecho(desecho)}
                  </Text>

                  <Text style={styles.observacionTexto} numberOfLines={1}>
                    {desecho.observacion || 'Sin observación'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.tdCentro, styles.colCantidad]}>
                {obtenerCantidadDesecho(desecho)}
              </Text>

              <Text style={[styles.tdCentro, styles.colPrecio]}>
                {formatoColones(obtenerPrecioCompraDesecho(desecho))}
              </Text>

              <Text style={[styles.tdPerdida, styles.colPerdida]}>
                {formatoColones(obtenerPerdidaDesecho(desecho))}
              </Text>

              <View style={styles.colMotivo}>
                <View style={styles.motivoBadge}>
                  <Text style={styles.motivoBadgeTexto}>
                    {obtenerMotivoDesecho(desecho)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.tdCentro, styles.colFecha]}>
                {formatoFecha(obtenerFechaDesecho(desecho))}
              </Text>
            </View>
          ))
        )}

        <View style={styles.footerTabla}>
          <Text style={styles.footerTexto}>
            Mostrando {desechosFiltrados.length} de {desechos.length} registros
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
  tarjetaIconoRojo: {
    color: '#c62828',
    borderWidth: 3,
    borderColor: '#c62828',
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  tarjetaNumeroRojo: {
    color: '#c62828',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tarjetaNumeroNaranja: {
    color: '#f58220',
    fontSize: 28,
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
    minHeight: 75,
  },
  productosFila: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingBottom: 8,
  },
  productoOpcion: {
    width: 210,
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 13,
  },
  productoOpcionActiva: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  productoOpcionNombre: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  productoOpcionNombreActivo: {
    color: '#ffffff',
  },
  productoOpcionDetalle: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
  productoOpcionDetalleActivo: {
    color: '#e8f5e9',
  },
  sinProductosTexto: {
    color: '#777',
    fontWeight: 'bold',
    padding: 12,
  },
  filaDoble: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  campo: {
    flex: 1,
  },
  totalCalculado: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 14,
    padding: 14,
  },
  totalCalculadoTexto: {
    color: '#0f4f24',
    fontWeight: 'bold',
    fontSize: 18,
  },
  motivosFila: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  motivoBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  motivoBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  motivoTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  motivoTextoActivo: {
    color: '#ffffff',
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
  botonCancelar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c62828',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  textoCancelar: {
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
  tdCentro: {
    color: '#333',
    fontSize: 13,
    textAlign: 'center',
  },
  tdPerdida: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colProducto: {
    flex: 2,
  },
  colCantidad: {
    flex: 1,
    textAlign: 'center',
  },
  colPrecio: {
    flex: 1.2,
    textAlign: 'center',
  },
  colPerdida: {
    flex: 1.2,
    textAlign: 'center',
  },
  colMotivo: {
    flex: 1.4,
    alignItems: 'center',
  },
  colFecha: {
    flex: 1,
    textAlign: 'center',
  },
  productoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarDesecho: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 20,
  },
  nombreArea: {
    flex: 1,
  },
  nombreProducto: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  observacionTexto: {
    color: '#777',
    fontSize: 12,
    marginTop: 3,
  },
  motivoBadge: {
    backgroundColor: '#fff3e0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  motivoBadgeTexto: {
    color: '#e65100',
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
