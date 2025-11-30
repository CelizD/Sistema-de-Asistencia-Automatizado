# TODO - Sistema de Asistencia con Cámaras IP

## Base de Datos y Modelos
- [x] Crear tabla de cámaras (cameras) con campos: id, nombre, URL de stream, ubicación, estado, tipo
- [x] Crear tabla de detecciones (detections) con campos: id, cameraId, timestamp, personCount, chairCount, occupancyRate
- [x] Crear tabla de sesiones de monitoreo (monitoring_sessions) con campos: id, cameraId, startTime, endTime, status
- [x] Ejecutar migración de base de datos

## API Backend
- [x] Implementar procedimiento para listar cámaras
- [x] Implementar procedimiento para agregar nueva cámara
- [x] Implementar procedimiento para actualizar cámara
- [x] Implementar procedimiento para eliminar cámara
- [x] Implementar procedimiento para obtener detecciones por cámara
- [x] Implementar procedimiento para registrar nueva detección
- [x] Implementar procedimiento para obtener estadísticas de ocupación

## Interfaz de Usuario
- [x] Configurar tema oscuro y paleta de colores
- [x] Crear layout principal con navegación lateral (DashboardLayout)
- [x] Diseñar página de inicio con resumen general
- [x] Crear componente de tarjeta de cámara

## Gestión de Cámaras
- [x] Crear página de lista de cámaras
- [x] Implementar formulario para agregar cámara
- [x] Implementar formulario para editar cámara
- [x] Agregar funcionalidad de eliminar cámara con confirmación
- [x] Mostrar estado de conexión de cada cámara

## Sistema de Detección y Monitoreo
- [x] Crear página de monitoreo en tiempo real
- [x] Implementar visualización de stream de cámara
- [x] Mostrar contador de personas detectadas
- [x] Mostrar contador de sillas detectadas
- [x] Calcular y mostrar porcentaje de ocupación
- [x] Agregar indicadores visuales de estado

## Visualización de Estadísticas
- [x] Crear página de estadísticas
- [x] Implementar gráfico de ocupación por hora
- [x] Implementar gráfico de ocupación por día
- [x] Mostrar tabla de resumen de detecciones
- [x] Agregar filtros por fecha y cámara

## Testing y Documentación
- [x] Escribir tests para procedimientos de cámaras
- [x] Escribir tests para procedimientos de detecciones
- [x] Crear checkpoint del proyecto

## Integración Frontend-Developer-Computer-Vision

### Gestión de Usuarios y Roles
- [ ] Expandir tabla de usuarios con campos adicionales (avatar, departamento, permisos)
- [ ] Implementar CRUD completo de usuarios en el backend
- [ ] Crear interfaz de gestión de usuarios con tabla y formularios
- [ ] Agregar sistema de roles y permisos avanzado

### Gestión de Salas/Espacios
- [x] Crear tabla de salas (rooms) con capacidad, ubicación, tipo
- [x] Implementar procedimientos para gestionar salas
- [x] Crear interfaz para administrar salas
- [ ] Vincular cámaras con salas específicas

### Heatmaps de Ocupación
- [x] Crear componente de Heatmap visual para mostrar ocupación de sillas
- [x] Implementar sistema de grid configurable por sala
- [x] Agregar visualización en tiempo real de sillas ocupadas/vacías
- [x] Implementar colores dinámicos según estado de ocupación

### Sistema de Logs y Auditoría
- [x] Crear tabla de logs de actividad del sistema
- [x] Registrar eventos importantes (login, cambios, alertas)
- [x] Crear vista de logs con filtros y búsqueda
- [ ] Implementar exportación de logs

### Reportes Avanzados
- [ ] Crear sistema de generación de reportes personalizados
- [ ] Implementar exportación a CSV/Excel
- [ ] Agregar filtros por fecha, sala, cámara
- [ ] Crear plantillas de reportes predefinidos

### Analytics Mejorado
- [x] Agregar gráficos de tendencias por hora del día
- [ ] Implementar comparación entre diferentes períodos
- [x] Crear dashboard de analytics con múltiples métricas
- [ ] Agregar predicciones y proyecciones

### Sistema de Alertas
- [x] Crear tabla de alertas configurables
- [x] Implementar notificaciones en tiempo real
- [ ] Agregar sonidos y notificaciones visuales
- [x] Crear panel de configuración de alertas

### Mejoras de UI/UX
- [x] Implementar sistema de notificaciones Toast
- [ ] Agregar tour guiado para nuevos usuarios
- [ ] Mejorar navegación con breadcrumbs
- [ ] Implementar modo de pantalla completa para monitoreo


## Mejoras según Propuesta Estructurada

### Rediseño de Interfaz Principal
- [ ] Crear landing page profesional con descripción del sistema
- [x] Rediseñar dashboard principal con métricas clave destacadas
- [x] Implementar navegación mejorada con sidebar colapsable
- [ ] Agregar breadcrumbs para mejor orientación
- [x] Mejorar diseño responsive para tablets y móviles

