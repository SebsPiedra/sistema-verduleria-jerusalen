import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const guardarDato = async (clave, valor) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(clave, valor);
  } else {
    await SecureStore.setItemAsync(clave, valor);
  }
};

export const obtenerDato = async (clave) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(clave);
  } else {
    return await SecureStore.getItemAsync(clave);
  }
};

export const eliminarDato = async (clave) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(clave);
  } else {
    await SecureStore.deleteItemAsync(clave);
  }
};