# Manual de Usuario — Plataforma ALADIL

## Introducción

La plataforma ALADIL es el sistema de gestión integral de la Asociación Latinoamericana de Diagnóstico In Vitro por Laboratorio. Cuenta con dos grandes áreas:

1. **Sitio web público**: accesible para cualquier visitante, presenta información institucional, noticias, reuniones, laboratorios miembros y el comité ejecutivo.
2. **Intranet administrativa**: accesible solo para usuarios registrados, permite gestionar todo el contenido del sitio y operar el Programa PILA de indicadores de calidad.

---

## 1. Sitio Web Público

El sitio público no requiere inicio de sesión y está disponible para cualquier persona.

### 1.1 Página de Inicio

La página principal presenta:

- **Carrusel** con contenido destacado.
- **Sección "Quiénes somos"** con la misión de ALADIL.
- **Últimas noticias** publicadas (las 3 más recientes).
- **Próximas reuniones** (las 3 más recientes).
- **Comité Ejecutivo** (los primeros 4 miembros activos).
- **Mapa interactivo** de laboratorios miembros con ubicación geográfica.
- **Formulario de contacto**.
- **Sección de socios**.

### 1.2 Noticias

- **Listado de noticias**: muestra todas las noticias publicadas con imagen de portada, fecha y resumen.
- **Detalle de noticia**: artículo completo con contenido enriquecido, autor, fecha de publicación e imágenes.

### 1.3 Reuniones

- **Listado de reuniones**: muestra todas las reuniones publicadas en orden cronológico con imagen de portada y ubicación.
- **Detalle de reunión**: información completa incluyendo fechas, sede, anfitrión, contenido descriptivo, galería de fotos y descarga de temas en PDF.

### 1.4 Comité Ejecutivo

Muestra los miembros activos del comité ejecutivo con foto, cargo, país y laboratorio de pertenencia.

### 1.5 Formulario de Contacto

Permite a cualquier visitante enviar un mensaje a ALADIL completando nombre, correo electrónico y texto del mensaje.

---

## 2. Acceso a la Intranet

### 2.1 Inicio de Sesión

Para acceder a la intranet, ingrese a la página de login con su correo electrónico y contraseña. Tras la autenticación exitosa, será redirigido al panel de administración.

> Las credenciales son proporcionadas por un administrador del sistema.

### 2.2 Roles de Usuario

Cada usuario tiene asignado uno o más roles que determinan qué secciones puede ver y qué acciones puede realizar:

| Rol | Alcance | Descripción |
|-----|---------|-------------|
| **Administrador** | Intranet completa | Acceso total: gestión de contenido, usuarios, indicadores PILA y revisión de reportes. |
| **Director** | Intranet (lectura) + PILA (propio) | Puede visualizar todo el contenido de la intranet. En PILA, accede a los reportes de su laboratorio y al informe integrado anónimo. |
| **Reportador** | Solo PILA | Acceso exclusivo al Programa PILA para cargar reportes mensuales de su laboratorio y descargar el informe integrado. |

Adicionalmente, para el Programa PILA existen roles específicos:

| Rol PILA | Descripción |
|----------|-------------|
| **Reportador PILA** | Carga y envía reportes mensuales de indicadores de su laboratorio. Puede ver sus propios reportes. |
| **Administrador PILA** | Gestiona indicadores, revisa reportes de todos los laboratorios, descarga informes completos. |

Un mismo usuario puede combinar roles. Por ejemplo, un usuario puede ser **Director** (ve toda la intranet) y **Reportador PILA** (carga reportes de su laboratorio).

---

## 3. Panel de Administración

Al ingresar a la intranet, el panel lateral izquierdo muestra las secciones disponibles según su rol.

### 3.1 Panel Principal (Dashboard)

*Disponible para: Administrador, Director*

Vista general con estadísticas rápidas:
- Cantidad de noticias.
- Cantidad de reuniones.
- Cantidad de laboratorios.
- Cantidad de miembros del comité ejecutivo.

