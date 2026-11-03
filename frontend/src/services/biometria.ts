import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_SESSION_KEY = 'verduleria_biometric_session_v1';
const secureOptions: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  authenticationPrompt: 'Confirme su identidad para ingresar',
  keychainService: 'verduleria-biometric-session',
};

export type BiometricSession = {
  tipo: 'admin' | 'cliente';
  token: string;
  perfil: Record<string, unknown>;
};

export const biometriaDisponible = async () => {
  if (Platform.OS === 'web') return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled && SecureStore.canUseBiometricAuthentication();
};

export const guardarSesionBiometrica = async (sesion: BiometricSession) => {
  if (!(await biometriaDisponible())) throw new Error('Biometría no disponible');
  await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, JSON.stringify(sesion), secureOptions);
  await AsyncStorage.setItem(`${BIOMETRIC_SESSION_KEY}_enabled`, 'true');
};

export const existeSesionBiometrica = async () => {
  if (Platform.OS === 'web') return false;
  return (await AsyncStorage.getItem(`${BIOMETRIC_SESSION_KEY}_enabled`)) === 'true';
};

export const abrirSesionBiometrica = async (): Promise<BiometricSession | null> => {
  if (!(await biometriaDisponible())) return null;
  const raw = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY, secureOptions);
  if (!raw) return null;
  return JSON.parse(raw) as BiometricSession;
};

export const eliminarSesionBiometrica = async () => {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY, secureOptions);
    await AsyncStorage.removeItem(`${BIOMETRIC_SESSION_KEY}_enabled`);
  }
};
