import { ImageSourcePropType } from 'react-native';

const limpiar = (valor: unknown) => String(valor ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const imagenes: Array<[string[], ImageSourcePropType]> = [
  [['aguacate'], require('../../assets/productos-generados/aguacate.jpg')],
  [['ajo'], require('../../assets/productos-generados/ajos.jpg')],
  [['albahaca'], require('../../assets/productos-generados/albahaca.jpg')],
  [['apio'], require('../../assets/productos-generados/apio.jpg')],
  [['ayote sazon'], require('../../assets/productos-generados/ayote-sazon.jpg')],
  [['ayote'], require('../../assets/productos-generados/ayote-tierno.jpg')],
  [['banano', 'guineo'], require('../../assets/productos-generados/banano.jpg')],
  [['berenjena'], require('../../assets/productos-generados/berenjena.jpg')],
  [['brocoli'], require('../../assets/productos-generados/brocoli.jpg')],
  [['camote'], require('../../assets/productos-generados/camote.jpg')],
  [['cas'], require('../../assets/productos-generados/cas.jpg')],
  [['cebolla morada'], require('../../assets/productos-generados/cebolla-morada.jpg')],
  [['cebolla'], require('../../assets/productos-generados/cebolla.jpg')],
  [['cebollin'], require('../../assets/productos-generados/cebollin.jpg')],
  [['chan'], require('../../assets/productos-generados/chan.jpg')],
  [['chayote', 'tacaco'], require('../../assets/productos-generados/chayote.jpg')],
  [['chile'], require('../../assets/productos-generados/chile-dulce.jpg')],
  [['ciruela'], require('../../assets/productos-generados/ciruelas.jpg')],
  [['coco', 'pipa'], require('../../assets/productos-generados/coco.jpg')],
  [['coliflor'], require('../../assets/productos-generados/coliflor.jpg')],
  [['culantro', 'perejil'], require('../../assets/productos-generados/culantro.jpg')],
  [['dulce tapa'], require('../../assets/productos-generados/dulce-tapa.jpg')],
  [['elote', 'maiz'], require('../../assets/productos-generados/elote.jpg')],
  [['espinaca'], require('../../assets/productos-generados/espinacas.jpg')],
  [['fresa'], require('../../assets/productos-generados/fresa.jpg')],
  [['frijol', 'garbanzo', 'lenteja'], require('../../assets/productos-generados/frijoles.jpg')],
  [['granadilla'], require('../../assets/productos-generados/granadillas.jpg')],
  [['guanabana'], require('../../assets/productos-generados/guanabana.jpg')],
  [['hierbabuena', 'manzanilla', 'tomillo'], require('../../assets/productos-generados/hierbabuena.jpg')],
  [['huevo'], require('../../assets/productos-generados/huevos.jpg')],
  [['jengibre'], require('../../assets/productos-generados/jengibre.jpg')],
  [['jugo'], require('../../assets/productos-generados/jugo-papaya.jpg')],
  [['kiwi'], require('../../assets/productos-generados/kiwi.jpg')],
  [['lechuga', 'repollo'], require('../../assets/productos-generados/lechuga-americana.jpg')],
  [['limon'], require('../../assets/productos-generados/limon.jpg')],
  [['linaza', 'chia'], require('../../assets/productos-generados/linaza.jpg')],
  [['mandarina'], require('../../assets/productos-generados/mandarinas.jpg')],
  [['mango'], require('../../assets/productos-generados/mangos.jpg')],
  [['manzana', 'pera'], require('../../assets/productos-generados/manzanas.jpg')],
  [['maracuya'], require('../../assets/productos-generados/maracuya.jpg')],
  [['melocoton'], require('../../assets/productos-generados/melocoton.jpg')],
  [['melon', 'sandia'], require('../../assets/productos-generados/melon.jpg')],
  [['miel'], require('../../assets/productos-generados/miel.jpg')],
  [['mora', 'arandano', 'uva'], require('../../assets/productos-generados/mora.jpg')],
  [['mostaza'], require('../../assets/productos-generados/mostaza.jpg')],
  [['nampi', 'tiquisque', 'yuca'], require('../../assets/productos-generados/nampi.jpg')],
  [['naranja'], require('../../assets/productos-generados/naranja.jpg')],
  [['oregano'], require('../../assets/productos-generados/oregano.jpg')],
  [['palmito'], require('../../assets/productos-generados/palmito.jpg')],
  [['papa'], require('../../assets/productos-generados/papa.jpg')],
  [['papaya'], require('../../assets/productos-generados/papaya.jpg')],
  [['pejibaye'], require('../../assets/productos-generados/pejibaye.jpg')],
  [['pepino', 'zuquini'], require('../../assets/productos-generados/pepino.jpg')],
  [['pina'], require('../../assets/productos-generados/pina.jpg')],
  [['platano'], require('../../assets/productos-generados/platano-verde.jpg')],
  [['tomate'], require('../../assets/productos-generados/tomate.jpg')],
];

const respaldoCategoria: Record<string, ImageSourcePropType> = {
  frutas: require('../../assets/productos-generados/manzanas.jpg'),
  verduras: require('../../assets/productos-generados/lechuga-americana.jpg'),
  'jugos naturales': require('../../assets/productos-generados/jugo-papaya.jpg'),
  otros: require('../../assets/productos-generados/surtido-especial.png'),
};

export const obtenerFuenteImagenProducto = (producto: any): ImageSourcePropType => {
  const remota = producto?.imagen_url || producto?.imagen || producto?.url_imagen;
  if (typeof remota === 'string' && remota.trim()) return { uri: remota.trim() };
  const nombre = limpiar(producto?.nombre || producto?.nombre_producto || producto?.producto);
  const coincidencia = imagenes.find(([claves]) => claves.some((clave) => nombre.includes(clave)));
  if (coincidencia) return coincidencia[1];
  const categoria = limpiar(producto?.categoria || producto?.nombre_categoria || producto?.categoria_nombre);
  return respaldoCategoria[categoria] || respaldoCategoria.otros;
};
