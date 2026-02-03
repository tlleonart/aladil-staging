# ALADIL - Checklist de Testing Manual

Este documento contiene un checklist completo para testing manual del sitio web público y la intranet de administración de ALADIL.

**Fecha de creación:** Febrero 2026
**Versión:** 1.0

---

## Tabla de Contenidos

1. [Sitio Público](#1-sitio-público)
2. [Intranet de Administración](#2-intranet-de-administración)
3. [Responsive Design](#3-responsive-design)
4. [Cross-Browser Testing](#4-cross-browser-testing)
5. [Performance](#5-performance)
6. [SEO y Accesibilidad](#6-seo-y-accesibilidad)

---

## 1. Sitio Público

### 1.1 Página Principal (Home)

#### Hero Carousel
- [ ] El carousel se muestra correctamente con las imágenes
- [ ] La navegación automática funciona (cada 6 segundos)
- [ ] Los botones de navegación (flechas) funcionan
- [ ] Los indicadores de slide (dots) funcionan y muestran el slide activo
- [ ] El texto superpuesto es legible
- [ ] El carousel se ve correctamente en diferentes tamaños de pantalla

#### Sección "Sobre ALADIL"
- [ ] El título y descripción se muestran correctamente
- [ ] Las tarjetas de Misión y Visión se renderizan bien
- [ ] Los iconos se muestran correctamente
- [ ] El hover en las tarjetas funciona

#### Sección "Valores Institucionales"
- [ ] Los 6 valores se muestran en grid
- [ ] Cada valor tiene su icono con el color correcto
- [ ] El hover effect funciona en cada tarjeta
- [ ] El texto es legible

#### Sección "Nuestra Historia"
- [ ] La imagen histórica se carga correctamente
- [ ] El texto está bien formateado
- [ ] El layout de dos columnas funciona
- [ ] La imagen tiene hover effect

#### Sección "Socios" (Partners)
- [ ] El mapa interactivo se carga correctamente
- [ ] Los marcadores de laboratorios se muestran en el mapa
- [ ] Al hacer click en un marcador se abre el popup con info
- [ ] Los logos de laboratorios se muestran en el grid
- [ ] El mapa NO queda por encima del header al hacer scroll
- [ ] El zoom del mapa funciona correctamente

#### Sección "Reuniones Recientes"
- [ ] Se muestran las 3 reuniones más recientes
- [ ] Las imágenes de cover se cargan
- [ ] El botón "Ver todas las reuniones" funciona
- [ ] Las tarjetas son clickeables y llevan al detalle
- [ ] Se muestra número de reunión, ubicación y fecha
- [ ] El hover effect funciona

#### Sección "Comité Ejecutivo"
- [ ] Se muestran los 4 miembros del comité
- [ ] Las fotos se cargan correctamente
- [ ] Se muestra nombre, cargo y laboratorio
- [ ] El botón "Ver comité completo" funciona
- [ ] Las banderas de país se muestran

#### Sección "Últimas Noticias"
- [ ] Se muestran las 3 noticias más recientes (si hay)
- [ ] Las imágenes de cover se cargan
- [ ] El botón "Ver todas las noticias" funciona
- [ ] Las tarjetas son clickeables
- [ ] Se muestra fecha de publicación
- [ ] Estado vacío se muestra si no hay noticias

#### Sección "Contacto"
- [ ] El formulario se muestra correctamente
- [ ] Todos los campos son requeridos y se validan
- [ ] El envío del formulario funciona
- [ ] Se muestra mensaje de éxito/error
- [ ] Los datos de contacto se muestran (email, teléfono si aplica)

### 1.2 Header / Navegación

#### Desktop
- [ ] El logo se muestra y es clickeable (lleva a home)
- [ ] Todos los links de navegación funcionan
- [ ] El dropdown de "Reuniones" se abre al hacer hover
- [ ] El dropdown muestra: Próxima Reunión, Última Reunión, Reuniones Anteriores
- [ ] Los links del dropdown funcionan correctamente
- [ ] El link "Quiénes Somos" lleva a la sección ancla (#quienes-somos)
- [ ] El header tiene z-index correcto (queda por encima del contenido)

#### Mobile
- [ ] El menú hamburguesa se muestra en pantallas pequeñas
- [ ] El menú se abre/cierra correctamente
- [ ] Todos los links funcionan en el menú móvil
- [ ] El dropdown de Reuniones funciona (click para expandir)
- [ ] El menú se cierra al seleccionar una opción

### 1.3 Footer

- [ ] El logo de ALADIL se muestra
- [ ] La descripción de la organización está presente
- [ ] Los links de navegación rápida funcionan
- [ ] Los links de recursos funcionan
- [ ] El año de copyright es correcto
- [ ] El layout se adapta correctamente en móvil

### 1.4 Página de Reuniones (/meetings)

- [ ] La página carga correctamente
- [ ] Se muestra el listado de todas las reuniones publicadas
- [ ] Las reuniones están ordenadas por fecha (más recientes primero)
- [ ] Cada tarjeta muestra: imagen, número, título, ubicación, fecha
- [ ] Las tarjetas son clickeables y llevan al detalle
- [ ] El estado vacío se muestra si no hay reuniones

### 1.5 Detalle de Reunión (/meetings/[slug])

- [ ] La página carga correctamente con datos reales
- [ ] El hero con imagen de cover se muestra (o gradiente si no hay imagen)
- [ ] El número de reunión se muestra en badge
- [ ] El título, ubicación y fecha se muestran
- [ ] El link "Volver a Reuniones" funciona
- [ ] El resumen se muestra si existe
- [ ] El contenido rich text se renderiza correctamente
- [ ] La galería de imágenes se muestra si hay imágenes
- [ ] Las imágenes de galería se cargan
- [ ] Estado vacío de galería se muestra si no hay imágenes
- [ ] El sidebar muestra todos los detalles:
  - [ ] Número de reunión
  - [ ] Ubicación
  - [ ] Fecha(s)
  - [ ] Laboratorio anfitrión (si aplica)
  - [ ] Badge de estado
- [ ] El link para descargar PDF de temas funciona (si existe)
- [ ] El PDF se descarga/abre correctamente
- [ ] La sección CTA al final funciona

### 1.6 Próxima Reunión (/meetings/next)

- [ ] La página carga correctamente
- [ ] Muestra la próxima reunión programada
- [ ] La información es correcta (fecha futura)
- [ ] El link de volver funciona

### 1.7 Última Reunión (/meetings/last)

- [ ] La página carga correctamente
- [ ] Muestra la última reunión realizada
- [ ] La información es correcta
- [ ] El link de volver funciona

### 1.8 Reuniones Anteriores (/meetings/past)

- [ ] La página carga correctamente
- [ ] Muestra el historial de reuniones
- [ ] Las reuniones recientes tienen tarjetas con imágenes
- [ ] El historial antiguo se muestra en formato lista
- [ ] El link de volver funciona

### 1.9 Página de Noticias (/news)

- [ ] La página carga correctamente
- [ ] Se muestra el listado de noticias publicadas
- [ ] Las noticias están ordenadas por fecha de publicación
- [ ] Cada tarjeta muestra: imagen, título, fecha, excerpt
- [ ] Las tarjetas son clickeables
- [ ] El estado vacío se muestra si no hay noticias

### 1.10 Detalle de Noticia (/news/[slug])

- [ ] La página carga correctamente
- [ ] La imagen de cover se muestra
- [ ] El título y fecha se muestran
- [ ] El contenido rich text se renderiza correctamente
- [ ] Los links dentro del contenido funcionan
- [ ] Las imágenes dentro del contenido se cargan
- [ ] El link "Volver a Noticias" funciona

### 1.11 Comité Ejecutivo (/executive)

- [ ] La página carga correctamente
- [ ] Se muestran todos los miembros activos del comité
- [ ] Cada miembro muestra: foto, nombre, cargo, laboratorio, país
- [ ] Las fotos se cargan correctamente
- [ ] El orden de los miembros es correcto

### 1.12 Páginas de Error

- [ ] La página 404 se muestra para rutas inexistentes
- [ ] El diseño de 404 es coherente con el sitio
- [ ] El link para volver a home funciona

---

## 2. Intranet de Administración

### 2.1 Autenticación

#### Login (/login)
- [ ] La página de login se muestra correctamente
- [ ] El formulario tiene campos de email y contraseña
- [ ] La validación de campos funciona
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Redirección a /admin después del login exitoso
- [ ] El logo de ALADIL se muestra

#### Sesión
- [ ] El usuario permanece logueado al refrescar
- [ ] El usuario es redirigido a login si no está autenticado
- [ ] El botón de logout funciona
- [ ] Después de logout, no se puede acceder a /admin

### 2.2 Dashboard (/admin)

- [ ] La página carga correctamente
- [ ] Se muestra el sidebar de navegación
- [ ] Se muestran estadísticas/resumen (si aplica)
- [ ] El nombre del usuario logueado se muestra
- [ ] El botón de logout está visible

### 2.3 Gestión de Laboratorios (/admin/labs)

#### Listado
- [ ] La tabla de laboratorios se muestra
- [ ] Se muestran todos los laboratorios
- [ ] Las columnas incluyen: nombre, país, estado, acciones
- [ ] El botón "Nuevo Laboratorio" funciona
- [ ] Los botones de editar/eliminar funcionan
- [ ] La búsqueda/filtrado funciona (si existe)

#### Crear Laboratorio (/admin/labs/new)
- [ ] El formulario se muestra correctamente
- [ ] Campos requeridos: nombre, país, código de país
- [ ] Campos opcionales: descripción, logo, ubicación (lat/lng)
- [ ] La subida de logo funciona
- [ ] La validación de campos funciona
- [ ] El guardado crea el laboratorio correctamente
- [ ] Se muestra mensaje de éxito
- [ ] Redirección al listado después de guardar

#### Editar Laboratorio (/admin/labs/[id])
- [ ] Los datos existentes se cargan en el formulario
- [ ] Se pueden modificar todos los campos
- [ ] Se puede cambiar/eliminar el logo
- [ ] El guardado actualiza el laboratorio
- [ ] Se muestra mensaje de éxito
- [ ] El botón cancelar funciona

#### Eliminar Laboratorio
- [ ] Se muestra confirmación antes de eliminar
- [ ] La eliminación funciona correctamente
- [ ] Se muestra mensaje de éxito
- [ ] El laboratorio desaparece del listado

### 2.4 Gestión de Miembros Ejecutivos (/admin/executive)

#### Listado
- [ ] La tabla de miembros se muestra
- [ ] Se muestran: foto, nombre, cargo, laboratorio, estado
- [ ] El botón "Nuevo Miembro" funciona
- [ ] Los botones de editar/eliminar funcionan
- [ ] Se puede ordenar por sortOrder

#### Crear Miembro (/admin/executive/new)
- [ ] El formulario se muestra correctamente
- [ ] Campos: nombre, cargo, email, teléfono, laboratorio, foto, orden, activo
- [ ] El selector de laboratorio funciona
- [ ] La subida de foto funciona
- [ ] La validación funciona
- [ ] El guardado crea el miembro
- [ ] Se muestra en el sitio público si está activo

#### Editar Miembro (/admin/executive/[id])
- [ ] Los datos existentes se cargan
- [ ] Se pueden modificar todos los campos
- [ ] Se puede cambiar/eliminar la foto
- [ ] El toggle de activo/inactivo funciona
- [ ] El guardado actualiza el miembro

#### Eliminar Miembro
- [ ] Confirmación antes de eliminar
- [ ] La eliminación funciona
- [ ] El miembro desaparece del sitio público

### 2.5 Gestión de Reuniones (/admin/meetings)

#### Listado
- [ ] La tabla de reuniones se muestra
- [ ] Se muestran: número, título, ubicación, fecha, estado
- [ ] El botón "Nueva Reunión" funciona
- [ ] Los botones de editar/eliminar funcionan
- [ ] Se puede filtrar por estado (borrador/publicado)

#### Crear Reunión (/admin/meetings/new)
- [ ] El formulario se muestra correctamente
- [ ] Campos básicos: número, título, slug (auto-generado), ciudad, país
- [ ] Campos de fecha: fecha inicio, fecha fin (opcional)
- [ ] Campos de anfitrión: laboratorio anfitrión o nombre de anfitrión
- [ ] Campos de contenido: resumen, contenido (editor rich text)
- [ ] Campos de media: imagen de cover, PDF de temas, galería
- [ ] Estado: borrador o publicado
- [ ] La subida de imagen de cover funciona
- [ ] La subida de PDF funciona
- [ ] La subida de múltiples imágenes a galería funciona
- [ ] El editor rich text funciona correctamente
- [ ] La validación funciona
- [ ] El guardado crea la reunión

#### Editar Reunión (/admin/meetings/[id])
- [ ] Los datos existentes se cargan
- [ ] El editor rich text muestra el contenido guardado
- [ ] Se pueden agregar/eliminar imágenes de galería
- [ ] Se puede reordenar la galería
- [ ] Se puede cambiar el estado a publicado
- [ ] El guardado actualiza la reunión

#### Eliminar Reunión
- [ ] Confirmación antes de eliminar
- [ ] La eliminación funciona
- [ ] Los assets asociados se manejan correctamente

### 2.6 Gestión de Noticias (/admin/news)

#### Listado
- [ ] La tabla de noticias se muestra
- [ ] Se muestran: título, fecha, estado
- [ ] El botón "Nueva Noticia" funciona
- [ ] Los botones de editar/eliminar funcionan

#### Crear Noticia (/admin/news/new)
- [ ] El formulario se muestra correctamente
- [ ] Campos: título, slug, excerpt, contenido (rich text), imagen de cover
- [ ] El editor rich text funciona:
  - [ ] Texto en negrita/cursiva
  - [ ] Encabezados (H1, H2, H3)
  - [ ] Listas ordenadas y desordenadas
  - [ ] Citas
  - [ ] Links
  - [ ] Imágenes
  - [ ] Alineación de texto
- [ ] La subida de imagen de cover funciona
- [ ] La validación funciona
- [ ] El guardado crea la noticia

#### Editar Noticia (/admin/news/[id])
- [ ] Los datos existentes se cargan
- [ ] El editor rich text muestra el contenido guardado
- [ ] Se puede publicar/despublicar
- [ ] El guardado actualiza la noticia

#### Eliminar Noticia
- [ ] Confirmación antes de eliminar
- [ ] La eliminación funciona

### 2.7 Gestión de Usuarios (/admin/users)

#### Listado
- [ ] La tabla de usuarios se muestra
- [ ] Se muestran: nombre, email, rol
- [ ] El botón "Nuevo Usuario" funciona
- [ ] Los botones de editar/eliminar funcionan
- [ ] No se puede eliminar el propio usuario

#### Crear Usuario (/admin/users/new)
- [ ] El formulario se muestra
- [ ] Campos: nombre, email, contraseña, rol
- [ ] La validación de email funciona
- [ ] El guardado crea el usuario
- [ ] El usuario puede hacer login

#### Editar Usuario (/admin/users/[id])
- [ ] Los datos existentes se cargan
- [ ] Se puede cambiar nombre, email, rol
- [ ] Se puede cambiar la contraseña (opcional)
- [ ] El guardado actualiza el usuario

### 2.8 Mensajes de Contacto (/admin/contact)

- [ ] El listado de mensajes se muestra
- [ ] Se muestran: nombre, email, mensaje, fecha, estado
- [ ] Se puede ver el detalle de un mensaje
- [ ] Se puede marcar como leído/archivado
- [ ] Se puede eliminar un mensaje

### 2.9 Gestión de Assets/Archivos

- [ ] La subida de imágenes funciona (JPG, PNG, WEBP)
- [ ] La subida de PDFs funciona
- [ ] El preview de imágenes se muestra
- [ ] Se puede eliminar un asset
- [ ] Los assets se guardan correctamente en Supabase Storage
- [ ] Las URLs públicas funcionan

---

## 3. Responsive Design

### Breakpoints a Testear
- [ ] Mobile (320px - 480px)
- [ ] Mobile grande (481px - 767px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1025px - 1440px)
- [ ] Desktop grande (1441px+)

### Elementos a Verificar en Cada Breakpoint

#### Sitio Público
- [ ] Header y navegación se adaptan
- [ ] Hero carousel se ve correctamente
- [ ] Grids de tarjetas se reorganizan
- [ ] Textos son legibles
- [ ] Imágenes se escalan correctamente
- [ ] El mapa de socios funciona
- [ ] Formulario de contacto es usable
- [ ] Footer se adapta

#### Intranet
- [ ] Sidebar se colapsa en móvil
- [ ] Tablas tienen scroll horizontal si es necesario
- [ ] Formularios son usables
- [ ] Botones son clickeables (tamaño adecuado)

---

## 4. Cross-Browser Testing

### Navegadores a Testear
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)
- [ ] Safari iOS
- [ ] Chrome Android

### Verificar en Cada Navegador
- [ ] El sitio carga correctamente
- [ ] Los estilos se aplican correctamente
- [ ] Las animaciones funcionan
- [ ] El carousel funciona
- [ ] El mapa de Leaflet funciona
- [ ] Los formularios funcionan
- [ ] La autenticación funciona
- [ ] Las subidas de archivos funcionan

---

## 5. Performance

### Tiempo de Carga
- [ ] Home page carga en menos de 3 segundos
- [ ] Las páginas internas cargan en menos de 2 segundos
- [ ] Las imágenes cargan progresivamente

### Optimización de Imágenes
- [ ] Las imágenes están optimizadas
- [ ] Se usa lazy loading donde corresponde
- [ ] Los tamaños de imagen son apropiados

### Lighthouse
- [ ] Performance score > 80
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 90

---

## 6. SEO y Accesibilidad

### SEO

#### Meta Tags
- [ ] Título único en cada página
- [ ] Meta description en cada página
- [ ] Open Graph tags presentes
- [ ] Canonical URLs correctas

#### Estructura
- [ ] Un solo H1 por página
- [ ] Jerarquía de encabezados correcta
- [ ] URLs amigables (slugs)
- [ ] Sitemap.xml accesible (/sitemap.xml)
- [ ] Robots.txt correcto (/robots.txt)

### Accesibilidad

#### General
- [ ] Contraste de colores adecuado
- [ ] Tamaño de fuente legible
- [ ] Links tienen estados hover/focus visibles
- [ ] Focus visible en navegación por teclado

#### Imágenes
- [ ] Todas las imágenes tienen alt text
- [ ] Alt text es descriptivo

#### Formularios
- [ ] Labels asociados a inputs
- [ ] Errores de validación son claros
- [ ] Campos requeridos están marcados

#### Navegación
- [ ] Se puede navegar solo con teclado
- [ ] El orden del tab es lógico
- [ ] Skip links presentes (si aplica)

#### Semántica
- [ ] Uso correcto de landmarks (header, main, footer, nav)
- [ ] Uso de ARIA donde corresponde
- [ ] Roles definidos en elementos interactivos

---

## Notas para el Tester

### Credenciales de Prueba
- **Admin:** (solicitar al equipo de desarrollo)
- **URL de staging:** (definir)

### Datos de Prueba
- Las reuniones #1 a #37 están cargadas
- Los 4 miembros del comité ejecutivo están cargados
- Los 14 laboratorios están cargados
- La reunión #35 tiene galería de imágenes y PDF de temas

### Reportar Bugs
Al reportar un bug, incluir:
1. URL donde ocurre
2. Pasos para reproducir
3. Resultado esperado
4. Resultado actual
5. Navegador y dispositivo
6. Screenshot o video (si aplica)

---

## Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| Feb 2026 | 1.0 | Versión inicial del checklist |
