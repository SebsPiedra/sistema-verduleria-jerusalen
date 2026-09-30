import ClientHeader from '../components/ClientHeader';
import QuantitySelector from '../components/QuantitySelector';
import { createAppStyles, useAppStyles } from '../theme/appStyles';
import { Children, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { eliminarDato, guardarDato, obtenerDato } from '../services/storage.js';
import {
  CATEGORIAS_PRODUCTOS,
  obtenerCategoriaProducto,
} from '../utils/productos';

const CARRITO_KEY = 'carrito';
const CARRITO_CLIENTE_KEY = 'carrito_cliente';
const LONGITUD_MINIMA_DIRECCION = 20;

function ContenidoPedidoResponsivo({ children, isPhone, style }: any) {
  const columnas = Children.toArray(children);

  return <View style={style}>{isPhone ? columnas.reverse() : columnas}</View>;
}

export default function ClientePedidoScreen() {
  const styles = useAppStyles(baseStyles);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;

  const [cliente, setCliente] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [tipoEntrega, setTipoEntrega] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [observacion, setObservacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');
  const [cantidadesProducto, setCantidadesProducto] = useState<Record<number, number>>({});

  useEffect(() => {
    cargarCliente();
    cargarCarrito();
    cargarProductos();
    // La sesión, el carrito y el catálogo se hidratan una vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarMensaje = (texto: string, tipo: 'ok' | 'error' | 'info' = 'info') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const cargarCliente = async () => {
    try {
      const clienteGuardado = await obtenerDato('cliente');

      if (!clienteGuardado) {
        mostrarMensaje('Debe iniciar sesión como cliente para realizar un pedido.', 'info');
        router.replace('/cliente-login' as any);
        return;
      }

      const datosCliente = JSON.parse(clienteGuardado);
      setCliente(datosCliente);
      setDireccionEntrega(datosCliente.direccion || '');
    } catch (error) {
      console.log('Error al cargar cliente:', error);
      mostrarMensaje('No se pudo cargar la información del cliente.', 'error');
    }
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const respuesta = await api.get('/productos');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.productos || [];

      setProductos(datos);
    } catch (error: any) {
      console.log('Error al cargar productos:', error?.response?.data || error);
      setProductos([]);
      mostrarMensaje('No se pudieron cargar los productos.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const guardarCarrito = async (nuevoCarrito: any[]) => {
    const carritoLimpio = nuevoCarrito.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad || 1),
      precio: Number(item.precio || 0),
      subtotal: Number(item.cantidad || 1) * Number(item.precio || 0),
    }));

    // Actualiza primero la interfaz para que los controles respondan de inmediato.
    setCarrito(carritoLimpio);

    const carritoSerializado = JSON.stringify(carritoLimpio);
    try {
      await Promise.all([
        guardarDato(CARRITO_KEY, carritoSerializado),
        guardarDato(CARRITO_CLIENTE_KEY, carritoSerializado),
      ]);
    } catch (error) {
      console.log('Error al guardar carrito:', error);
      mostrarMensaje(
        'El carrito se actualizó, pero no se pudo guardar en el dispositivo.',
        'error'
      );
    }
  };

  const borrarCarrito = async () => {
    await Promise.all([
      eliminarDato(CARRITO_KEY),
      eliminarDato(CARRITO_CLIENTE_KEY),
    ]);

    setCarrito([]);
  };

  const cargarCarrito = async () => {
    try {
      const carritoGuardado =
        (await obtenerDato(CARRITO_CLIENTE_KEY)) ||
        (await obtenerDato(CARRITO_KEY));

      if (!carritoGuardado) {
        setCarrito([]);
        return;
      }

      const datosCarrito = JSON.parse(carritoGuardado);

      if (!Array.isArray(datosCarrito)) {
        await borrarCarrito();
        return;
      }

      const carritoNormalizado = datosCarrito
          .filter((item) => item.id_producto && Number(item.cantidad || 0) > 0)
          .map((item) => ({
            id_producto: Number(item.id_producto),
            nombre: item.nombre || 'Producto',
            precio: Number(item.precio || item.precio_venta || item.precio_unitario || 0),
            cantidad: Number(item.cantidad || 1),
            subtotal:
              Number(item.cantidad || 1) *
              Number(item.precio || item.precio_venta || item.precio_unitario || 0),
            imagen_url: item.imagen_url || item.imagen || '',
            unidad_medida: item.unidad_medida || item.unidad || 'kg',
            disponible: Number(item.disponible ?? item.cantidad_disponible ?? 0),
            nota: item.nota || '',
          }));

      await guardarCarrito(carritoNormalizado);
    } catch (error) {
      console.log('Error al cargar carrito:', error);
      await borrarCarrito();
      mostrarMensaje('El carrito tenía datos dañados y fue limpiado.', 'info');
    }
  };

  const formatoColones = (valor: any) => {
    const numero = Number(valor || 0);

    return `₡${numero.toLocaleString('es-CR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const abrirPedidoEnWhatsApp = async ({
    numeroPedido,
    direccionFinal,
    productosPedido,
  }: {
    numeroPedido: number | string;
    direccionFinal: string;
    productosPedido: any[];
  }) => {
    const nombreCliente =
      cliente?.nombre ||
      cliente?.nombre_cliente ||
      cliente?.cliente ||
      'Cliente';
    const telefonoCliente = cliente?.telefono || 'No indicado';

    const detalleProductos = productosPedido
      .map(
        (item) =>
          `• ${item.nombre}: ${item.cantidad} ${item.unidad_medida} × ${formatoColones(
            item.precio
          )} = ${formatoColones(item.subtotal)}${item.nota ? `\n  Nota: ${item.nota}` : ''}`
      )
      .join('\n');

    const mensajeWhatsApp = [
      'Hola, ya realicé un pedido en Verdulería Jerusalén.',
      '',
      `*Pedido #${numeroPedido}*`,
      `Cliente: ${nombreCliente}`,
      `Teléfono: ${telefonoCliente}`,
      `Tipo de entrega: ${tipoEntrega}`,
      `Dirección: ${direccionFinal}`,
      `Método de pago: ${metodoPago}`,
      '',
      '*Productos:*',
      detalleProductos,
      '',
      `*Total: ${formatoColones(totalPedido)}*`,
      observacion.trim() ? `Observaciones: ${observacion.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const enlace = `https://wa.me/50685205023?text=${encodeURIComponent(
      mensajeWhatsApp
    )}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(enlace);
      return;
    }

    await Linking.openURL(enlace);
  };

  const obtenerNombre = (producto: any) => {
    return producto.nombre || producto.nombre_producto || producto.producto || 'Producto';
  };

  const obtenerPrecio = (producto: any) => {
    return Number(producto.precio_venta || producto.precio || producto.precio_unitario || 0);
  };

  const obtenerImagen = (producto: any) => {
    return producto.imagen_url || producto.imagen || producto.url_imagen || '';
  };

  const obtenerUnidad = (producto: any) => {
    return producto.unidad_medida || producto.unidad || 'kg';
  };

  const obtenerDisponible = (producto: any) => {
    return Number(producto.cantidad ?? producto.stock ?? producto.disponible ?? 0);
  };

  const productoActivo = (producto: any) => {
    const estado = String(producto.estado || 'Activo').toLowerCase();
    return estado !== 'inactivo';
  };

  const totalPedido = carrito.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0
  );

  const cantidadCarrito = carrito.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  const agregarProducto = async (producto: any) => {
    if (guardando) return;

    const disponible = obtenerDisponible(producto);

    if (disponible <= 0) {
      mostrarMensaje(`${obtenerNombre(producto)} está agotado.`, 'error');
      return;
    }

    const idProducto = Number(producto.id_producto || producto.id);
    const cantidadSolicitada = cantidadesProducto[idProducto] || 1;
    const copia = carrito.map(item => ({ ...item }));

    const existente = copia.find(
      (item) => Number(item.id_producto) === idProducto
    );

    if (existente) {
      if (Number(existente.cantidad) + cantidadSolicitada > disponible) {
        mostrarMensaje(`Solo quedan ${disponible} ${obtenerUnidad(producto)} de ${obtenerNombre(producto)}.`, 'error');
        return;
      }

      existente.cantidad =
        Math.round((Number(existente.cantidad) + cantidadSolicitada) * 100) / 100;
      existente.subtotal = Number(existente.cantidad) * Number(existente.precio);
      existente.disponible = disponible;
    } else {
      copia.push({
        id_producto: idProducto,
        nombre: obtenerNombre(producto),
        precio: obtenerPrecio(producto),
        cantidad: cantidadSolicitada,
        subtotal: obtenerPrecio(producto) * cantidadSolicitada,
        imagen_url: obtenerImagen(producto),
        unidad_medida: obtenerUnidad(producto),
        disponible,
        nota: '',
      });
    }

    await guardarCarrito(copia);
    mostrarMensaje(`${cantidadSolicitada} ${obtenerUnidad(producto)} de ${obtenerNombre(producto)} se agregó al carrito.`, 'ok');

  };

  const aumentarCantidad = (idProducto: any) => {
    const copia = carrito.map((item) => {
      if (Number(item.id_producto) === Number(idProducto)) {
        const productoActual = productos.find(p=>Number(p.id_producto || p.id)===Number(idProducto));
        const disponible = productoActual ? obtenerDisponible(productoActual) : Number(item.disponible ?? 0);

        if (Number(item.cantidad) + 1 > disponible) {
          mostrarMensaje(`No hay más cantidad disponible de ${item.nombre}.`, 'error');
          return item;
        }

        const nuevaCantidad = Number(item.cantidad) + 1;

        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * Number(item.precio),
        };
      }

      return item;
    });

    guardarCarrito(copia);
  };

  const disminuirCantidad = (idProducto: any) => {
    const copia = carrito
      .map((item) => {
        if (Number(item.id_producto) === Number(idProducto)) {
          const nuevaCantidad = Number(item.cantidad) - 1;

          if (nuevaCantidad <= 0) {
            return null;
          }

          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * Number(item.precio),
          };
        }

        return item;
      })
      .filter(Boolean);

    guardarCarrito(copia as any[]);
  };

  const eliminarProducto = (idProducto: any) => {
    const eliminado = carrito.find(
      (item) => Number(item.id_producto) === Number(idProducto)
    );
    const copia = carrito.filter(
      (item) => Number(item.id_producto) !== Number(idProducto)
    );

    guardarCarrito(copia);
    mostrarMensaje(`${eliminado?.nombre || 'El producto'} se eliminó del carrito.`, 'info');
  };

  const actualizarCantidad = (idProducto: any, cantidad: number) => {
    const copia = carrito.map((item) => {
      if (Number(item.id_producto) !== Number(idProducto)) return item;
      const unidad = String(item.unidad_medida || 'unidad');
      const requiereEntero = /^(unidad|unidades|bolsa|bolsas|caja|cajas|paquete|paquetes)$/i.test(
        unidad.trim()
      );
      const minimo = requiereEntero ? 1 : 0.01;
      const disponible = Math.max(Number(item.disponible || cantidad), minimo);
      const normalizada = requiereEntero
        ? Math.round(cantidad)
        : Math.round(cantidad * 100) / 100;
      const nuevaCantidad = Math.min(Math.max(normalizada, minimo), disponible);
      return {
        ...item,
        cantidad: nuevaCantidad,
        subtotal: nuevaCantidad * Number(item.precio),
      };
    });
    void guardarCarrito(copia);
  };

  const actualizarNota = (idProducto: any, nota: string) => {
    const copia = carrito.map((item) =>
      Number(item.id_producto) === Number(idProducto) ? { ...item, nota } : item
    );
    void guardarCarrito(copia);
  };

  const limpiarCarrito = () => {
    borrarCarrito();
    mostrarMensaje('Carrito limpiado correctamente.', 'info');
  };

  const usarDireccionRegistrada = () => {
    if (cliente?.direccion) {
      setDireccionEntrega(cliente.direccion);
      mostrarMensaje('Se usó la dirección registrada.', 'ok');
    } else {
      mostrarMensaje('El cliente no tiene dirección registrada.', 'error');
    }
  };

  const confirmarPedido = async () => {
    if (guardando) {
      return;
    }

    setMensaje('');

    if (!cliente?.id_cliente) {
      mostrarMensaje('Debe iniciar sesión como cliente.', 'error');
      router.replace('/cliente-login' as any);
      return;
    }

    if (carrito.length === 0) {
      mostrarMensaje('Debe agregar al menos un producto al pedido.', 'error');
      return;
    }

    if (!tipoEntrega) {
      mostrarMensaje('Seleccione el tipo de entrega.', 'error');
      return;
    }

    if (!metodoPago) {
      mostrarMensaje('Seleccione el método de pago.', 'error');
      return;
    }

    const direccionFinal =
      tipoEntrega === 'Retiro en tienda'
        ? 'Retiro en tienda'
        : direccionEntrega.trim();

    if (
      tipoEntrega === 'Entrega' &&
      direccionFinal.length < LONGITUD_MINIMA_DIRECCION
    ) {
      mostrarMensaje(
        'Ingrese una dirección exacta de al menos 20 caracteres, incluyendo localidad y señas.',
        'error'
      );
      return;
    }

    if (tipoEntrega === 'Entrega' && observacion.trim().length < 10) {
      mostrarMensaje(
        'Para una entrega, indique en observaciones dónde se debe dejar el pedido. Si es un condominio, incluya torre, casa, recepción o instrucciones de acceso.',
        'error'
      );
      return;
    }

    const productosInvalidos = carrito.filter(
      (item) =>
        !item.id_producto ||
        Number(item.cantidad) <= 0 ||
        Number(item.precio) <= 0
    );

    if (productosInvalidos.length > 0) {
      mostrarMensaje('Hay productos con datos incompletos. Limpie el carrito y vuelva a agregarlos.', 'error');
      return;
    }

    try {
      setGuardando(true);
      mostrarMensaje('Registrando pedido, por favor espere...', 'info');

      const productosPedido = carrito.map((item) => ({
        id_producto: Number(item.id_producto),
        cantidad: Number(item.cantidad),
      }));

      const productosParaWhatsApp = carrito.map((item) => ({
        nombre: item.nombre || 'Producto',
        cantidad: Number(item.cantidad),
        unidad_medida: item.unidad_medida || 'unidad',
        precio: Number(item.precio || 0),
        subtotal: Number(item.subtotal || 0),
        nota: String(item.nota || '').trim(),
      }));

      const notasProductos = carrito
        .filter((item) => String(item.nota || '').trim())
        .map((item) => `${item.nombre}: ${String(item.nota).trim()}`)
        .join('\n');
      const observacionFinal = [
        observacion.trim(),
        notasProductos ? `Notas por producto:\n${notasProductos}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const respuesta = await api.post('/pedidos', {
        id_cliente: Number(cliente.id_cliente),
        metodo_pago: metodoPago,
        tipo_entrega: tipoEntrega,
        direccion_entrega: direccionFinal,
        observacion: observacionFinal,
        productos: productosPedido,
      });

      const numeroPedido = respuesta.data?.id_pedido || '';

      mostrarMensaje(
        `Pedido registrado correctamente${numeroPedido ? ` #${numeroPedido}` : ''}. El administrador ya puede verlo.`,
        'ok'
      );

      await borrarCarrito();

      try {
        await abrirPedidoEnWhatsApp({
          numeroPedido: numeroPedido || 'sin número',
          direccionFinal,
          productosPedido: productosParaWhatsApp,
        });
      } catch (errorWhatsApp) {
        console.log('No se pudo abrir WhatsApp:', errorWhatsApp);
        mostrarMensaje(
          `Pedido #${numeroPedido || ''} registrado, pero no se pudo abrir WhatsApp.`,
          'info'
        );
      }

      setObservacion('');

      setTimeout(() => {
        router.replace('/cliente-mis-pedidos' as any);
      }, 1800);
    } catch (error: any) {
      console.log('Error al registrar pedido:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.message ||
          'No se pudo registrar el pedido. Revise la conexión o el inventario.',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  const productosFiltrados = productos
    .filter((producto) => {
      const nombre = obtenerNombre(producto).toLowerCase();
      const precio = obtenerPrecio(producto);
      const categoria = obtenerCategoriaProducto(producto);

      return (
        nombre.includes(busqueda.toLowerCase()) &&
        (categoriaSeleccionada === 'Todos' ||
          categoria === categoriaSeleccionada) &&
        precio > 0 &&
        productoActivo(producto)
      );
    })
    .slice(0, 24);

  return (
    <ScrollView style={styles.pagina} contentContainerStyle={[styles.contenido, isPhone && styles.contenidoPhone]} keyboardShouldPersistTaps="handled">
      <View style={styles.contenedorPrincipal}>
        <ClientHeader />

        <View style={styles.banner}>
          <Text style={styles.titulo}>Realizar pedido</Text>
          <Text style={styles.subtitulo}>
            Cliente: {cliente?.nombre || 'Cliente'}
          </Text>
          <Text style={styles.descripcion}>
            Agregue productos, revise cantidades y confirme el pedido.
          </Text>
        </View>

        <ContenidoPedidoResponsivo
          isPhone={isPhone}
          style={[
            styles.contenidoPedido,
            isPhone && styles.contenidoPedidoPhone,
          ]}
        >
          <View
            style={[
              styles.columnaProductos,
              isPhone && styles.columnaProductosPhone,
            ]}
          >
            <Text style={styles.tituloSeccion}>Agregar productos</Text>

            <TextInput
              style={styles.inputBusqueda}
              placeholder="Buscar producto..."
              value={busqueda}
              onChangeText={setBusqueda}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriasScroll}
            >
              <View style={styles.categoriasFila}>
                {CATEGORIAS_PRODUCTOS.map((categoria) => (
                  <Pressable accessibilityRole="button"
                    key={categoria}
                    style={[
                      styles.categoriaBoton,
                      categoriaSeleccionada === categoria &&
                        styles.categoriaBotonActivo,
                    ]}
                    onPress={() => setCategoriaSeleccionada(categoria)}
                  >
                    <Text
                      style={[
                        styles.categoriaTexto,
                        categoriaSeleccionada === categoria &&
                          styles.categoriaTextoActivo,
                      ]}
                    >
                      {categoria}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {cargando ? (
              <Text style={styles.textoVacio}>Cargando productos...</Text>
            ) : productosFiltrados.length === 0 ? (
              <Text style={styles.textoVacio}>No hay productos disponibles.</Text>
            ) : (
              <View style={[styles.productosGrid, isPhone && styles.productosGridPhone]}>
                {productosFiltrados.map((producto, index) => {
                  const imagen = obtenerImagen(producto);
                  const disponible = obtenerDisponible(producto);
                  const agotado = disponible <= 0;

                  return (
                    <View
                      key={producto.id_producto || producto.id || index}
                      style={[styles.productoCard, isPhone && styles.productoCardPhone]}
                    >
                      {agotado && (
                        <View style={styles.etiquetaAgotado}>
                          <Text style={styles.etiquetaAgotadoTexto}>Agotado</Text>
                        </View>
                      )}

                      <View style={styles.imagenArea}>
                        {imagen ? (
                          <Image
                            source={{ uri: imagen }}
                            style={styles.imagenProducto}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.imagenEmoji}>🥦</Text>
                        )}
                      </View>

                      <Text style={styles.productoNombre} numberOfLines={2}>
                        {obtenerNombre(producto)}
                      </Text>

                      <Text style={styles.productoDetalle}>
                        Disponible: {disponible} {obtenerUnidad(producto)}
                      </Text>

                      <Text style={styles.productoPrecio}>
                        {formatoColones(obtenerPrecio(producto))}
                      </Text>

                      <Text style={styles.cantidadLabel}>Cantidad</Text>
                      <QuantitySelector
                        value={cantidadesProducto[Number(producto.id_producto || producto.id)] || 1}
                        max={disponible}
                        unit={obtenerUnidad(producto)}
                        disabled={agotado || guardando}
                        onChange={(value) =>
                          setCantidadesProducto((actuales) => ({
                            ...actuales,
                            [Number(producto.id_producto || producto.id)]: value,
                          }))
                        }
                      />

                      <Pressable accessibilityRole="button"
                        style={[styles.botonAgregar, agotado && styles.botonAgotado]}
                        onPress={() => agregarProducto(producto)}
                        disabled={agotado || guardando}
                      >
                        <Text style={styles.textoBotonAgregar}>
                          {agotado ? 'Agotado' : 'Agregar'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View
            style={[
              styles.columnaCarrito,
              isPhone && styles.columnaCarritoPhone,
            ]}
          >
            <View style={styles.carritoTituloFila}>
              <Text style={styles.tituloSeccion}>Carrito del pedido</Text>

              {carrito.length > 0 && !guardando && (
                <Pressable accessibilityRole="button" onPress={limpiarCarrito}>
                  <Text style={styles.limpiarTexto}>Limpiar</Text>
                </Pressable>
              )}
            </View>

            {mensaje !== '' && (
              <View
                accessibilityRole="alert"
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

            {carrito.length === 0 ? (
              <View style={styles.carritoVacio}>
                <Text style={styles.carritoVacioIcono}>🛒</Text>
                <Text style={styles.textoVacio}>
                  No hay productos agregados.
                </Text>
                <Text style={styles.textoAyuda}>
                  Seleccione productos desde el catálogo o desde esta pantalla.
                </Text>
              </View>
            ) : (
              carrito.map((item) => (
                <View key={item.id_producto} style={[styles.itemCarrito, isPhone && styles.itemCarritoPhone]}>
                  <View style={styles.itemImagenArea}>
                    {item.imagen_url ? (
                      <Image
                        source={{ uri: item.imagen_url }}
                        style={styles.itemImagen}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.itemEmoji}>🥦</Text>
                    )}
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNombre}>{item.nombre}</Text>
                    <Text style={styles.itemDetalle}>
                      {formatoColones(item.precio)} por {item.unidad_medida || 'kg'}
                    </Text>
                    <Text style={styles.itemSubtotal}>
                      Subtotal: {formatoColones(item.subtotal)}
                    </Text>

                    <View style={styles.cantidadFila}>
                      <QuantitySelector
                        value={Number(item.cantidad)}
                        max={Math.max(Number(item.disponible || item.cantidad), 0.01)}
                        unit={item.unidad_medida || 'unidad'}
                        disabled={guardando}
                        onChange={(value) => actualizarCantidad(item.id_producto, value)}
                      />
                      <Pressable accessibilityRole="button"
                        style={styles.botonEliminar}
                        onPress={() => eliminarProducto(item.id_producto)}
                        disabled={guardando}
                      >
                        <Text style={styles.textoEliminar}>Eliminar</Text>
                      </Pressable>
                    </View>

                    <TextInput
                      style={styles.notaProducto}
                      placeholder="Nota para este producto (opcional)"
                      value={item.nota || ''}
                      onChangeText={(text) => actualizarNota(item.id_producto, text)}
                      maxLength={120}
                      editable={!guardando}
                    />
                  </View>
                </View>
              ))
            )}

            <View style={[styles.totalCaja, isPhone && styles.totalCajaPhone]}>
              <Text style={styles.totalTexto}>Total del pedido</Text>
              <Text style={styles.totalMonto}>{formatoColones(totalPedido)}</Text>
            </View>

            <Text style={styles.label}>Tipo de entrega *</Text>
            <Text style={styles.ayudaRequerida}>
              Seleccione cómo desea recibir el pedido.
            </Text>

            <View style={styles.metodosPago}>
              {['Entrega', 'Retiro en tienda'].map((tipo) => (
                <Pressable accessibilityRole="button"
                  key={tipo}
                  style={[
                    styles.metodoBoton,
                    tipoEntrega === tipo && styles.metodoBotonActivo,
                  ]}
                  onPress={() => setTipoEntrega(tipo)}
                  disabled={guardando}
                  accessibilityState={{ selected: tipoEntrega === tipo }}
                >
                  <Text
                    style={[
                      styles.metodoTexto,
                      tipoEntrega === tipo && styles.metodoTextoActivo,
                    ]}
                  >
                    {tipo}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tipoEntrega === 'Entrega' ? (
              <>
                <Text style={styles.label}>Dirección exacta *</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Provincia, cantón, distrito y señas exactas"
                  value={direccionEntrega}
                  onChangeText={setDireccionEntrega}
                  multiline
                  editable={!guardando}
                  accessibilityLabel="Dirección exacta de entrega"
                />

                <Text style={styles.ayudaRequerida}>
                  Incluya localidad y señas. Si existe, agregue un punto de referencia o enlace de Waze. Mínimo 20 caracteres.
                </Text>

                <Pressable accessibilityRole="button"
                  style={styles.botonDireccion}
                  onPress={usarDireccionRegistrada}
                  disabled={guardando}
                >
                  <Text style={styles.textoDireccion}>Usar dirección registrada</Text>
                </Pressable>
              </>
            ) : tipoEntrega === 'Retiro en tienda' ? (
              <View style={styles.retiroCaja}>
                <Text style={styles.retiroTitulo}>Retiro en tienda seleccionado</Text>
                <Text style={styles.retiroTexto}>
                  Recoge tu pedido en la verdulería.
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>Método de pago *</Text>
            <Text style={styles.ayudaRequerida}>
              Seleccione una opción para continuar.
            </Text>

            <View style={styles.metodosPago}>
              {['Efectivo', 'SINPE Móvil', 'Tarjeta', 'Transferencia'].map((metodo) => (
                <Pressable accessibilityRole="button"
                  key={metodo}
                  style={[
                    styles.metodoBoton,
                    metodoPago === metodo && styles.metodoBotonActivo,
                  ]}
                  onPress={() => setMetodoPago(metodo)}
                  disabled={guardando}
                  accessibilityState={{ selected: metodoPago === metodo }}
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

            <Text style={styles.label}>
              Observación {tipoEntrega === 'Entrega' ? '*' : '(opcional)'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={
                tipoEntrega === 'Entrega'
                  ? 'Indique dónde dejar el pedido. Ej.: casa 24, torre B, recepción del condominio.'
                  : 'Opcional. Ejemplo: retirar después de las 5 p.m.'
              }
              value={observacion}
              onChangeText={setObservacion}
              multiline
              editable={!guardando}
            />

            <Text style={styles.camposObligatorios}>* Campos obligatorios</Text>

            <Pressable accessibilityRole="button"
              style={[
                styles.botonConfirmar,
                (guardando || carrito.length === 0) && styles.botonDesactivado,
              ]}
              onPress={confirmarPedido}
              disabled={guardando || carrito.length === 0}
            >
              <Text style={styles.textoConfirmar}>
                {guardando ? 'Registrando pedido...' : 'Confirmar pedido'}
              </Text>
            </Pressable>

            <Pressable accessibilityRole="button"
              style={styles.botonVolver}
              onPress={() => router.push('/catalogo' as any)}
              disabled={guardando}
            >
              <Text style={styles.textoVolver}>Volver al catálogo</Text>
            </Pressable>
          </View>
        </ContenidoPedidoResponsivo>
      </View>
    </ScrollView>
  );
}

const baseStyles = createAppStyles({
  pagina: {
    flex: 1,
    backgroundColor: '#f7f5ee',
  },
  contenido: {
    alignItems: 'center',
    padding: 20,
  },
  contenidoPhone: { padding: 0 },
  contenedorPrincipal: {
    width: '100%',
    maxWidth: 1200,
    backgroundColor: '#fffdf6',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ebe4d3',
  },
  header: {
    minHeight: 110,
    backgroundColor: '#fffdf6',
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerPhone: { flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 16, gap: 14 },
  logoArea: {
    width: 280,
  },
  logoAreaPhone: { width: '100%', alignItems: 'center' },
  logoTexto: {
    color: '#0f4f24',
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  logoNombre: {
    color: '#0f4f24',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  logoSubtitulo: {
    color: '#e07b18',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 3,
  },
  menu: {
    flexDirection: 'row',
    gap: 36,
    alignItems: 'center',
  },
  menuPhone: { justifyContent: 'space-between', gap: 8, width: '100%' },
  menuTexto: {
    color: '#1e1e1e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carritoHeader: {
    position: 'relative',
  },
  carritoIcono: {
    fontSize: 34,
  },
  carritoNumero: {
    position: 'absolute',
    top: -8,
    right: -9,
    backgroundColor: '#0f4f24',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carritoNumeroTexto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: '#f4f1dc',
    paddingVertical: 38,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  titulo: {
    color: '#063f22',
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitulo: {
    color: '#1b5e20',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 8,
  },
  descripcion: {
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  contenidoPedido: {
    padding: 24,
    flexDirection: 'row',
    gap: 22,
    alignItems: 'flex-start',
  },
  contenidoPedidoPhone: { flexDirection: 'column', padding: 14 },
  columnaProductos: {
    flex: 1.2,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ebe4d3',
  },
  columnaProductosPhone: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  columnaCarrito: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ebe4d3',
  },
  columnaCarritoPhone: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  tituloSeccion: {
    color: '#1b5e20',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  inputBusqueda: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
    marginBottom: 16,
  },
  categoriasScroll: {
    marginBottom: 16,
  },
  categoriasFila: {
    flexDirection: 'row',
    gap: 8,
  },
  categoriaBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  categoriaBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  categoriaTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  categoriaTextoActivo: {
    color: '#ffffff',
  },
  productosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  productosGridPhone: { flexDirection: 'column' },
  productoCard: {
    width: 155,
    backgroundColor: '#fffdf6',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ebe4d3',
    position: 'relative',
  },
  productoCardPhone: { width: '100%' },
  etiquetaAgotado: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#c62828',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 2,
  },
  etiquetaAgotadoTexto: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imagenArea: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenProducto: {
    width: '100%',
    height: 85,
  },
  imagenEmoji: {
    fontSize: 55,
  },
  productoNombre: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 14,
    minHeight: 36,
  },
  productoDetalle: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
  productoPrecio: {
    color: '#0f4f24',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  botonAgregar: {
    backgroundColor: '#1b5e20',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  botonAgotado: {
    backgroundColor: '#9e9e9e',
  },
  textoBotonAgregar: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  carritoTituloFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limpiarTexto: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  carritoVacio: {
    backgroundColor: '#fffdf6',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    marginBottom: 16,
  },
  carritoVacioIcono: {
    fontSize: 42,
    marginBottom: 8,
  },
  textoVacio: {
    color: '#555',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  textoAyuda: {
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  itemCarrito: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fffdf6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ebe4d3',
    marginBottom: 12,
  },
  cantidadLabel: {
    color: '#45615e',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 9,
    marginBottom: 5,
  },
  itemCarritoPhone: { alignItems: 'flex-start' },
  itemImagenArea: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImagen: {
    width: 68,
    height: 68,
  },
  itemEmoji: {
    fontSize: 42,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemDetalle: {
    color: '#555',
    fontSize: 13,
    marginTop: 3,
  },
  itemSubtotal: {
    color: '#0f4f24',
    fontWeight: 'bold',
    marginTop: 5,
  },
  cantidadFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  botonCantidad: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCantidad: {
    color: '#1b5e20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  numeroCantidad: {
    color: '#1e1e1e',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  botonEliminar: {
    marginLeft: 8,
  },
  textoEliminar: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  totalCaja: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  notaProducto: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#c7d8d7',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    fontSize: 12,
  },
  totalCajaPhone: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  totalTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalMonto: {
    color: '#0f4f24',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 4,
  },
  label: {
    color: '#333',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  ayudaRequerida: {
    color: '#5f6f66',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  camposObligatorios: {
    color: '#5f6f66',
    fontSize: 13,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 13,
    fontSize: 15,
    minHeight: 48,
  },
  botonDireccion: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoDireccion: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  retiroCaja: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#f9d77e',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  retiroTitulo: {
    color: '#e65100',
    fontWeight: 'bold',
    fontSize: 15,
  },
  retiroTexto: {
    color: '#555',
    marginTop: 5,
    lineHeight: 20,
  },
  metodosPago: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  metodoBoton: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 12,
    paddingVertical: 10,
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
  mensajeCaja: {
    marginTop: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  botonConfirmar: {
    backgroundColor: '#f58220',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botonDesactivado: {
    backgroundColor: '#9e9e9e',
  },
  textoConfirmar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonVolver: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1b5e20',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  textoVolver: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
});
