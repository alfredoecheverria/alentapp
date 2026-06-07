# Vulnerabilidades Docker — Buenas prácticas de producción

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Las credenciales están hardcodeadas** | `docker-compose.yml` líneas 6–8| Alto | Eliminar las credenciales del codigo y usar un archivo `.env` |
| **Los Contenedores se ejecutan como root** | `Dockerfile.api` y `Dockerfile.web` | Alto | Crear un usuario no privilegiado (por ejemplo, USER node) para evitar, ante un ataque, sufrir vulnerabilidades. |
| **Sin límites de recursos (CPU/memoria)** | `docker-compose.yml` | Medio | Agregar en cada servicio: `deploy: resources: limits: cpus: '0.5' memory: 512M`. Si no se fija un límite, un servicio puede consumir toda la memoria o el procesador del servidor. Hay que definir un "techo" de uso para cada servicio.|
| **Sin separación de entornos (dev/prod)** | `docker-compose.yml` - lineas 25, 31, 32, 49, 50, 54, | Medio | Crear `docker-compose.prod.yml` que elimine los volúmenes de bind mount, los flags de polling y use el build compilado. El CMD de producción debe ser `node dist/app.js`, no `tsx watch`. La configuración actual está pensada para que el desarrollador trabaje de forma "comoda", pero eso no es adecuado para un servidor real. Hay que tener una configuración separada para cuando la app está siendo usada por usuarios reales, sin esas herramientas de desarrollo activas. |
| **Falta de healthchecks en API y Frontend** | `Dockerfile.api` y `Dockerfile.web` | Medio | Configurar `healthcheck` para detectar fallos y permitir reinicios automáticos. Sin esto, Docker no puede detectar si alguno de esos servicios dejó de responder correctamente. |
| **Imagen base pesada y sin multi-stage build** | `Dockerfile.api` - linea 1 y `Dockerfile.web` - linea 1 | Medio | Actualmente se empaqueta todo el código fuente y herramientas de desarrollo dentro del contenedor final. Lo correcto es construir el programa y luego entregar solo el resultado listo para usar. Hay que implementar multi-stage build: un stage builder que instala deps y compila, y un stage final que solo copia el codigo que se va a ejecutar. Reduce el tamaño de imagen hasta un 70%. |

# Investigar sobre OpenTelemetry

---

## ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un framework de observabilidad y un conjunto de herramientas diseñado para crear y gestionar datos de telemetría tales como trazas, métricas y logs. Es independiente de proveedores y herramientas, lo que significa que puede usarse con una amplia variedad de backends de observabilidad, incluyendo Jaeger y Prometheus, así como soluciones comerciales. Está enfocado en la generación, recopilación, gestión y exportación de telemetría.

Prometheus es una herramienta de código abierto de monitorización y alertas diseñada específicamente para entornos nativos de la nube y microservicios. En el ecosistema de Kubernetes, funciona como el estándar de la industria para observar el estado de salud de los clústeres y las aplicaciones.

OpenTelemetry y Prometheus son similares en el sentido de que ambos facilitan un enfoque abierto y flexible para la observabilidad. Sin embargo, son soluciones fundamentalmente diferentes y difieren en varios aspectos importantes:

- **Función principal:** La diferencia más significativa entre OpenTelemetry y Prometheus es que OpenTelemetry es un marco de recopilación de datos de telemetría, mientras que Prometheus es una herramienta de monitorización. Por lo tanto, OpenTelemetry y Prometheus cumplen funciones y satisfacen necesidades diferentes. El propósito principal de OpenTelemetry es ayudar a recopilar datos de telemetría, mientras que Prometheus se centra en la recopilación y la generación de alertas basadas en los datos de métricas.

- **Tipos de datos admitidos:** Otra diferencia clave entre OpenTelemetry y Prometheus es que OpenTelemetry admite todos los tipos comunes de datos de telemetría (métricas, registros y trazas), mientras que Prometheus solo admite métricas.

