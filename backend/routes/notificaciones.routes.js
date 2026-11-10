const express = require('express');
const {
  registrarDispositivo, tokensPara, enviar, firebaseConfigurado,
} = require('../services/notificaciones');

const router = express.Router();

router.post('/registrar', async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const plataforma = String(req.body.plataforma || '').trim().toLowerCase();
    const sesion = req.usuarioSesion || {};
    const tipoUsuario = sesion.tipo === 'cliente' ? 'cliente' : 'admin';
    const idUsuario = tipoUsuario === 'cliente' ? sesion.id_cliente : sesion.id_usuario;
    if (!token || !['android','ios','web'].includes(plataforma) || !idUsuario) {
      return res.status(400).json({ mensaje: 'Datos del dispositivo incompletos.' });
    }
    await registrarDispositivo({ token, plataforma, tipoUsuario, idUsuario });
    return res.json({ mensaje: 'Dispositivo registrado para notificaciones.', firebase: firebaseConfigurado() });
  } catch (error) {
    console.error('Registrar notificaciones:', error.message || error);
    return res.status(500).json({ mensaje: 'No se pudo registrar el dispositivo.' });
  }
});

router.post('/prueba', async (req, res) => {
  try {
    const sesion = req.usuarioSesion || {};
    if (sesion.tipo !== 'admin') return res.status(403).json({ mensaje: 'Solo administración puede ejecutar la prueba.' });
    const tokens = await tokensPara('admin', sesion.id_usuario);
    const tipo = String(req.body.tipo || 'general');
    const mensajes = {
      stock: ['Stock bajo', 'El aguacate llegó al nivel mínimo. Revise el inventario.'],
      pedido: ['Pedido nuevo', 'Se recibió un pedido de prueba en el entorno sandbox.'],
      general: ['Firebase funcionando', 'La aplicación recibió correctamente la notificación de prueba.'],
    };
    const [titulo, cuerpo] = mensajes[tipo] || mensajes.general;
    const resultado = await enviar({ tokens, titulo, cuerpo, datos: { pantalla: tipo === 'pedido' ? '/pedidos-admin' : '/alertas', prueba: 'true' } });
    if (!resultado.enviado) {
      const mensajesError = {
        firebase_no_configurado: 'Firebase todavía no tiene credenciales en el servidor.',
        sin_dispositivos: 'Este administrador todavía no registró un dispositivo.',
        envio_fallido: 'Firebase rechazó el token guardado. Active nuevamente las notificaciones en este dispositivo.',
      };
      return res.status(409).json({
        mensaje: mensajesError[resultado.motivo] || 'Firebase no pudo enviar la notificación.',
        codigo: resultado.codigo || null,
      });
    }
    return res.json({ mensaje: 'Notificación de prueba enviada.', resultado });
  } catch (error) {
    console.error('Prueba de notificaciones:', error.message || error);
    return res.status(500).json({ mensaje: 'No se pudo enviar la notificación de prueba.' });
  }
});

module.exports = router;
