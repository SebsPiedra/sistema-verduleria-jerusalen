import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

export default function EditarProductoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const idProducto = String(params.id || '');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Frutas');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [unidadMedida, setUnidadMedida] = useState('kg');
  const [imagenUrl, setImagenUrl] = useState('');
  const [estado, setEstado] = useState('Activo');

  const categorias = ['Frutas', 'Verduras', 'Jugos naturales', 'Otros'];
  const unidades = ['kg', 'unidad', 'bolsa', 'caja', 'litro', 'paquete'];
  const estados = ['Activo', 'Inactivo'];

  useEffect(() => {
    cargarProducto();
    // El producto se hidrata una vez a partir del parámetro de la ruta.
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
  };

  const validarNumero = (valor: string) => {
    const numero = Number(valor);
    return !Number.isNaN(numero) && numero >= 0;
  };

  const cargarProducto = async () => {
    if (!idProducto) {
      mostrarMensaje('No se recibió el ID del producto.', 'error', true);
      router.replace('/productos' as any);
      return;
    }

    try {
      setCargando(true);
      setMensaje('');

      let productoEncontrado: any = null;

      try {
        const respuesta = await api.get(`/productos/${idProducto}`);
        productoEncontrado = respuesta.data?.producto || respuesta.data;
      } catch {
        const respuestaLista = await api.get('/productos');

        const productos = Array.isArray(respuestaLista.data)
          ? respuestaLista.data
          : respuestaLista.data?.productos || [];

        productoEncontrado = productos.find(
          (producto: any) =>
            Number(producto.id_producto || producto.id) === Number(idProducto)
        );
      }

      if (!productoEncontrado) {
        mostrarMensaje('No se encontró el producto seleccionado.', 'error', true);
        router.replace('/productos' as any);
        return;
      }

      setNombre(productoEncontrado.nombre || productoEncontrado.nombre_producto || '');
      setDescripcion(productoEncontrado.descripcion || '');
      setCategoria(
        productoEncontrado.categoria ||
          productoEncontrado.nombre_categoria ||
          productoEncontrado.categoria_nombre ||
          'Frutas'
      );
      setPrecioCompra(String(productoEncontrado.precio_compra || 0));
      setPrecioVenta(
        String(
          productoEncontrado.precio_venta ||
            productoEncontrado.precio ||
            productoEncontrado.precio_unitario ||
            0
        )
      );
      setCantidad(String(productoEncontrado.cantidad ?? productoEncontrado.stock ?? 0));
      setStockMinimo(String(productoEncontrado.stock_minimo || 5));
      setUnidadMedida(productoEncontrado.unidad_medida || productoEncontrado.unidad || 'kg');
      setImagenUrl(
        productoEncontrado.imagen_url ||
          productoEncontrado.imagen ||
          productoEncontrado.url_imagen ||
          ''
      );
      setEstado(productoEncontrado.estado || 'Activo');
    } catch (error: any) {
      console.log('Error al cargar producto:', error?.response?.data || error);
      mostrarMensaje('No se pudo cargar la información del producto.', 'error', true);
    } finally {
      setCargando(false);
    }
  };

  const actualizarProducto = async () => {
    setMensaje('');

    const nombreLimpio = nombre.trim();
    const descripcionLimpia = descripcion.trim();
    const imagenLimpia = imagenUrl.trim();

    if (!nombreLimpio) {
      mostrarMensaje('Debe ingresar el nombre del producto.', 'error', true);
      return;
    }

    if (!precioCompra || !validarNumero(precioCompra)) {
      mostrarMensaje('Debe ingresar un precio de compra válido.', 'error', true);
      return;
    }

    if (!precioVenta || !validarNumero(precioVenta)) {
      mostrarMensaje('Debe ingresar un precio de venta válido.', 'error', true);
      return;
    }

    if (!cantidad || !validarNumero(cantidad)) {
      mostrarMensaje('Debe ingresar una cantidad válida.', 'error', true);
      return;
    }

    if (!stockMinimo || !validarNumero(stockMinimo)) {
      mostrarMensaje('Debe ingresar un stock mínimo válido.', 'error', true);
      return;
    }

    if (Number(precioVenta) < Number(precioCompra)) {
      mostrarMensaje(
        'El precio de venta no debería ser menor que el precio de compra.',
        'error',
        true
      );
      return;
    }

    if (imagenLimpia && !imagenLimpia.startsWith('https://')) {
      mostrarMensaje(
        'La imagen debe ser un enlace público que inicie con https://',
        'error',
        true
      );
      return;
    }

    try {
      setGuardando(true);
      mostrarMensaje('Actualizando producto...', 'info');

      await api.put(`/productos/${idProducto}`, {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia || 'Producto fresco de verdulería',
        categoria,
        nombre_categoria: categoria,
        precio_compra: Number(precioCompra),
        precio_venta: Number(precioVenta),
        precio: Number(precioVenta),
        cantidad: Number(cantidad),
        stock: Math.ceil(Number(cantidad)),
        stock_minimo: Number(stockMinimo),
        unidad_medida: unidadMedida,
        imagen_url: imagenLimpia,
        imagen: imagenLimpia,
        estado,
      });

      mostrarMensaje('Producto actualizado correctamente.', 'ok', true);

      setTimeout(() => {
        router.replace('/productos' as any);
      }, 1000);
    } catch (error: any) {
      console.log('Error al actualizar producto:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          'No se pudo actualizar el producto.',
        'error',
        true
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminLayout
      titulo="Editar producto"
      subtitulo="Actualice información, precios, inventario e imagen del producto"
    >
      <View style={styles.hero}>
        <View>
          <Text style={styles.titulo}>Editar producto ✏️</Text>
          <Text style={styles.subtitulo}>
            Modifique los datos necesarios y guarde los cambios.
          </Text>
        </View>

        <Pressable
          style={styles.botonVolver}
          onPress={() => router.replace('/productos' as any)}
        >
          <Text style={styles.textoVolver}>Volver al inventario</Text>
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

      {cargando ? (
        <View style={styles.cardCarga}>
          <Text style={styles.textoCarga}>Cargando producto...</Text>
        </View>
      ) : (
        <View style={styles.contenido}>
          <View style={styles.formulario}>
            <Text style={styles.seccionTitulo}>Información del producto</Text>

            <Text style={styles.label}>Nombre del producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: Tomate"
              value={nombre}
              onChangeText={setNombre}
              editable={!guardando}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.inputMultilinea}
              placeholder="Ejemplo: Producto fresco de verdulería"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              editable={!guardando}
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.opcionesFila}>
              {categorias.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.opcion,
                    categoria === item && styles.opcionActiva,
                  ]}
                  onPress={() => setCategoria(item)}
                  disabled={guardando}
                >
                  <Text
                    style={[
                      styles.opcionTexto,
                      categoria === item && styles.opcionTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.campoMitad}>
                <Text style={styles.label}>Precio compra</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ejemplo: 400"
                  value={precioCompra}
                  onChangeText={setPrecioCompra}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>

              <View style={styles.campoMitad}>
                <Text style={styles.label}>Precio venta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ejemplo: 800"
                  value={precioVenta}
                  onChangeText={setPrecioVenta}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>
            </View>

            <View style={styles.filaDoble}>
              <View style={styles.campoMitad}>
                <Text style={styles.label}>Cantidad disponible</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ejemplo: 20"
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>

              <View style={styles.campoMitad}>
                <Text style={styles.label}>Stock mínimo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ejemplo: 5"
                  value={stockMinimo}
                  onChangeText={setStockMinimo}
                  keyboardType="numeric"
                  editable={!guardando}
                />
              </View>
            </View>

            <Text style={styles.label}>Unidad de medida</Text>
            <View style={styles.opcionesFila}>
              {unidades.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.opcion,
                    unidadMedida === item && styles.opcionActiva,
                  ]}
                  onPress={() => setUnidadMedida(item)}
                  disabled={guardando}
                >
                  <Text
                    style={[
                      styles.opcionTexto,
                      unidadMedida === item && styles.opcionTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Estado</Text>
            <View style={styles.opcionesFila}>
              {estados.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.opcion,
                    estado === item && styles.opcionActiva,
                  ]}
                  onPress={() => setEstado(item)}
                  disabled={guardando}
                >
                  <Text
                    style={[
                      styles.opcionTexto,
                      estado === item && styles.opcionTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Imagen del producto en la nube</Text>
            <TextInput
              style={styles.input}
              placeholder="https://verduleria-sebas.sirv.com/productos/tomate.jpg"
              value={imagenUrl}
              onChangeText={setImagenUrl}
              autoCapitalize="none"
              editable={!guardando}
            />

            <View style={styles.botonesFila}>
              <Pressable
                style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
                onPress={actualizarProducto}
                disabled={guardando}
              >
                <Text style={styles.textoGuardar}>
                  {guardando ? 'Guardando cambios...' : 'Guardar cambios'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.botonCancelar}
                onPress={() => router.replace('/productos' as any)}
                disabled={guardando}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.seccionTitulo}>Vista previa</Text>

            <View style={styles.productoCard}>
              <View style={styles.imagenArea}>
                {imagenUrl.trim().startsWith('https://') ? (
                  <Image
                    source={{ uri: imagenUrl.trim() }}
                    style={styles.imagenPreview}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.imagenEmoji}>🥦</Text>
                )}
              </View>

              <Text style={styles.previewNombre}>
                {nombre.trim() || 'Nombre del producto'}
              </Text>

              <Text style={styles.previewCategoria}>{categoria}</Text>

              <Text style={styles.previewCantidad}>
                Disponible: {cantidad || '0'} {unidadMedida}
              </Text>

              <Text style={styles.previewPrecio}>
                ₡{Number(precioVenta || 0).toLocaleString('es-CR')}
              </Text>

              <View
                style={[
                  styles.estadoPreview,
                  estado === 'Inactivo' && styles.estadoPreviewInactivo,
                ]}
              >
                <View
                  style={[
                    styles.puntoVerde,
                    estado === 'Inactivo' && styles.puntoGris,
                  ]}
                />
                <Text
                  style={[
                    styles.estadoTexto,
                    estado === 'Inactivo' && styles.estadoTextoInactivo,
                  ]}
                >
                  {estado}
                </Text>
              </View>
            </View>

            <Text style={styles.ayuda}>
              Los cambios se reflejarán en inventario y catálogo. Use enlaces públicos de Sirv para las imágenes.
            </Text>
          </View>
        </View>
      )}
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
  botonVolver: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  textoVolver: {
    color: '#1b5e20',
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
    textAlign: 'center',
    color: '#1e1e1e',
    fontWeight: 'bold',
  },
  cardCarga: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  textoCarga: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  contenido: {
    flexDirection: 'row',
    gap: 22,
    alignItems: 'flex-start',
  },
  formulario: {
    flex: 1.5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 22,
  },
  preview: {
    flex: 0.8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 22,
  },
  seccionTitulo: {
    color: '#1b5e20',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: '#333',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
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
    minHeight: 80,
  },
  filaDoble: {
    flexDirection: 'row',
    gap: 14,
  },
  campoMitad: {
    flex: 1,
  },
  opcionesFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opcion: {
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  opcionActiva: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  opcionTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  opcionTextoActivo: {
    color: '#ffffff',
  },
  botonesFila: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: '#f58220',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  botonDesactivado: {
    backgroundColor: '#9e9e9e',
  },
  textoGuardar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonCancelar: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c62828',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  textoCancelar: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  productoCard: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 16,
  },
  imagenArea: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagenPreview: {
    width: '100%',
    height: 150,
  },
  imagenEmoji: {
    fontSize: 90,
  },
  previewNombre: {
    color: '#1e1e1e',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  previewCategoria: {
    color: '#4f8f20',
    fontWeight: 'bold',
    marginTop: 4,
  },
  previewCantidad: {
    color: '#555',
    marginTop: 8,
  },
  previewPrecio: {
    color: '#0f4f24',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
  },
  estadoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  estadoPreviewInactivo: {
    backgroundColor: '#eeeeee',
  },
  puntoVerde: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2e7d32',
  },
  puntoGris: {
    backgroundColor: '#777',
  },
  estadoTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  estadoTextoInactivo: {
    color: '#555',
  },
  ayuda: {
    color: '#777',
    marginTop: 14,
    lineHeight: 20,
  },
});