- **Modelo de colección:** Prometheus utiliza un modelo de extracción para recopilar sus métricas. Esto significa que obtiene las métricas de las aplicaciones que desea monitorizar. En cambio, OpenTelemetry admite modelos de extracción y de envío de datos. Se pueden extraer métricas a herramientas de monitorización compatibles con OpenTelemetry mediante métodos como el receptor Prometheus, o enviarlas desde las aplicaciones a dichas herramientas.

- **Escalabilidad y rendimiento:** Tanto OpenTelemetry como Prometheus son escalables en el sentido de que pueden observar múltiples aplicaciones o servicios, y no existen límites estrictos en la cantidad de datos que se pueden recopilar. Sin embargo, en algunos aspectos, Prometheus puede ser más difícil de escalar, principalmente porque está diseñado para implementarse en un único servidor Prometheus, sin funciones integradas como la multitenencia. Esto significa que el rendimiento de Prometheus está limitado por la disponibilidad de recursos en el servidor que aloja la instancia. OpenTelemetry no suele presentar problemas de escalabilidad, ya que se pueden implementar fácilmente recolectores adicionales o enviar datos directamente a las herramientas de monitorización.

---

## ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares de la observabilidad son las métricas, los registros (logs) y las trazas (rastreos). Estas señales de telemetría recopiladas de los sistemas informáticos permiten monitorear el estado y comportamiento de las aplicaciones.

- **Métricas:** Las métricas son evaluaciones numéricas del rendimiento del sistema y del uso de los recursos. Proporcionan una visión general de alto nivel del estado de la red mediante la captura de indicadores clave de rendimiento (KPI) como la latencia, la pérdida de paquetes, la utilización del ancho de banda y el uso de la CPU del dispositivo.

Las métricas suelen resumirse mediante paneles de control y otras visualizaciones. A menudo proporcionan a los equipos los primeros indicios de un problema de rendimiento del sistema o de la aplicación.

- **Registros (Logs):** Los logs son registros detallados de cada evento o acción que ocurre dentro del entorno. Proporcionan información granular sobre lo que ocurrió, cuándo ocurrió y en qué lugar de la red ocurrió, brindando a los equipos un contexto valioso para la resolución de problemas, la depuración y el análisis forense.

Los logs revelan las causas subyacentes de los problemas al detallar los eventos del sistema, como los cambios en la configuración del dispositivo, las autenticaciones fallidas y las conexiones caídas.

- **Rastreos (Traces):** Los rastreos capturan el flujo de datos a través de la red, proporcionando información sobre la ruta y el comportamiento de los paquetes a medida que atraviesan múltiples dispositivos y sistemas. Son esenciales para comprender los sistemas distribuidos y diagnosticar problemas de latencia.

Los datos de rastreo permiten a los equipos de TI ver el recorrido completo de una transacción, de extremo a extremo, lo que ayuda a identificar los retrasos y fallos que se producen en entornos complejos y de múltiples capas.

OpenTelemetry aborda los tres pilares fundamentales de la observabilidad: las métricas, los logs y las trazas. Su objetivo es recopilar información sobre el comportamiento y el rendimiento de aplicaciones y sistemas, permitiendo obtener una visión completa de su estado. Sin embargo, OpenTelemetry no es una herramienta de monitoreo o visualización final, sino un framework de instrumentación y recolección de telemetría. Su función consiste en generar, recopilar y exportar métricas, registros y trazas hacia plataformas especializadas de observabilidad, como Grafana, Prometheus, Jaeger o Zipkin, donde los datos pueden almacenarse, analizarse y visualizarse para facilitar la detección y resolución de problemas.

---

## ¿Qué son las métricas RED (Rate, Errors, Duration)? ¿Para qué sirve cada una?

El método RED es un marco de trabajo para la instrumentación y monitorización de microservicios. El método RED contrasta con el método USE de instrumentación, que normalmente se aplica a hardware, infraestructura, discos de red, etc.

El método de monitorización RED está diseñado para mejorar la satisfacción del usuario final, centrándose en estas 3 métricas:

