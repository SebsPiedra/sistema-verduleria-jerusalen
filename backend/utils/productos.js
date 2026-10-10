const normalizarNombre = (valor = '') =>
  String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const frutas = new Set([
  'aguacate', 'banano', 'cas', 'ciruelas', 'coco', 'fresa', 'granadillas',
  'guanabana', 'guineos', 'kiwi', 'limon', 'mandarinas', 'mangos',
  'manzanas', 'maracuya', 'melocoton', 'melon', 'mora', 'naranja',
  'papaya', 'pejibaye', 'peras', 'pina', 'pipas', 'platano maduro',
  'platano verde', 'sandia', 'tamarindo', 'uvas', 'limon mandarina'
]);

const verduras = new Set([
  'ajos', 'albahaca', 'apio', 'ayote sazon', 'ayote tierno', 'berenjena',
  'brocoli', 'camote', 'cebolla', 'cebolla morada', 'cebollin', 'chayote',
  'chayote sazon', 'chayote tierno', 'chile dulce', 'coliflor', 'culantro',
  'culantro castilla', 'culantro coyote', 'elote', 'espinacas', 'frijol blanco',
  'frijol tierno', 'hierbabuena', 'jengibre', 'lechuga americana', 'mostaza',
  'nampi', 'oregano', 'palmito', 'papa', 'pepino', 'perejil', 'rabanitos',
  'remolacha', 'repollo', 'tacacos', 'tiquisque', 'tomate', 'tomillo',
  'trenzas de ajo', 'vainica', 'yuca parafinada', 'zanahoria', 'zuquini'
]);

const obtenerCategoriaProducto = (nombre) => {
  const nombreNormalizado = normalizarNombre(nombre);

  if (nombreNormalizado.startsWith('jugo de ')) return 'Jugos naturales';
  if (frutas.has(nombreNormalizado)) return 'Frutas';
  if (verduras.has(nombreNormalizado)) return 'Verduras';
  return 'Otros';
};

const agregarCategoriaProducto = (producto) => {
  const categoria = obtenerCategoriaProducto(producto.nombre);

  return {
    ...producto,
    categoria,
    nombre_categoria: categoria
  };
};

module.exports = {
  agregarCategoriaProducto,
  obtenerCategoriaProducto
};
