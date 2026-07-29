const normalizarNombre = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const FRUTAS = new Set([
  'aguacate', 'banano', 'cas', 'ciruelas', 'coco', 'fresa', 'granadillas',
  'guanabana', 'guineos', 'kiwi', 'limon', 'mandarinas', 'mangos',
  'manzanas', 'maracuya', 'melocoton', 'melon', 'mora', 'naranja',
  'papaya', 'pejibaye', 'pina', 'pipas', 'platano maduro', 'platano verde',
]);

const VERDURAS = new Set([
  'ajos', 'albahaca', 'apio', 'ayote sazon', 'ayote tierno', 'berenjena',
  'brocoli', 'camote', 'cebolla', 'cebolla morada', 'cebollin', 'chayote',
  'chile dulce', 'coliflor', 'culantro', 'elote', 'espinacas', 'hierbabuena',
  'jengibre', 'lechuga americana', 'mostaza', 'nampi', 'oregano', 'palmito',
  'papa', 'pepino', 'tomate',
]);

export const obtenerCategoriaProducto = (producto: any) => {
  const categoriaApi =
    producto?.categoria || producto?.nombre_categoria || producto?.categoria_nombre;

  if (categoriaApi && categoriaApi !== 'General') return categoriaApi;

  const nombre = normalizarNombre(
    producto?.nombre || producto?.nombre_producto || producto?.producto
  );

  if (nombre.startsWith('jugo de ')) return 'Jugos naturales';
  if (FRUTAS.has(nombre)) return 'Frutas';
  if (VERDURAS.has(nombre)) return 'Verduras';
  return 'Otros';
};

export const CATEGORIAS_PRODUCTOS = [
  'Todos',
  'Frutas',
  'Verduras',
  'Jugos naturales',
  'Otros',
] as const;
