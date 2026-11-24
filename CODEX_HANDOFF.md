# Handoff para Codex — proyecto CONEXT (conext-lp)

Este documento reemplaza el contexto de conversación de la sesión anterior (Claude Code),
que se quedó sin tokens. Léelo completo antes de tocar nada — resume el estado del
proyecto, cómo se despliega, y la forma exacta de trabajar con este cliente.

## 1. El cliente es muy detallista

German (el usuario) lo dijo explícitamente al iniciar esta ronda de trabajo: **"este
cliente es especial, le presta atención hasta el más mínimo detalle"**. Implicaciones
prácticas:

- Los ajustes llegan **uno por uno**, normalmente como una captura de pantalla + una
  frase corta describiendo el problema. No asumas alcance más amplio del que se pide.
- Verifica siempre el resultado en el navegador (dev server) antes de dar por
  terminado un ajuste — no basta con que el código "se vea correcto" al leerlo.
- No inventes contenido, specs, nombres de productos, cifras, etc. Si falta un dato
  (por ejemplo un PDF, una imagen, una cifra), pregúntale a German en vez de rellenar
  con algo plausible. Este proyecto ya tuvo que remover contenido inventado en
  secciones de Nosotros e Industrias — no repetir ese error.
- Si un cambio tiene más de una forma razonable de resolverse (por ejemplo, qué pasa
  con productos a los que les falta un PDF), pregunta antes de implementar.

## 2. Cómo se despliega esto — NO asumir que es `main`

El sitio corre en Astro y se publica en Vercel. **Lo que el cliente ve en producción
depende del "Production Branch" configurado en el dashboard de Vercel
(vercel.com/futurite2/conext-lp), que no necesariamente es `main`.** Esto ya causó
confusión una vez en esta sesión: Vercel estuvo apuntando a una rama llamada
`ajustes-cliente` mientras `main` se quedó desactualizado varios commits.

Estado actual (al 2026-11-24, confirmado por German):
- Vercel Production Branch = **`main`** (German lo cambió él mismo en el dashboard).
- `main` ya contiene el sitio completo (ya no hay una rama "full site" separada).

### Ramas que existen y para qué sirven

| Rama | Estado | Qué es | Reglas |
|---|---|---|---|
| `main` | remota | Lo que Vercel despliega a producción | Solo mergear aquí cuando German diga explícitamente "ya puedes desplegar" / "mergea a main". Nunca por iniciativa propia. |
| `ajustes-finales-2026-11-24` | local + remota, **rama activa de trabajo** | Donde se hacen los ajustes de esta ronda | Todo el trabajo de este documento vive aquí. |
| `ajustes-cliente` | remota solamente | Snapshot congelado, punto de referencia de "antes de mergear a main" | **No tocar, no hacer push aquí nunca más.** |
| `backup-3112026` | local + remota | Otro snapshot congelado, punto de comparación anterior | **No tocar, no hacer push aquí nunca más.** |

Si en algún momento algo no aparece en el preview/producción como se espera, lo
primero es confirmar en qué rama está apuntando Vercel — no asumir que es `main`.

## 3. Reglas de git para esta sesión

- **Nunca hagas `git commit` o `git push` sin que German lo pida explícitamente.**
  Es una regla que ha repetido varias veces en este proyecto. Mientras trabajas un
  ajuste, deja los cambios sin commitear hasta que él diga "haz commit" (lo cual
  normalmente implica también push).
- Cuando commitees, hazlo en `ajustes-finales-2026-11-24` (la rama activa), no en
  `main`.
- Antes de cualquier operación destructiva (`reset --hard`, `checkout --`, etc.)
  corre `git status` y confirma que no se pierde nada.
