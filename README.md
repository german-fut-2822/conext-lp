# conext-lp

Landing page de campaña para CONEXT (metales no ferrosos y químicos industriales), construida en [Astro](https://astro.build). No reemplaza el sitio en producción (`conext.com.mx`, WordPress) — vive aparte, en un subdominio de campaña pendiente de asignar.

## Desarrollo local

```sh
npm install
npm run dev
```

## Build de producción

```sh
npm run build
npm run preview
```

## Despliegue (Vercel)

1. Importar este repo en [vercel.com](https://vercel.com) (Framework Preset: Astro, detección automática).
2. Configurar la variable de entorno `RESEND_API_KEY` (Settings → Environment Variables) — usada por `api/contacto.js` para enviar el formulario de contacto a `ventas@conext.com.mx` vía [Resend](https://resend.com).
3. Cada push a `main` despliega automáticamente.

## Pendientes conocidos

- Activar reCAPTCHA real (falta dominio final + site key en [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)).
- Sustituir fondos/texturas abstractas por fotografía real de producto y planta.
- Confirmar con Selene/Gustavo el contenido de la sección Químicos (el catálogo real en conext.com.mx no coincide con el del Sites de referencia).
