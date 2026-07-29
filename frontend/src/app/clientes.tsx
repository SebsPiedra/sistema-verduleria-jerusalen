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
  const { width } = useWindowDimensions();
  const esTelefono = width < 768;
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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

  return (
    <AdminLayout
      titulo="Clientes"
      subtitulo="Consulta de clientes registrados en la verdulería"
    >
      <View style={[styles.hero, esTelefono && styles.heroTelefono]}>
        <View>
          <Text style={styles.titulo}>Clientes registrados 👥</Text>
          <Text style={styles.subtitulo}>
            Revise información de contacto y datos de entrega.
          </Text>
        </View>

        <Pressable style={styles.botonActualizar} onPress={cargarClientes}>
          <Text style={styles.textoActualizar}>
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </Text>
        </Pressable>
      </View>

      {mensaje !== '' && (
        <View style={styles.mensajeError}>
          <Text style={styles.mensajeTexto}>{mensaje}</Text>
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

        <View style={styles.tablaHeader}>
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
        )}
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
  mensajeTexto: {
    color: '#c62828',
    textAlign: 'center',
    fontWeight: 'bold',
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
