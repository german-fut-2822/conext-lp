/**
 * Vercel Function (Node.js runtime).
 *
 * Valida el formulario (campos requeridos, formato de correo, honeypot) y
 * verifica el reCAPTCHA contra Google. El envío real del correo sigue
 * pendiente de decidir el proveedor (Resend/SendGrid/SMTP) — por ahora esta
 * función no envía el correo, solo valida y confirma.
 *
 * Requiere la variable de entorno RECAPTCHA_SECRET_KEY (Secret Key de
 * reCAPTCHA v2, configurada en Vercel > Settings > Environment Variables).
 */

async function verificarRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('Falta RECAPTCHA_SECRET_KEY en las variables de entorno.');
    return false;
  }
  if (!token) return false;

  const params = new URLSearchParams({ secret, response: token });
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  return data.success === true;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ estatus: false, message: 'Método no permitido.' });
  }

  const body = request.body || {};
  const { nombre, empresa, correo, telefono, producto, mensaje, empresa_web: honeypot } = body;
  const recaptchaToken = body['g-recaptcha-response'];

  if (honeypot) {
    return response.status(200).json({ estatus: true, message: 'Gracias, recibimos tu mensaje.' });
  }

  const requeridos = { nombre, empresa, correo, telefono, producto, mensaje };
  for (const [campo, valor] of Object.entries(requeridos)) {
    if (!valor || !String(valor).trim()) {
      return response.status(200).json({ estatus: false, message: 'Por favor completa todos los campos requeridos.' });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return response.status(200).json({ estatus: false, message: 'El correo proporcionado no es válido.' });
  }

  const recaptchaOk = await verificarRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return response.status(200).json({ estatus: false, message: 'No se pudo verificar el reCAPTCHA. Intenta de nuevo.' });
  }

  // TODO: envío real de correo (proveedor pendiente de definir) a ventas@conext.com.mx.
  console.log('Contacto recibido (pendiente de envío real):', { nombre, empresa, correo, telefono, producto });

  return response.status(200).json({
    estatus: true,
    message: 'Gracias, recibimos tu mensaje. Un especialista de CONEXT te contactará a la brevedad.',
  });
}
