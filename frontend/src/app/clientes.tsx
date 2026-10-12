import { createAppStyles, useAppStyles } from '../theme/appStyles';
import ResponsiveTable from '../components/ResponsiveTable';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

export default function ClientesScreen() {
  const styles = useAppStyles(baseStyles);
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'ok' | 'error'>('ok');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', correo: '', direccion: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const respuesta = await api.get('/clientes');

      const datos = Array.isArray(respuesta.data)
        ? respuesta.data
        : respuesta.data?.clientes || [];

      setClientes(datos);
    } catch (error: any) {
      console.log('Error al cargar clientes:', error?.response?.data || error);
      setTipoMensaje('error');
      setMensaje('No se pudieron cargar los clientes.');
    } finally {
      setCargando(false);
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      String(cliente.nombre || '').toLowerCase().includes(texto) ||
      String(cliente.correo || cliente.email || '').toLowerCase().includes(texto) ||
      String(cliente.telefono || '').toLowerCase().includes(texto)
    );
  });

  const agregarCliente = async () => {
    try {
      setGuardando(true); setMensaje('');
      await api.post('/clientes/admin', nuevo);
      setNuevo({ nombre: '', telefono: '', correo: '', direccion: '' });
      setMostrarFormulario(false);
      await cargarClientes();
      setTipoMensaje('ok');
      setMensaje('Cliente agregado con éxito. Ya puede seleccionarlo al registrar una venta.');
    } catch (error: any) {
      setTipoMensaje('error');
      setMensaje(error?.response?.data?.mensaje || 'No se pudo agregar el cliente.');
    } finally { setGuardando(false); }
  };

  return (
    <AdminLayout
      titulo="Clientes"
      subtitulo="Consulta de clientes registrados en la verdulería"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Clientes registrados 👥</Text>
          
        </View>

        <View style={styles.accionesHero}>
          <Pressable accessibilityRole="button" style={styles.botonAgregar} onPress={() => setMostrarFormulario((valor) => !valor)}><Text style={styles.textoActualizar}>＋ Agregar cliente</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.botonActualizar} onPress={cargarClientes}><Text style={styles.textoActualizar}>{cargando ? 'Actualizando...' : 'Actualizar'}</Text></Pressable>
        </View>
      </View>

      {mostrarFormulario ? <View style={styles.formulario}>
        <Text style={styles.formTitulo}>Nuevo cliente para ventas</Text>
        <Text style={styles.formAyuda}>Solo el nombre es obligatorio. Puede completar teléfono, correo y dirección para reutilizarlos.</Text>
        <View style={[styles.formGrid, esTelefono && styles.formGridTelefono]}>
          {([['nombre','Nombre completo *'],['telefono','Teléfono'],['correo','Correo'],['direccion','Dirección']] as const).map(([campo,placeholder]) => <TextInput key={campo} style={styles.inputForm} placeholder={placeholder} accessibilityLabel={placeholder} value={nuevo[campo]} onChangeText={(valor) => setNuevo((actual) => ({...actual,[campo]:valor}))} />)}
        </View>
        <Pressable style={[styles.botonAgregar, guardando && {opacity:.5}]} disabled={guardando} onPress={agregarCliente}><Text style={styles.textoActualizar}>{guardando ? 'Guardando...' : 'Guardar cliente'}</Text></Pressable>
      </View> : null}

      {mensaje !== '' && (
        <View style={tipoMensaje === 'ok' ? styles.mensajeOk : styles.mensajeError}>
          <Text accessibilityRole="alert" style={[styles.mensajeTexto, tipoMensaje === 'ok' && styles.mensajeTextoOk]}>{mensaje}</Text>
        </View>
      )}

      <View style={styles.resumenGrid}>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{clientes.length}</Text>
          <Text style={styles.resumenTexto}>Total clientes</Text>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>
            {clientes.filter((c) => String(c.estado || 'Activo') === 'Activo').length}
          </Text>
          <Text style={styles.resumenTexto}>Activos</Text>
        </View>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre, correo o teléfono..."
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {esTelefono ? <View style={styles.listaMovil}>
          {clientesFiltrados.length === 0 ? <Text style={styles.vacioTexto}>{cargando ? 'Cargando clientes...' : 'No hay clientes para mostrar.'}</Text> : clientesFiltrados.map((cliente, index) => <View key={cliente.id_cliente || index} style={styles.tarjetaMovil}>
            <View style={styles.cabeceraMovil}><Text style={styles.tdNombre}>{cliente.nombre || 'Sin nombre'}</Text><View style={styles.estadoBadge}><Text style={styles.estadoTexto}>{cliente.estado || 'Activo'}</Text></View></View>
            <Text style={styles.datoMovil}>Teléfono: {cliente.telefono || 'Sin teléfono'}</Text>
            <Text style={styles.datoMovil}>Correo: {cliente.correo || cliente.email || 'Sin correo'}</Text>
            <Text style={styles.datoMovil}>Dirección: {cliente.direccion || 'Sin dirección'}</Text>
          </View>)}
        </View> : <ResponsiveTable><View style={styles.tablaHeader}>
          <Text style={[styles.th, styles.colNombre]}>Cliente</Text>
          <Text style={[styles.th, styles.colTelefono]}>Teléfono</Text>
          <Text style={[styles.th, styles.colCorreo]}>Correo</Text>
          <Text style={[styles.th, styles.colDireccion]}>Dirección</Text>
          <Text style={[styles.th, styles.colEstado]}>Estado</Text>
        </View>

        {clientesFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              {cargando ? 'Cargando clientes...' : 'No hay clientes para mostrar.'}
            </Text>
          </View>
        ) : (
          clientesFiltrados.map((cliente, index) => (
            <View key={cliente.id_cliente || index} style={styles.tablaRow}>
              <Text style={[styles.tdNombre, styles.colNombre]}>
                {cliente.nombre || 'Sin nombre'}
              </Text>

              <Text style={[styles.td, styles.colTelefono]}>
                {cliente.telefono || 'Sin teléfono'}
              </Text>

              <Text style={[styles.td, styles.colCorreo]}>
                {cliente.correo || cliente.email || 'Sin correo'}
              </Text>

              <Text style={[styles.td, styles.colDireccion]} numberOfLines={1}>
                {cliente.direccion || 'Sin dirección'}
              </Text>

              <View style={styles.colEstado}>
                <View style={styles.estadoBadge}>
                  <Text style={styles.estadoTexto}>
                    {cliente.estado || 'Activo'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}</ResponsiveTable>}
      </View>
    </AdminLayout>
  );
}

const baseStyles = createAppStyles({
  accionesHero: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  botonAgregar: { backgroundColor: '#007d72', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  formulario: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe7e6', borderRadius: 18, padding: 18, marginBottom: 20 },
  formTitulo: { color: '#075e58', fontSize: 20, fontWeight: '800' },
  formAyuda: { color: '#60797b', marginTop: 5, marginBottom: 12 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  formGridTelefono: { flexDirection: 'column' },
  inputForm: { flexGrow: 1, minWidth: 210, backgroundColor: '#f8fbfb', borderWidth: 1, borderColor: '#c8dada', borderRadius: 12, padding: 12 },
  listaMovil: { gap: 10 },
  tarjetaMovil: { borderWidth: 1, borderColor: '#dce8e8', borderRadius: 14, padding: 14, backgroundColor: '#fdfefe' },
  cabeceraMovil: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 9 },
  datoMovil: { color: '#4c6769', fontSize: 13, lineHeight: 20 },
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
    marginTop: 6,
  },
  heroTelefono: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
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
  mensajeOk: {
    backgroundColor: '#e4f4e8',
    borderWidth: 1,
    borderColor: '#6fa77b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mensajeTexto: {
    color: '#c62828',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mensajeTextoOk: {
    color: '#17652f',
  },
  resumenGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 22,
  },
  resumenCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  resumenNumero: {
    color: '#0f4f24',
    fontSize: 34,
    fontWeight: 'bold',
  },
  resumenTexto: {
    color: '#555',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebe4d3',
    borderRadius: 20,
    padding: 18,
  },
  input: {
    backgroundColor: '#fffdf6',
    borderWidth: 1,
    borderColor: '#d7cfae',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  tablaHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d3',
    paddingBottom: 12,
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
  tdNombre: {
    color: '#0f4f24',
    fontWeight: 'bold',
  },
  colNombre: {
    flex: 1.4,
  },
  colTelefono: {
    flex: 1,
  },
  colCorreo: {
    flex: 1.5,
  },
  colDireccion: {
    flex: 2,
  },
  colEstado: {
    flex: 1,
    alignItems: 'center',
  },
  estadoBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  estadoTexto: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vacio: {
    padding: 30,
    alignItems: 'center',
  },
  vacioTexto: {
    color: '#777',
    fontWeight: 'bold',
  },
});
