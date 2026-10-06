/**
 * Vercel Function (Node.js runtime).
 *
 * Valida el formulario (campos requeridos, formato de correo, honeypot).
 * El envío real del correo y el CAPTCHA siguen pendientes de decisión con
 * el equipo (Alex/Gustavo) — por ahora esta función NO envía nada, solo
 * confirma que los datos son válidos. Conectar un proveedor de correo real
 * (y la verificación de reCAPTCHA) una vez que esas decisiones se cierren.
 */

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ estatus: false, message: 'Método no permitido.' });
  }

  const body = request.body || {};
  const { nombre, empresa, correo, telefono, mensaje, empresa_web: honeypot } = body;

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

  // TODO: envío real de correo (proveedor pendiente de definir) y verificación
  // de reCAPTCHA (falta site key una vez que el dominio final esté asignado).
  console.log('Contacto recibido (pendiente de envío real):', { nombre, empresa, correo, telefono });

  return response.status(200).json({
    estatus: true,
    message: 'Gracias, recibimos tu mensaje. Un especialista de CONEXT te contactará a la brevedad.',
  });
}