### Sistema de Configuración Avanzada
- [ ] Crear página de configuración de salones con layout visual
- [ ] Implementar configuración de zonas de detección por cámara
- [ ] Agregar calibración de cámaras con preview en vivo
- [ ] Crear sistema de plantillas para configuraciones comunes
- [ ] Implementar importación/exportación de configuraciones

### Heatmaps Mejorados
- [ ] Integrar heatmaps con detecciones en tiempo real
- [ ] Agregar vista 3D de ocupación del salón
- [ ] Implementar animaciones de transición de estados
- [ ] Crear modo de comparación entre múltiples salones
- [ ] Agregar overlay de información al pasar el mouse

### Sistema de Reportes Completo
- [ ] Crear generador de reportes personalizados
- [ ] Implementar exportación a Excel con gráficos
- [ ] Agregar exportación a PDF con formato profesional
- [ ] Crear reportes por materia y profesor
- [ ] Implementar gráficos de tendencia de asistencia
- [ ] Agregar filtros avanzados (fecha, sala, horario)

### Sistema de Alertas Avanzado
- [ ] Implementar alertas por baja asistencia en tiempo real
- [ ] Agregar notificaciones visuales en el dashboard
- [ ] Crear sistema de sonidos para alertas críticas
- [ ] Implementar configuración de umbrales por sala
- [ ] Agregar historial de alertas disparadas

### Gestión de Usuarios y Permisos
- [ ] Crear página de gestión de usuarios administrativos
- [ ] Implementar sistema de roles (Admin, Profesor, Visualizador)
- [ ] Agregar permisos granulares por funcionalidad
- [ ] Crear perfil de usuario con configuraciones personales
- [ ] Implementar logs de auditoría por usuario

### Mejoras de Rendimiento y Seguridad
- [ ] Implementar paginación en tablas grandes
- [ ] Agregar carga lazy de imágenes y videos
- [ ] Optimizar consultas de base de datos
- [ ] Implementar rate limiting en API
- [ ] Agregar validación robusta de inputs

### Documentación y Ayuda
- [ ] Crear página de ayuda con FAQs
- [ ] Agregar tooltips explicativos en toda la interfaz
- [ ] Implementar tour guiado para nuevos usuarios
- [ ] Crear documentación técnica de la API
- [ ] Agregar changelog visible de versiones


## Implementación de Funcionalidad Real

### Backend de Procesamiento de Video
- [x] Instalar dependencias para procesamiento de video (ffmpeg, opencv)
- [x] Crear servicio de captura de frames desde streams RTSP/HTTP
- [ ] Implementar cola de procesamiento de video
- [ ] Agregar manejo de reconexión automática para cámaras

### Integración de Detección de Objetos
- [x] Integrar modelo YOLO o similar para detección de personas
- [x] Implementar detección de sillas/asientos
- [ ] Crear sistema de tracking de objetos entre frames
- [ ] Optimizar rendimiento de inferencia

### Streaming en Tiempo Real
- [ ] Implementar WebSocket para streaming de video procesado
- [x] Crear endpoint para obtener frame actual con detecciones
- [ ] Agregar overlay de bounding boxes en video
- [ ] Implementar controles de reproducción (play/pause/stop)

### Detección Automática Continua
- [x] Crear worker para procesamiento continuo de cámaras activas
- [x] Implementar registro automático de detecciones en base de datos
- [x] Agregar sistema de intervalos configurables por cámara
- [ ] Crear alertas automáticas basadas en umbrales

### Almacenamiento y Persistencia
- [ ] Guardar frames procesados en S3
- [ ] Almacenar metadata de detecciones con referencias a frames
- [ ] Implementar limpieza automática de datos antiguos
- [ ] Crear sistema de snapshots por evento

### Calibración y Configuración
- [ ] Agregar interfaz para definir zonas de interés (ROI)
- [ ] Implementar calibración de confianza de detección
- [ ] Crear sistema de validación de detecciones
- [ ] Agregar configuración de horarios de monitoreo


## Continuación - Funcionalidades Finales

### Procesamiento Continuo Automático
- [x] Crear servicio de background para procesamiento automático
- [x] Implementar gestión de procesadores activos (start/stop)
- [x] Agregar interfaz para configurar intervalos por cámara
- [x] Mostrar estado de procesamiento en tiempo real

### Vinculación Cámaras-Salas
- [x] Agregar campo roomId en tabla cameras
- [x] Actualizar interfaz de cámaras para asignar sala
- [ ] Conectar detecciones con heatmap de sala
- [ ] Mostrar estadísticas agregadas por sala

### Sistema de Alertas Automáticas
- [ ] Implementar verificación de umbrales en detecciones
- [ ] Crear notificaciones automáticas cuando se superen límites
- [ ] Agregar configuración de alertas por cámara/sala
- [ ] Mostrar alertas activas en dashboard

### Exportación de Reportes
- [ ] Implementar generación de CSV con detecciones
- [ ] Crear reportes PDF con gráficos
- [ ] Agregar filtros avanzados (fecha, cámara, sala)
- [ ] Permitir descarga de reportes desde interfaz

### Gestión de Usuarios
- [ ] Crear página de administración de usuarios
- [ ] Implementar CRUD completo de usuarios
- [ ] Agregar asignación de roles (admin/user)
- [ ] Proteger rutas según permisos
