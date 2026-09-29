import { Redirect } from 'expo-router';

// Ruta heredada de la plantilla de Expo. Se conserva para no romper enlaces antiguos.
export default function ExploreRedirect() {
  return <Redirect href="/" />;
}