- **Estado actual: los 3 ajustes de la sección 5 ya están comiteados en
  `ajustes-finales-2026-11-24`** (commit `d2b16df`, "Ajustes de cliente: imagen de
  Solución, tarjetas de Metales y PDFs de ficha técnica"), con confirmación explícita
  de German. **No se hizo push** — el commit es solo local. Corre `git log --oneline
  -1` para confirmarlo, y `git status` debería salir limpio (sin cambios pendientes)
  salvo lo que tú mismo vayas generando para el siguiente ajuste. Avísale a German
  cuándo conviene hacer push, pero no lo hagas sin que él lo confirme.

## 4. Servidor de desarrollo

Este proyecto usa Astro. Según `CLAUDE.md` del repo:

```
astro dev --background
```

para levantarlo, y `astro dev status` / `astro dev stop` / `astro dev logs` para
administrarlo. Verifica siempre cualquier cambio visual abriendo el preview en el
navegador — con este cliente no es opcional.

## 5. Trabajo ya terminado en esta ronda (rama `ajustes-finales-2026-11-24`)

Estos tres ajustes ya están implementados, verificados visualmente en el dev server,
y comiteados localmente (no mergeados a `main`, no pusheados):

### 5.1 Imagen de la sección "Solución" (home)

- Antes: foto de una ingeniera inspeccionando metal en almacén (de banco de imágenes).
- El cliente pidió: quitarla y poner una de contenedores/buque, generada con IA pero
  que no se vea "hiperrealista de IA".
- Se reemplazó `public/assets/img/solucion-ingeniero.webp` (mismo nombre de archivo,
  contenido nuevo) por una foto de un buque portacontenedores en puerto al atardecer.
- Se tuvo que difuminar/recortar el nombre del buque (aparecía legible, "MV
  ENDEAVOUR", generado por la IA) para no sugerir una asociación con una naviera real
  — mismo criterio que ya se aplicó antes en este proyecto con un logo real que
  apareció sin querer en otra foto de stock.
- Se actualizó el `alt` y el `--media-ratio` en `src/components/Solucion.astro` para
  que coincida con las dimensiones reales de la nueva imagen (1264×848).

### 5.2 Tarjetas de productos en Metales (home + /productos/metales)

Dos ajustes de agrupación en `src/components/Metales.astro` (array `categorias`):

- **Unir duplicados**: "Estaño" y "Alambre de Soldadura de Estaño" eran dos tarjetas
  separadas para el mismo elemento (Sn). El cliente pidió agruparlas. Ahora es una
  sola tarjeta "Estaño" con 6 productos (las 2 fichas de lingote + los 4 tipos de
  alambre de soldadura).
- **Separar lo que estaba junto**: "Metales Preciosos" era una sola tarjeta con Oro y
  Plata combinados (Au + Ag). El cliente pidió separarlos. Ahora son dos tarjetas
  independientes: "Oro" y "Plata", cada una con su propio ficha técnica.
- Se verificó que ningún enlace (`#alambre-estano`, `#metales-preciosos`) quedara
  roto — no había otras referencias en el código a esos ids.

### 5.3 Descarga de ficha técnica en PDF (Metales y Químicos)

El cliente pidió: en el modal que se abre al hacer clic en un producto (la ficha
técnica), agregar al final un enlace para descargar el PDF correspondiente, para
todos los productos que tengan PDF disponible.

German compartió dos carpetas de Google Drive con los PDFs reales (COA = Certificado
de Análisis) en español e inglés. Se descargaron y verificaron los 42 archivos (21
productos × 2 idiomas) por tamaño exacto y tipo MIME, y quedaron guardados en:

```
public/assets/docs/fichas/<fichaId>-es.pdf
public/assets/docs/fichas/<fichaId>-en.pdf
```

**Importante — no todos los productos tienen PDF.** Se le preguntó a German
explícitamente qué hacer con los que no tienen, y su respuesta fue: **agregar el
enlace solo donde exista el PDF; los productos sin PDF se quedan igual que antes, sin
enlace** (no mostrar "ficha no disponible" ni nada parecido).

- **Metales** (`src/components/Metales.astro`): de los 15 productos con ficha, solo
  6 (todos de tipo `'certificado'`, que son los que muestran tabla de composición
  química) tienen PDF: `estano-grado-a`, `estano-4n`, `antimonio-lingote`,
  `antimonio-polvo`, `soleras-cobre`, `hojas-aluminio`. Hay un `Set` llamado
  `FICHAS_CON_PDF` en el frontmatter del componente que controla cuáles muestran el
  enlace. **Si German confirma que llegaron PDFs nuevos para alguno de los 9
  restantes** (`antimonio-granalla`, `zinc`, `plomo`, `oro`, `plata`, `selenio`,
  `contactos-bimetalicos`, `placas-bimetalicas`, `aluminio`), hay que: (1) agregar los
  2 archivos PDF a `public/assets/docs/fichas/` con la misma convención de nombre, y
  (2) agregar ese `id` al `Set` `FICHAS_CON_PDF`. Nada más — el resto del código ya
  está listo para renderizar el enlace automáticamente.
- **Químicos** (`src/components/Quimicos.astro`): los 15 productos tienen PDF, así
  que el enlace se agrega siempre, sin condición.
- El enlace usa un mecanismo nuevo: atributos `data-i18n-href-es` / `data-i18n-href-en`
  en el `<a>`, que se resuelven en `public/assets/js/main.js` dentro de
  `applyLangWithin` (se agregó ese bloque — antes esa función solo intercambiaba
  texto/`innerHTML`, no atributos `href`). Esto hace que el PDF que se descarga
  cambie según el idioma activo del sitio (ES/EN).
- **Cuidado al tocar este `<a>`**: el texto visible va en un `<span
  data-i18n-es="..." data-i18n-en="...">` separado del ícono SVG, NO directamente en
  el `<a>`. Si se pone `data-i18n-es`/`data-i18n-en` directo en el `<a>` que también
  contiene el ícono, el cambio de idioma borra el ícono (sobreescribe todo el
  `innerHTML`). Ya se corrigió este bug una vez en esta misma ronda — no reintroducirlo.
- Estilo nuevo: `.ficha-pdf-link` en `public/assets/css/style.css`.
- Verificado en navegador: enlace visible con ícono, `href` correcto en ambos
  idiomas, PDFs responden `200 application/pdf` vía `curl`, y los 9 productos de
  metales sin PDF correctamente NO muestran el enlace.

## 6. Qué sigue

No hay más ajustes pendientes todavía — German los va dando uno por uno conforme el
cliente los revisa. **No inventes ni adelantes trabajo**: espera a que German
comparta el siguiente ajuste (normalmente con una captura de pantalla) y trabájalo
con el mismo nivel de cuidado que los tres anteriores — implementar, verificar
visualmente en el dev server, y dejarlo listo para que German lo revise antes de
pedir commit/push.

## 7. Mapa rápido de archivos relevantes

- `src/components/Hero.astro`, `Solucion.astro` — home, arriba del todo.
- `src/components/Metales.astro`, `Quimicos.astro` — catálogo de productos, usados
  tanto en home (resumen) como en `/productos/metales` y `/productos/quimicos`
  (completo, con fichas técnicas en modal).
- `src/components/Calidad.astro` — certificado ISO, mismo patrón de enlace a PDF
  estático (sin variación de idioma) que ya existía antes de esta ronda.
- `public/assets/img/` — imágenes del sitio.
- `public/assets/docs/fichas/` — PDFs de fichas técnicas (nuevo, creado en esta ronda).
- `public/assets/docs/certificado-iso-9001-2015-conext.pdf` — certificado ISO (previo).
- `public/assets/css/style.css`, `public/assets/js/main.js`, `public/assets/js/i18n.js`
  — estilos y lógica compartida, incluido el sistema de idioma ES/EN.
