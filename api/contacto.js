/**
 * Vercel Function (Node.js runtime) — reemplaza a _send.php cuando el sitio
 * se despliega en Vercel en vez de un hosting PHP tradicional.
 *
 * Envía el correo vía Resend (https://resend.com). Requiere la variable de
 * entorno RESEND_API_KEY configurada en el proyecto de Vercel (Settings →
 * Environment Variables). Resend permite enviar de inmediato usando el
 * remitente de pruebas "onboarding@resend.dev".
 *
 * IMPORTANTE: ventas@conext.com.mx ya es un buzón real en uso. NO verificar
 * el dominio raíz (conext.com.mx) en Resend — agregar ahí los TXT de SPF/DKIM
 * de Resend podría chocar con el SPF/MX que ya tienen configurado y romper
 * la entrega de su correo actual. En vez de eso, verificar un SUBDOMINIO
 * dedicado solo para envío (p. ej. mail.conext.com.mx), que no toca el DNS
 * del dominio raíz, y usarlo como FROM aquí abajo — el destinatario (DESTINATARIO)
 * sigue siendo el buzón real de siempre, eso no cambia.
 */

const DESTINATARIO = 'ventas@conext.com.mx';
const REMITENTE = 'CONEXT Web <onboarding@resend.dev>'; // TODO: cambiar a algo como
// 'CONEXT Web <ventas@mail.conext.com.mx>' una vez verificado ese subdominio en Resend.

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    return response.status(405).json({ estatus: false, message: 'Método no permitido.' });
  }

  const body = request.body || {};
  const { nombre, empresa, correo, telefono, mensaje, producto, origen, empresa_web: honeypot } = body;

  if (honeypot) {
    return response.status(200).json({ estatus: true, message: 'Gracias, recibimos tu mensaje.' });
  }

  const requeridos = { nombre, empresa, correo, telefono, mensaje };
  for (const [campo, valor] of Object.entries(requeridos)) {
    if (!valor || !String(valor).trim()) {
      return response.status(200).json({ estatus: false, message: 'Por favor completa todos los campos requeridos.' });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return response.status(200).json({ estatus: false, message: 'El correo proporcionado no es válido.' });
  }

  // TODO: una vez dada de alta la site key en google.com/recaptcha/admin,
  // verificar aquí el token "g-recaptcha-response" contra la RECAPTCHA_SECRET_KEY.

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Falta configurar RESEND_API_KEY en el proyecto de Vercel.');
    return response.status(200).json({
      estatus: false,
      message: 'El envío de correo aún no está configurado. Escríbenos directo a ventas@conext.com.mx.',
    });
  }

  const origenTexto = origen || 'CONEXT LP';
  const asunto = `Nuevo contacto desde la LP de CONEXT (${origenTexto})`;
  const cuerpo = [
    `Origen: ${origenTexto}`,
    `Nombre: ${nombre}`,
    `Empresa: ${empresa}`,
    `Correo: ${correo}`,
    `Teléfono: ${telefono}`,
    `Producto o material de interés: ${producto || 'No especificado'}`,
    '',
    'Mensaje:',
    mensaje,
  ].join('\n');

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [DESTINATARIO],
        reply_to: correo,
        subject: asunto,
        text: cuerpo,
      }),
    });

    if (!resendRes.ok) {
      console.error('Resend error:', await resendRes.text());
      return response.status(200).json({
        estatus: false,
        message: 'No se pudo enviar tu mensaje en este momento, intenta de nuevo o escríbenos a ventas@conext.com.mx.',
      });
    }

    return response.status(200).json({
      estatus: true,
      message: 'Gracias, recibimos tu mensaje. Un especialista de CONEXT te contactará a la brevedad.',
    });
  } catch (err) {
    console.error(err);
    return response.status(200).json({
      estatus: false,
      message: 'No se pudo enviar tu mensaje en este momento, intenta de nuevo o escríbenos a ventas@conext.com.mx.',
    });
  }
};