Incluye accesos directos a las secciones más utilizadas.

---

## 4. Gestión de Contenido

Las siguientes secciones permiten administrar el contenido que se muestra en el sitio web público.

### 4.1 Noticias

*Disponible para: Administrador, Director*

#### Listado
- Tabla con todas las noticias existentes.
- Cada noticia muestra: título, estado (Borrador / Publicada / Archivada) y fecha.
- Acciones disponibles: editar, eliminar, publicar, archivar.

#### Crear / Editar Noticia
- **Título**: nombre de la noticia.
- **Slug**: URL amigable (se genera automáticamente a partir del título, pero es editable).
- **Extracto**: resumen corto para listados.
- **Contenido**: editor de texto enriquecido con soporte para formato, encabezados, listas, citas, imágenes, enlaces y alineación.
- **Imagen de portada**: selección de imagen para la portada de la noticia.
- **Estado**: Borrador (no visible en el sitio) o Publicada (visible para todos).

### 4.2 Reuniones

*Disponible para: Administrador, Director*

#### Listado
- Tabla con todas las reuniones registradas.
- Muestra: número, título, estado y fecha de inicio.
- Acciones: editar, eliminar, publicar, archivar.

#### Crear / Editar Reunión
- **Número**: número de la reunión (ej: 36).
- **Título**: nombre descriptivo.
- **Ciudad y país**: ubicación de la reunión.
- **Fechas**: fecha de inicio y fin.
- **Anfitrión**: nombre del anfitrión o laboratorio sede.
- **Resumen y contenido**: descripción con editor de texto enriquecido.
- **Imagen de portada**: imagen representativa.
- **PDF de temas**: documento descargable con los temas de la reunión.
- **Estado**: Borrador o Publicada.

### 4.3 Laboratorios

*Disponible para: Administrador, Director*

#### Listado
- Todos los laboratorios miembros de ALADIL.
- Muestra: nombre, país, ciudad y estado (activo/inactivo).
- Acciones: editar, eliminar, activar/desactivar.

#### Crear / Editar Laboratorio
- **Nombre**: nombre oficial del laboratorio.
- **País**: código de país.
- **Ciudad**: ubicación.
- **Sitio web**: URL del sitio del laboratorio.
- **Logo**: imagen del logo institucional.
- **Orden**: posición en el listado.
- **Estado**: activo o inactivo.

### 4.4 Comité Ejecutivo

*Disponible para: Administrador, Director*

#### Listado
- Todos los miembros del comité ejecutivo.
- Muestra: nombre, cargo, país y estado.
- Acciones: editar, eliminar, activar/desactivar.

#### Crear / Editar Miembro
- **Nombre completo**.
- **Cargo**: posición en el comité (ej: Presidente, Vicepresidente).
- **País**.
- **Laboratorio**: laboratorio de pertenencia.
- **Foto**: imagen del miembro.
- **Orden**: posición en el listado.
- **Estado**: activo o inactivo.

### 4.5 Mensajes de Contacto

*Disponible para: Administrador, Director*

- Bandeja de entrada con los mensajes recibidos del formulario de contacto del sitio público.
- Filtrado por estado: Nuevo, Leído, Archivado.
- Al abrir un mensaje se muestra el contenido completo, nombre y correo del remitente.
- Los mensajes se marcan como leídos automáticamente al abrirlos.
- Es posible archivar y desarchivar mensajes.

### 4.6 Nuevas Tecnologías

*Disponible para: Administrador, Director*

Sección en desarrollo. Próximamente se habilitará contenido relacionado con nuevas tecnologías del sector.

---

## 5. Programa PILA

El Programa de Indicadores de Laboratorio de ALADIL (PILA) es un sistema de evaluación de calidad donde cada laboratorio miembro reporta mensualmente indicadores estandarizados.

### 5.1 Vista del Reportador

*Disponible para: usuarios con rol Reportador PILA*