- **Tasa (Rate):** La tasa de solicitudes registra la cantidad y, en ciertos contextos, el tamaño de las mismas, como por ejemplo, la carga de fotos en un servicio de alojamiento de imágenes. Monitorear la tasa es crucial, especialmente en entornos propensos a fallos por picos de tráfico, teniendo en cuenta que tanto los aumentos como las disminuciones en las solicitudes son significativos.

- **Errores (Errors):** Los errores contabilizan el número de solicitudes fallidas por segundo. Las tasas de error permiten evaluar la fiabilidad y la calidad del servicio. Los errores representan cualquier problema que provoque resultados incompletos o incorrectos, lo que requiere una solución inmediata.

- **Duración (Duration):** La duración registra el tiempo que tarda cada solicitud. Este aspecto es crucial para evaluar la capacidad de respuesta y la eficiencia del servicio. Son fundamentales para establecer la secuencia de eventos, especialmente en entornos de microservicios complejos. Este aspecto es fundamental tanto para las interacciones del lado del cliente como del lado del servidor.

La duración generalmente se enmarca dentro del ámbito del rastreo distribuido, como OpenTracing y OpenTelemetry. El rastreo distribuido registra la ruta y el tiempo que tardan las solicitudes entre servicios y dentro de ellos, y ordena los eventos causalmente.

---

## ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

El OTLP (OpenTelemetry Protocol) es el protocolo nativo de OpenTelemetry diseñado para el intercambio de datos de telemetría (mecanismos de recolección de métricas, logs y trazas) entre las aplicaciones, los agentes (Collectors) y los sistemas de almacenamiento o backend.

Está construido sobre tecnologías modernas como gRPC y Protocol Buffers (Protobuf), aunque también soporta HTTP/JSON. Su objetivo principal es unificar la forma en que los sistemas envían información de observabilidad, eliminando la necesidad de usar protocolos propietarios o específicos de cada herramienta.

### Ventajas de usar OTLP frente a exportar a Prometheus

**1. Un único estándar para métricas, logs y trazas:** Prometheus está enfocado principalmente en métricas. Con OTLP se puede enviar métricas, trazas distribuidas y logs usando el mismo protocolo.

**2. Desacopla la aplicación del backend:** Si se exporta directamente a Prometheus, la aplicación queda ligada a ese ecosistema. Con OTLP, si se quisiera cambiar de Prometheus a otro sistema, normalmente no se debe modificar la aplicación, solo la configuración del collector.

**3. Permite procesamiento intermedio:** El OpenTelemetry Collector puede filtrar datos, agregar métricas, transformar etiquetas, muestrear trazas y enviar datos a múltiples destinos.

**4. Menor carga sobre la aplicación:** La aplicación solo se preocupa por enviar datos mediante OTLP. El collector se encarga de los reintentos, buffering, compresión y conversión de formatos.

**5. Facilita arquitecturas grandes:** En sistemas distribuidos con muchos microservicios, es más sencillo centralizar la observabilidad mediante collectors OTLP que configurar exportadores específicos para cada herramienta.

---

## ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es una plataforma de análisis y monitorización de código abierto que permite a los usuarios consultar, visualizar y configurar alertas sobre métricas. Se integra a la perfección con diversas fuentes de datos como Prometheus, Loki, Tempo y OpenTelemetry para crear paneles de control completos y personalizables.

OpenTelemetry y Grafana cumplen roles complementarios dentro de una arquitectura de observabilidad. OpenTelemetry se encarga de instrumentar las aplicaciones y recopilar datos de telemetría, como métricas, trazas y logs, para luego exportarlos a distintos sistemas de monitoreo. Grafana, por su parte, utiliza esos datos provenientes de OpenTelemetry (directamente o a través de herramientas como Prometheus, Jaeger o Loki) para visualizarlos mediante paneles de control, generar alertas y facilitar el análisis del comportamiento del sistema.

En conjunto, OpenTelemetry proporciona la información necesaria sobre el estado de las aplicaciones, mientras que Grafana permite transformar esos datos en información útil para el monitoreo, diagnóstico y resolución de problemas.