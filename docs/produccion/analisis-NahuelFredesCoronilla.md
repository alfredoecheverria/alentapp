# Analisis de la infraestructura Docker actual
| Problema | ¿Dónde ocurre? | Impacto | Solucion propuesta |
| --- | --- | --- | --- |
| Credenciales en el compose| docker-compose.yml:5-8 | Alto | Mover credenciales a variables de entorno en un archivo .env y referenciarlas desde docker-compose.yml |
| Puerto de la db expuesto | docker-compose.yml:9-10  | Alto | Quitar el mapeo para produccion |
| Faltan healthchecks | docker-compose.yml| Medio | Agregar healthchecks para api y frontend |
| Variables de polling en Compose | docker-compose.yml:48-50 y docker-compose.yml:31-32| Medio | Eliminar `CHOKIDAR_USEPOLLING`/`WATCHPACK_POLLING` en producción, activarlas solo en desarrollo |
| Usuario root en las imágenes | packages/api/Dockerfile y packages/web/Dockerfile | Alto | Crear y usar un usuario sin privilegios |


# Investigacion de OpenTelemetry
### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
 
OpenTelemetry, también conocido como OTel, es un framework  de observabilidad de código abierto e independiente del proveedor para instrumentar, generar, recopilar y exportar datos de telemetría como trazas, métricas y registros.

Prometheus ofrece herramientas para la supervisión, el almacenamiento y la visualización de métricas, pero no rastrea los registros ni los rastreos de soporte, que se utilizan para el análisis de la causa raíz. En general, Prometheus tiene casos de uso más limitados que OpenTelemetry.

OpenTelemetry puede procesar y rastrear métricas más complejas que Prometheus a través de integraciones agnósticas del lenguaje de programación. OTel es altamente escalable y tiene mayor extensibilidad que Prometheus al ofrecer modelos de instrumentación automatizados. A diferencia de Prometheus, OpenTelemetry no ofrece una solución de almacenamiento y debe emparejarse con un sistema back-end independiente.

Fuente: [IBM — OpenTelemetry vs Prometheus](https://www.ibm.com/es-es/think/topics/opentelemetry-vs-prometheus)

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
Los tres pilares de la observabilidad son:

    - Metricas: Mediciones numéricas recopiladas periódicamente que describen el estado y el rendimiento de un sistema a lo largo del tiempo.

    - Logs: Son registros cronológicos de eventos generados por aplicaciones, servicios o dispositivos. Contienen información detallada sobre acciones, errores, advertencias y procesos ejecutados.
    
    - Trazas: Representaciones del recorrido completo de una solicitud o transacción a través de uno o varios componentes de un sistema.

OpenTelemetry aborda los tres pilares de la observabilidad.    

### Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?
Las métricas RED son una metodología de monitoreo propuesta por Tom Wilkie para medir el estado de servicios y APIs. Se centra en tres métricas clave:

    -Rate: número de solicitudes por segundo

    -Errors: número de solicitudes que fallan
    
    -Duration: tiempo que tardan esas solicitudes

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
OTLP (OpenTelemetry Protocol) es el protocolo de comunicación utilizado por OpenTelemetry para exportar métricas, logs y trazas de manera estandarizada entre aplicaciones, colectores y plataformas de observabilidad.
La principal ventaja de OTLP frente a exportar directamente a Prometheus es la independencia del backend de observabilidad.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
OpenTelemetry ofrece herramientas, SDK y estándares de código abierto, independientes del proveedor, para la observabilidad de aplicaciones. Esto encaja a la perfección con la estrategia integral de la plataforma de observabilidad Grafana, que busca fomentar la interoperabilidad y la libertad de elección. La capacidad de integrar la telemetría de infraestructura y plataforma.