const PDFDocument = require('pdfkit');
// PDFKit loads these fonts dynamically. Explicit imports keep them in Vercel's bundle.
require('pdfkit/standard-fonts/Helvetica');
require('pdfkit/standard-fonts/HelveticaBold');
const money = n => 'CRC ' + (Number(n)/100).toLocaleString('es-CR',{minimumFractionDigits:2,maximumFractionDigits:2});
module.exports = function generarPdf(corte) {
  return new Promise((resolve,reject) => {
    const doc = new PDFDocument({size:'A4',margin:48,bufferPages:true,info:{Title:`Resumen mensual ${corte.periodo}`,Author:'Verdulería Jerusalén'}});
    const chunks=[];
    doc.on('data',c=>chunks.push(c)); doc.on('end',()=>resolve(Buffer.concat(chunks))); doc.on('error',reject);
    const d=corte.datos;
    function heading(text) { if(doc.y>700) doc.addPage(); doc.moveDown(0.6).font('Helvetica-Bold').fontSize(15).fillColor('#075333').text(text).moveDown(0.4); }
    function text(value) { doc.font('Helvetica').fontSize(10).fillColor('#24352b').text(String(value),{lineGap:3}); }
    heading('VERDULERÍA JERUSALÉN');
    doc.fontSize(23).text('Resumen mensual · '+corte.periodo);
    text('Corte: '+corte.id);
    text('Generado: '+new Date(d.generado_en).toLocaleString('es-CR',{timeZone:'America/Costa_Rica'})+' (Costa Rica)');
    heading('Resultado del período');
    for(const [key,label] of [['ingresos','Ingresos por ventas'],['costo','Costo de productos vendidos'],['perdidas','Pérdidas por desechos'],['gastos','Gastos adicionales'],['ganancia','Ganancia estimada']]) text(label+': '+money(d.totales[key]));
    text('Ventas contabilizadas: '+d.totales.ventas+' | Pedidos registrados: '+d.totales.pedidos);
    heading('Criterios y alcance'); text(d.criterio);
    text('Líneas con costo estimado: '+d.totales.costos_estimados+'. Sin costo disponible: '+d.totales.sin_costo+'. Ventas sin detalle: '+d.totales.ventas_sin_detalle+'.');
    text('Este corte conserva los datos disponibles al guardarlo. Los cambios posteriores se reflejan en un nuevo corte, no en este documento. No es una declaración tributaria.');
    const sections=[
      ['Ventas',d.ventas,r=>`#${r.id_venta} | ${r.fecha} | ${r.cliente || 'Cliente general'} | ${r.estado || ''} | ${money(Number(r.total)*100)} | ${r.contabilizada?'Contabilizada':'No contabilizada'}`],
      ['Detalle de ventas',d.detalles,r=>`Venta #${r.id_venta} | ${r.producto} | Cantidad: ${r.cantidad} | Subtotal: ${money(Number(r.subtotal)*100)} | Costo: ${money(Number(r.costo)*100)}${r.estimado?' (estimado)':''}`],
      ['Pedidos (no se suman nuevamente a los ingresos)',d.pedidos,r=>`#${r.id_pedido} | ${r.fecha} | ${r.estado} | ${money(Number(r.total)*100)} | Venta vinculada: ${r.id_venta || 'Ninguna'}`],
      ['Desechos',d.desechos,r=>`${r.fecha} | ${r.producto} | Cantidad: ${r.cantidad} | ${r.motivo || ''} | ${money(Number(r.perdida)*100)} | ${r.estado || ''}`],
      ['Gastos adicionales',d.gastos,r=>`${r.fecha} | ${r.concepto} | ${money(Number(r.monto)*100)} | ${r.anulado_en?'Anulado':'Vigente'}`],
      ['Inventario al guardar (no histórico)',d.inventario,r=>`${r.nombre} | ${r.cantidad} ${r.unidad_medida || ''} | Compra: ${money(Number(r.precio_compra)*100)} | Venta: ${money(Number(r.precio_venta)*100)} | ${r.estado || ''}`],
      ['Clientes al guardar (no histórico)',d.clientes,r=>`${r.nombre} | ${r.estado || ''}`],
      ['Proveedores al guardar (no histórico)',d.proveedores,r=>`${r.nombre} | ${r.estado || ''}`]
    ];
    for(const [title,rows,format] of sections) {
      doc.addPage(); heading(title+' ('+rows.length+')');
      if(!rows.length) text('Sin registros.');
      rows.forEach((row,i)=>{ const line=format(row); const height=doc.font('Helvetica').fontSize(10).heightOfString(line,{width:499,lineGap:3})+16;
        if(doc.y+height>770) { doc.addPage(); heading(title+' (continuación)'); }
        text(line); doc.moveDown(0.6);
      });
    }
    const range=doc.bufferedPageRange();
    for(let i=0;i<range.count;i++){doc.switchToPage(i);doc.fontSize(8).fillColor('#666666').text(`Verdulería Jerusalén | ${corte.periodo} | Página ${i+1} de ${range.count}`,48,800,{lineBreak:false});}
    doc.end();
  });
};
