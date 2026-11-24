const PDFDocument = require('pdfkit');
require('pdfkit/standard-fonts/Helvetica');
require('pdfkit/standard-fonts/HelveticaBold');

const money = (value) => 'CRC ' + (Number(value) / 100).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = function generarPdfSemanal(report) {
  return new Promise((resolve, reject) => {
    const period = `${report.inicio} al ${report.fin}`;
    const doc = new PDFDocument({
      size: 'A4', margin: 48, bufferPages: true,
      info: { Title: `Resumen semanal ${period}`, Author: 'Verdulería Jerusalén' },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const heading = (value) => {
      if (doc.y > 700) doc.addPage();
      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(15).fillColor('#075333').text(value).moveDown(0.4);
    };
    const text = (value) => doc.font('Helvetica').fontSize(10).fillColor('#24352b').text(String(value), { lineGap: 3 });
    const addSection = (title, rows, format) => {
      doc.addPage(); heading(`${title} (${rows.length})`);
      if (!rows.length) text('Sin registros.');
      rows.forEach((row) => {
        const line = format(row);
        const height = doc.font('Helvetica').fontSize(10).heightOfString(line, { width: 499, lineGap: 3 }) + 16;
        if (doc.y + height > 770) { doc.addPage(); heading(`${title} (continuación)`); }
        text(line); doc.moveDown(0.6);
      });
    };

    heading('VERDULERÍA JERUSALÉN');
    doc.fontSize(23).text('Resumen semanal');
    text(`Período: ${period} (lunes a domingo)`);
    text(`Generado: ${new Date(report.generado_en).toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' })} (Costa Rica)`);
    heading('Resultado de la semana');
    for (const [key, label] of [['ingresos', 'Ingresos por ventas'], ['costo', 'Costo de productos vendidos'], ['perdidas', 'Pérdidas por desechos'], ['gastos', 'Gastos adicionales'], ['ganancia', 'Ganancia estimada']]) {
      text(`${label}: ${money(report.totales[key])}`);
    }
    text(`Ventas contabilizadas: ${report.totales.ventas} | Pedidos registrados: ${report.totales.pedidos}`);
    heading('Criterios y alcance');
    text(report.criterio);
    text(`Líneas con costo estimado: ${report.totales.costos_estimados}. Sin costo disponible: ${report.totales.sin_costo}. Ventas sin detalle: ${report.totales.ventas_sin_detalle}.`);
    text('Este documento refleja los datos disponibles al momento de generarlo. No es una declaración tributaria.');

    addSection('Ventas', report.ventas, (row) => `#${row.id_venta} | ${row.fecha} | ${row.cliente || 'Cliente general'} | ${row.estado || ''} | ${money(Number(row.total) * 100)} | ${row.contabilizada ? 'Contabilizada' : 'No contabilizada'}`);
    addSection('Productos vendidos', report.detalles, (row) => `Venta #${row.id_venta} | ${row.producto} | Cantidad: ${row.cantidad} | Venta: ${money(Number(row.subtotal) * 100)} | Costo: ${money(Number(row.costo) * 100)}${row.estimado ? ' (estimado)' : ''}`);
    addSection('Pedidos', report.pedidos, (row) => `#${row.id_pedido} | ${row.fecha} | ${row.cliente} | ${row.estado || ''} | ${money(Number(row.total) * 100)} | Venta vinculada: ${row.id_venta || 'Ninguna'}`);
    addSection('Desechos', report.desechos, (row) => `${row.fecha} | ${row.producto} | Cantidad: ${row.cantidad} | ${row.motivo || ''} | ${money(Number(row.perdida) * 100)} | ${row.estado || ''}`);
    addSection('Gastos adicionales', report.gastos, (row) => `${row.fecha} | ${row.concepto} | ${money(Number(row.monto) * 100)} | ${row.anulado_en ? 'Anulado' : 'Vigente'}`);

    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(index);
      doc.fontSize(8).fillColor('#666666').text(`Verdulería Jerusalén | ${period} | Página ${index + 1} de ${range.count}`, 48, 800, { lineBreak: false });
    }
    doc.end();
  });
};
