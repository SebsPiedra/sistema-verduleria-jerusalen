import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVES_SESION = new Set([
  'token',
  'usuario',
  'token_cliente',
  'cliente',
]);

const esDatoSesion = (clave) => CLAVES_SESION.has(clave);

export const guardarDato = async (clave, valor) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(clave, valor);
  } else if (esDatoSesion(clave)) {
    await SecureStore.setItemAsync(clave, valor);
  } else {
    await AsyncStorage.setItem(clave, valor);
  }
};

export const obtenerDato = async (clave) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(clave);
  } else if (esDatoSesion(clave)) {
    const valorSeguro = await SecureStore.getItemAsync(clave);
    if (valorSeguro !== null) return valorSeguro;

    // Recupera sesiones creadas mientras estos datos se guardaban en AsyncStorage.
    const valorAnterior = await AsyncStorage.getItem(clave);
    if (valorAnterior !== null) {
      await SecureStore.setItemAsync(clave, valorAnterior);
      await AsyncStorage.removeItem(clave);
    }
    return valorAnterior;
  } else {
    const valor = await AsyncStorage.getItem(clave);
    if (valor !== null) return valor;

    // Migra datos guardados por versiones anteriores de la aplicación.
    const valorAnterior = await SecureStore.getItemAsync(clave);
    if (valorAnterior !== null) {
      await AsyncStorage.setItem(clave, valorAnterior);
      await SecureStore.deleteItemAsync(clave);
    }
    return valorAnterior;
  }
};

export const eliminarDato = async (clave) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(clave);
  } else if (esDatoSesion(clave)) {
    await Promise.all([
      SecureStore.deleteItemAsync(clave),
      AsyncStorage.removeItem(clave),
    ]);
  } else {
    await Promise.all([
      AsyncStorage.removeItem(clave),
      SecureStore.deleteItemAsync(clave),
    ]);
  }
};