#### Mis Reportes
- Lista de todos los reportes cargados por el usuario, filtrados por año.
- Cada reporte muestra: mes, año, laboratorio y estado.
- Los estados posibles son:
  - **Borrador**: el reporte fue guardado pero no enviado. Puede ser editado.
  - **Enviado**: el reporte fue enviado para revisión. Ya no puede ser editado.
  - **Revisado**: el administrador revisó y aprobó el reporte.

#### Notificación de Reporte Pendiente
- Si no se ha cargado el reporte del mes actual, se muestra una alerta con un enlace directo para crearlo.

#### Crear Nuevo Reporte
1. Seleccione el **año** y **mes** del reporte.
2. Complete los valores de cada indicador:
   - **Numerador**: valor del numerador según la fórmula del indicador.
   - **Denominador**: valor del denominador.
   - El **porcentaje** se calcula automáticamente.
3. Cada indicador muestra su fórmula, consideraciones y exclusiones como referencia.
4. Opcionalmente agregue **notas** aclaratorias.
5. Puede **guardar como borrador** para continuar después o **enviar** directamente.

#### Editar Reporte
- Solo es posible editar reportes en estado **Borrador**.
- Los reportes Enviados y Revisados son de solo lectura.

#### Enviar Reporte
- Desde la lista de reportes, presione **Enviar** en un reporte en Borrador.
- Se solicitará confirmación: una vez enviado, el reporte no podrá ser editado.

### 5.2 Informe Mensual Integrado (Anónimo)

*Disponible para: todos los usuarios con acceso a PILA*

Permite descargar el informe consolidado de todos los laboratorios para un mes dado.

- Seleccione **año** y **mes**.
- Los botones **Descargar Informe** (PDF) y **Descargar CSV** solo se habilitan cuando **todos** los reportes del mes han sido revisados por el administrador.
- Si el informe no está disponible, se muestra un aviso indicando cuántos reportes faltan por revisar (ej: "3 de 10 reportes revisados").
- Los nombres de los laboratorios **no se muestran** en el informe: cada laboratorio aparece como "Lab 1", "Lab 2", etc., preservando la confidencialidad.

### 5.3 Vista del Administrador PILA

*Disponible para: usuarios con rol Administrador PILA*

#### Panel de Administración
- Filtros por año, mes y estado.
- Tarjetas de estadísticas: total de laboratorios, reportes enviados, revisados y borradores.
- Lista de todos los reportes de todos los laboratorios con:
  - Nombre del laboratorio y país.
  - Mes, año y estado.
  - Quién envió y cuándo.
  - Quién revisó y cuándo.

#### Acciones sobre Reportes
- **Marcar como revisado**: cambia el estado de Enviado a Revisado. Solo disponible para reportes Enviados.
- **Reabrir reporte**: devuelve un reporte Enviado o Revisado a estado Borrador para que el reportador lo corrija.
- **Eliminar reporte**: elimina permanentemente un reporte.

#### Gestión de Indicadores

Permite configurar los indicadores que los laboratorios deben reportar cada mes:

- **Código**: identificador corto del indicador (ej: IND-01).
- **Nombre**: descripción del indicador.
- **Fórmula**: fórmula de cálculo.
- **Etiqueta del numerador**: qué representa el numerador.
- **Etiqueta del denominador**: qué representa el denominador.
- **Consideraciones**: criterios de cálculo.
- **Exclusiones**: qué excluir del cálculo.
- **Orden**: posición en el formulario de reporte.
- **Estado**: activo o inactivo. Los indicadores inactivos no aparecen en los formularios de reporte.

Se pueden crear, editar, activar/desactivar y eliminar indicadores.

---

## 6. Gestión de Usuarios

*Disponible para: Administrador*

### 6.1 Listado de Usuarios

Tabla con todos los usuarios del sistema mostrando:
- Correo electrónico.
- Nombre.
- Laboratorio asignado.
- Roles (se muestran etiquetas de color por cada rol asignado).
- Estado (Activo / Inactivo).

