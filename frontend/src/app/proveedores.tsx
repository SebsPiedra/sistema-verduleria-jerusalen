import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ProveedoresScreen() {
  const router = useRouter();

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const respuesta = await api.get('/proveedores');
      setProveedores(respuesta.data);
    } catch (error) {
      console.log('Error al cargar proveedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const limpiarFormulario = () => {
    setIdEditando(null);
    setNombre('');
    setTelefono('');
    setDireccion('');
  };

  const guardarProveedor = async () => {
    if (!nombre) {
      Alert.alert('Campo requerido', 'Debe ingresar el nombre del proveedor');
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre,
        telefono,
        direccion,
      };

      if (idEditando) {
        await api.put(`/proveedores/${idEditando}`, datos);
        Alert.alert('Correcto', 'Proveedor actualizado correctamente');
      } else {
        await api.post('/proveedores', datos);
        Alert.alert('Correcto', 'Proveedor registrado correctamente');
      }

      limpiarFormulario();
      await cargarProveedores();
    } catch (error: any) {
      console.log('Error al guardar proveedor:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.mensaje || 'No se pudo guardar el proveedor'
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarProveedor = (proveedor: any) => {
    setIdEditando(proveedor.id_proveedor);
    setNombre(proveedor.nombre || '');
    setTelefono(proveedor.telefono || '');
    setDireccion(proveedor.direccion || '');
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
        <Text>Cargando proveedores...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Proveedores</Text>
      <Text style={styles.subtitulo}>
        {proveedores.length} proveedores registrados
      </Text>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>
          {idEditando ? 'Editar proveedor' : 'Registrar proveedor'}
        </Text>

        <Text style={styles.label}>Nombre del proveedor</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: Proveedor Central"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: 88888888"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          placeholder="Dirección del proveedor"
          value={direccion}
          onChangeText={setDireccion}
        />

        <Pressable
          style={[styles.botonGuardar, guardando && styles.botonDesactivado]}
          onPress={guardarProveedor}
          disabled={guardando}
        >
          <Text style={styles.textoBoton}>
            {guardando
              ? 'Guardando...'
              : idEditando
              ? 'Actualizar proveedor'
              : 'Guardar proveedor'}
          </Text>
        </Pressable>

        {idEditando && (
          <Pressable style={styles.botonCancelar} onPress={limpiarFormulario}>
            <Text style={styles.textoCancelar}>Cancelar edición</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Lista de proveedores</Text>

        <Pressable style={styles.botonActualizar} onPress={cargarProveedores}>
          <Text style={styles.textoBoton}>Actualizar lista</Text>
        </Pressable>

        {proveedores.length === 0 ? (
          <Text style={styles.textoVacio}>No hay proveedores registrados.</Text>
        ) : (
          proveedores.map((proveedor) => (
            <View key={proveedor.id_proveedor} style={styles.card}>
              <Text style={styles.nombreProveedor}>{proveedor.nombre}</Text>

              <Text style={styles.detalle}>
                Teléfono: {proveedor.telefono || 'No indicado'}
              </Text>

              <Text style={styles.detalle}>
                Dirección: {proveedor.direccion || 'No indicada'}
              </Text>

              <Pressable
                style={styles.botonEditar}
                onPress={() => editarProveedor(proveedor)}
              >
                <Text style={styles.textoEditar}>Editar proveedor</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.botonVolver} onPress={() => router.push('/home' as any)}>
        <Text style={styles.textoVolver}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#eef8ef',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b5e20',
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 18,
  },
  seccion: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d7ead8',
  },
  seccionTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fff9',
    borderWidth: 1,
    borderColor: '#d7ead8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  botonGuardar: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDesactivado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  botonCancelar: {
    backgroundColor: '#eeeeee',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  textoCancelar: {
    color: '#555',
    fontWeight: 'bold',
  },
  botonActualizar: {
    backgroundColor: '#2e7d32',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  textoVacio: {
    color: '#777',
    textAlign: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#f9fff9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7ead8',
    marginBottom: 10,
  },
  nombreProveedor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  detalle: {
    color: '#555',
    marginTop: 5,
  },
  botonEditar: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoEditar: {
    color: '#1b5e20',
    fontWeight: 'bold',
  },
  botonVolver: {
    backgroundColor: '#757575',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoVolver: {
    color: '#fff',
    fontWeight: 'bold',
  },
});