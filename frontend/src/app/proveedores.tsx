import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function ProveedoresScreen() {
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState('Activo');

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error' | 'info'>('info');

  useEffect(() => {
    cargarProveedores();
    // La lista se vuelve a cargar explícitamente después de cada acción.
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
    }, 4000);
  };

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuesta = await api.get('/proveedores');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.proveedores || [];

      setProveedores(datos);
    } catch (error: any) {
      console.log('Error al cargar proveedores:', error?.response?.data || error);
      setProveedores([]);
      mostrarMensaje('No se pudieron cargar los proveedores.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setEstado('Activo');
    setProveedorEditando(null);
  };

  const abrirNuevoProveedor = () => {
    limpiarFormulario();
    setMostrarFormulario(true);
  };

  const abrirEditarProveedor = (proveedor: any) => {
    setProveedorEditando(proveedor);

    setNombre(
      proveedor.nombre ||
        proveedor.nombre_proveedor ||
        proveedor.proveedor ||
        ''
    );

    setTelefono(proveedor.telefono || '');

    setCorreo(
      proveedor.correo ||
        proveedor.email ||
        ''
    );

    setDireccion(proveedor.direccion || '');
    setEstado(proveedor.estado || 'Activo');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(false);
  };

  const validarCorreo = (correoTexto: string) => {
    if (!correoTexto) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTexto);
  };

  const obtenerIdProveedor = (proveedor: any) => {
    return proveedor.id_proveedor || proveedor.id || proveedor.idProveedor;
  };

  const obtenerNombre = (proveedor: any) => {
    return (
      proveedor.nombre ||
      proveedor.nombre_proveedor ||
      proveedor.proveedor ||
      'Proveedor sin nombre'
    );
  };

  const obtenerCorreo = (proveedor: any) => {
    return proveedor.correo || proveedor.email || 'Sin correo';
  };

  const obtenerTelefono = (proveedor: any) => {
    return proveedor.telefono || 'Sin teléfono';
  };

  const obtenerDireccion = (proveedor: any) => {
    return proveedor.direccion || 'Sin dirección';
  };

  const obtenerEstado = (proveedor: any) => {
    return proveedor.estado || 'Activo';
  };

  const guardarProveedor = async () => {
    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const direccionLimpia = direccion.trim();

    if (!nombreLimpio) {
      mostrarMensaje('Debe ingresar el nombre del proveedor.', 'error', true);
      return;
    }

    if (telefonoLimpio && telefonoLimpio.length < 8) {
      mostrarMensaje('Ingrese un teléfono válido.', 'error', true);
      return;
    }

    if (!validarCorreo(correoLimpio)) {
      mostrarMensaje('Ingrese un correo electrónico válido.', 'error', true);
      return;
    }

    try {
      setGuardando(true);
      mostrarMensaje('Guardando proveedor...', 'info');

      const datosProveedor = {
        nombre: nombreLimpio,
        nombre_proveedor: nombreLimpio,
        proveedor: nombreLimpio,
        telefono: telefonoLimpio,
        correo: correoLimpio,
        email: correoLimpio,
        direccion: direccionLimpia,
        estado,
      };

      if (proveedorEditando) {
        const idProveedor = obtenerIdProveedor(proveedorEditando);

        await api.put(`/proveedores/${idProveedor}`, datosProveedor);

        mostrarMensaje('Proveedor actualizado correctamente.', 'ok', true);
      } else {
        await api.post('/proveedores', datosProveedor);

        mostrarMensaje('Proveedor registrado correctamente.', 'ok', true);
      }

      cerrarFormulario();
      await cargarProveedores();
    } catch (error: any) {
      console.log('Error al guardar proveedor:', error?.response?.data || error);

      mostrarMensaje(
        error?.response?.data?.mensaje ||
          error?.response?.data?.error ||
          'No se pudo guardar el proveedor.',
        'error',
        true
      );
    } finally {
      setGuardando(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const texto = busqueda.toLowerCase();

    return (
      obtenerNombre(proveedor).toLowerCase().includes(texto) ||
      obtenerCorreo(proveedor).toLowerCase().includes(texto) ||
      obtenerTelefono(proveedor).toLowerCase().includes(texto) ||
      obtenerDireccion(proveedor).toLowerCase().includes(texto)
    );
  });

  const totalActivos = proveedores.filter(
    (proveedor) => String(obtenerEstado(proveedor)).toLowerCase() === 'activo'
  ).length;

  const totalInactivos = proveedores.filter(
    (proveedor) => String(obtenerEstado(proveedor)).toLowerCase() === 'inactivo'
  ).length;

  return (
    <AdminLayout
      titulo="Proveedores"
      subtitulo="Control de proveedores relacionados con la verdulería"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Proveedores 🚚</Text>
          <Text style={styles.subtitulo}>
            Registre, consulte y actualice los proveedores del negocio.
          </Text>
        </View>

        <Pressable style={styles.botonAgregar} onPress={abrirNuevoProveedor}>
          <Text style={styles.textoAgregar}>＋ Agregar proveedor</Text>
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
          <Text style={styles.tarjetaIcono}>🚚</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Total proveedores</Text>
            <Text style={styles.tarjetaNumero}>{proveedores.length}</Text>
            <Text style={styles.tarjetaDetalle}>Registrados</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoVerde}>✓</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Activos</Text>
            <Text style={styles.tarjetaNumero}>{totalActivos}</Text>
            <Text style={styles.tarjetaDetalle}>Disponibles</Text>
          </View>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaIconoRojo}>!</Text>
          <View>
            <Text style={styles.tarjetaLabel}>Inactivos</Text>
            <Text style={styles.tarjetaNumeroRojo}>{totalInactivos}</Text>
            <Text style={styles.tarjetaDetalle}>No disponibles</Text>
          </View>
        </View>
      </View>

      {mostrarFormulario && (
        <View style={styles.formularioCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitulo}>
                {proveedorEditando ? 'Editar proveedor' : 'Nuevo proveedor'}
              </Text>
              <Text style={styles.formSubtitulo}>
                Complete los datos principales del proveedor.
              </Text>
            </View>

            <Pressable style={styles.botonCerrar} onPress={cerrarFormulario}>
              <Text style={styles.textoCerrar}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={styles.filaDoble}>
            <View style={styles.campo}>
              <Text style={styles.label}>Nombre del proveedor</Text>
              <TextInput
                style={styles.input}
                placeholder="Ejemplo: Proveedor San José"
                value={nombre}
                onChangeText={setNombre}
                editable={!guardando}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Ejemplo: 88888888"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                editable={!guardando}
              />
            </View>
          </View>

          <View style={styles.filaDoble}>
            <View style={styles.campo}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="proveedor@correo.com"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!guardando}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.label}>Estado</Text>
              <View style={styles.estadosFila}>
                {['Activo', 'Inactivo'].map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.estadoBoton,
                      estado === item && styles.estadoBotonActivo,
                    ]}
                    onPress={() => setEstado(item)}
                    disabled={guardando}
                  >
                    <Text
                      style={[
                        styles.estadoBotonTexto,
                        estado === item && styles.estadoBotonTextoActivo,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.inputMultilinea}
            placeholder="Dirección o ubicación del proveedor"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            editable={!guardando}
          />

          <View style={styles.botonesFila}>
            <Pressable
              style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
              onPress={guardarProveedor}
              disabled={guardando}
            >
              <Text style={styles.textoGuardar}>
                {guardando
                  ? 'Guardando...'
                  : proveedorEditando
                    ? 'Guardar cambios'
                    : 'Registrar proveedor'}
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
            placeholder="Buscar por nombre, teléfono, correo o dirección..."
            value={busqueda}
            onChangeText={setBusqueda}
          />

          <Pressable style={styles.botonActualizar} onPress={cargarProveedores}>
            <Text style={styles.textoActualizar}>
              {cargando ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colNombre]}>Proveedor</Text>
          <Text style={[styles.th, styles.colTelefono]}>Teléfono</Text>
          <Text style={[styles.th, styles.colCorreo]}>Correo</Text>
          <Text style={[styles.th, styles.colDireccion]}>Dirección</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
          <Text style={[styles.th, styles.colAccion]}>Acción</Text>
        </View>

        {cargando ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>Cargando proveedores...</Text>
          </View>
        ) : proveedoresFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcono}>🚚</Text>
            <Text style={styles.vacioTitulo}>No hay proveedores para mostrar</Text>
            <Text style={styles.vacioTexto}>
              Registre un proveedor o revise la búsqueda.
            </Text>
          </View>
        ) : (
          proveedoresFiltrados.map((proveedor, index) => {
            const activo =
              String(obtenerEstado(proveedor)).toLowerCase() === 'activo';

            return (
              <View key={obtenerIdProveedor(proveedor) || index} style={styles.tablaRow}>
                <View style={[styles.colNombre, styles.nombreInfo]}>
                  <View style={styles.avatarProveedor}>
                    <Text style={styles.avatarTexto}>🚚</Text>
                  </View>

                  <Text style={styles.nombreProveedor} numberOfLines={1}>
                    {obtenerNombre(proveedor)}
                  </Text>
                </View>

                <Text style={[styles.td, styles.colTelefono]}>
                  {obtenerTelefono(proveedor)}
                </Text>

                <Text style={[styles.td, styles.colCorreo]} numberOfLines={1}>
                  {obtenerCorreo(proveedor)}
                </Text>

                <Text style={[styles.td, styles.colDireccion]} numberOfLines={1}>
                  {obtenerDireccion(proveedor)}
                </Text>

                <View style={styles.colEstado}>
                  <View
                    style={[
                      styles.estadoBadge,
                      activo ? styles.estadoActivo : styles.estadoInactivo,
                    ]}
                  >
                    <View
                      style={[
                        styles.puntoEstado,
                        activo ? styles.puntoVerde : styles.puntoRojo,
                      ]}
                    />

                    <Text style={styles.estadoTexto}>
                      {obtenerEstado(proveedor)}
                    </Text>
                  </View>
                </View>

                <View style={styles.colAccion}>
                  <Pressable
                    style={styles.botonEditar}
                    onPress={() => abrirEditarProveedor(proveedor)}
                  >
                    <Text style={styles.textoEditar}>Editar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footerTabla}>
          <Text style={styles.footerTexto}>
            Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores
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
    fontSize: 26,
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
    fontSize: 26,
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
  estadosFila: {
    flexDirection: 'row',
    gap: 10,
  },
  estadoBoton: {
    flex: 1,
    backgroundColor: '#f7f2dc',
    borderWidth: 1,
    borderColor: '#d7cfae',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  estadoBotonActivo: {
    backgroundColor: '#1b5e20',
    borderColor: '#1b5e20',
  },
  estadoBotonTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  estadoBotonTextoActivo: {
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
  td: {
    color: '#333',
    fontSize: 13,
  },
  colNombre: {
    flex: 1.8,
  },
  colTelefono: {
    flex: 1,
  },
  colCorreo: {
    flex: 1.5,
  },
  colDireccion: {
    flex: 1.8,
  },
  colEstado: {
    flex: 1.1,
    alignItems: 'center',
  },
  colAccion: {
    flex: 0.9,
    alignItems: 'center',
  },
  nombreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarProveedor: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 20,
  },
  nombreProveedor: {
    color: '#0f4f24',
    fontWeight: 'bold',
    flex: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  estadoActivo: {
    backgroundColor: '#e8f5e9',
  },
  estadoInactivo: {
    backgroundColor: '#ffebee',
  },
  puntoEstado: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  puntoVerde: {
    backgroundColor: '#2e7d32',
  },
  puntoRojo: {
    backgroundColor: '#c62828',
  },
  estadoTexto: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  botonEditar: {
    backgroundColor: '#0f4f24',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
  },
  textoEditar: {
    color: '#ffffff',
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