Acciones disponibles:
- **Editar**: modificar datos y roles del usuario.
- **Activar / Desactivar**: controlar el acceso del usuario sin eliminarlo.
- **Eliminar**: eliminar permanentemente al usuario.

> No es posible eliminar ni desactivar su propia cuenta.

### 6.2 Crear Usuario

Para crear un nuevo usuario:

1. **Correo electrónico**: debe ser único en el sistema.
2. **Nombre**: nombre completo del usuario.
3. **Contraseña**: mínimo 8 caracteres.
4. **Laboratorio**: todo usuario debe estar asignado a un laboratorio. Por defecto se asigna ALADIL para usuarios que no pertenecen a un laboratorio específico.
5. **Estado**: activo o inactivo.
6. **Rol Principal** (Intranet):
   - *Administrador*: acceso y edición total de la intranet.
   - *Director*: lectura de todos los módulos de la intranet.
   - *Reportador*: acceso limitado al Programa PILA.
7. **Rol PILA**:
   - *Sin rol PILA*: el usuario no participa del programa.
   - *Reportador PILA*: carga reportes mensuales de su laboratorio.
   - *Administrador PILA*: gestiona indicadores y revisa todos los reportes.

### 6.3 Editar Usuario

Permite modificar todos los datos del usuario:
- Los campos de correo, nombre, laboratorio, estado y roles son editables.
- El campo de contraseña es opcional: dejarlo vacío mantiene la contraseña actual.

---

## 7. Flujo Típico del Programa PILA

A continuación se describe el flujo mensual habitual del programa:

```
┌──────────────────────────────────────────────────────────────┐
│  1. CARGA DE REPORTES (Reportadores)                         │
│     Cada laboratorio carga su reporte mensual con los        │
│     valores de cada indicador. Puede guardar como borrador   │
│     y completar después.                                     │
├──────────────────────────────────────────────────────────────┤
│  2. ENVÍO (Reportadores)                                     │
│     Una vez completo, el reportador envía el reporte.        │
│     A partir de este momento no puede editarlo.              │
├──────────────────────────────────────────────────────────────┤
│  3. REVISIÓN (Administrador PILA)                            │
│     El administrador revisa cada reporte enviado.            │
│     Si encuentra errores, puede reabrir el reporte para      │
│     que el reportador lo corrija.                            │
│     Si está correcto, lo marca como revisado.                │
├──────────────────────────────────────────────────────────────┤
│  4. INFORME INTEGRADO (Todos)                                │
│     Una vez que TODOS los reportes del mes están revisados,  │
│     se habilita la descarga del informe integrado anónimo    │
│     en formato PDF o CSV.                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Preguntas Frecuentes

**P: Olvidé mi contraseña, ¿cómo la recupero?**
R: Contacte a un administrador del sistema para que le asigne una nueva contraseña.

**P: ¿Por qué no puedo editar un reporte PILA?**
R: Los reportes solo pueden editarse en estado Borrador. Si ya fue enviado, contacte al administrador PILA para que lo reabra.

**P: ¿Por qué no puedo descargar el informe integrado?**
R: El informe integrado solo está disponible cuando todos los laboratorios han enviado su reporte y el administrador los ha revisado. Verifique el indicador de estado que muestra cuántos reportes han sido revisados.

**P: ¿Puedo tener más de un rol?**
R: Sí. Un usuario puede tener un rol en la Intranet (Administrador, Director o Reportador) y un rol PILA (Reportador PILA o Administrador PILA) simultáneamente.

**P: ¿Qué significa el laboratorio "ALADIL" asignado a un usuario?**
R: Es el laboratorio por defecto para usuarios que pertenecen a la asociación pero no están vinculados a un laboratorio miembro específico (ej: personal administrativo).

---

*Plataforma ALADIL — Manual de Usuario v1.0*
