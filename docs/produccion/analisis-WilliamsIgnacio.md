# Identificar y documentar 5 problemas o vulnerabilidades respecto a buenas prácticas de producción.

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **1. Credenciales de base de datos hardcodeadas** | `docker-compose.yml` | Alto | Utilizar variables de entorno externas (`.env`) o Docker Secrets para almacenar credenciales sensibles. |
| **2. Contenedores ejecutandose como root:** | `packages/api/Dockerfile` y `packages/web/Dockerfile` | Alto | Ejecutar los contenedores con un usuario no privilegiado mediante `USER node`. |
| **3. CPU y memoria sin limites definidos:** | `docker-compose.yml` | Alto | Configurar límites de recursos (`mem_limit`, `cpus` o `deploy.resources`) para evitar consumo excesivo del host. |
| **4. Uso de herramientas de desarrollo en producción** (`npm run dev`, `tsx watch`) | `docker-compose.yml` | Medio | Generar builds de producción y ejecutar artefactos compilados en lugar de herramientas de desarrollo. |
| **5. Falta healthchecks para el Backend y Frontend:** | `docker-compose.yml` | Medio | Implementar healthchecks específicos para los servicios API y Web. |
| **6. Sistema de archivos del contenedor con permisos de escritura** | `docker-compose.yml` | Medio | Configurar los contenedores con `read_only: true` y montar unicamente los directorios que requieran escritura mediante volumenes especificos |


# Investigar Open Telemetry.

## ¿Qué es Open Telemetry y cómo se diferencia de Prometheus?

Open Telemetry es un framework de observabilidad (la capacidad de comprender el estado interno de un sistema a través del análisis de sus datos de telemetría) diseñado para crear y gestionar datos de telemetría (trazas, metálicas y logs). Funciona de manera independiente de proveedores y herramientas, de forma que permite ser utilizado por una amplia variedad de backends de observabilidad. Es importante aclarar que no reemplaza ningún backend de observabilidad, sino que viene a solucionar la falta de un estándar sobre cómo instrumentar código y enviar datos de telemetría a un backend de observabilidad. Está enfocado a la generación, recopilación, gestión y explotación de telemetría, siendo uno de los objetivos principales el poder instrumentar fácilmente las aplicaciones o sistemas, sin importar el lenguaje, infraestructura y el entorno de ejecución.

Prometheus es un backend de monitoreo de código abierto, se encarga de recopilar y almacenar métricas como datos de series temporales, la información de las métricas se almacena con la marca de tiempo en la que se registró, junto con pares clave-valor opcionales llamados etiquetas. Una de las características principales es que se trata de un modelo de datos multidimensional con datos de series temporales identificados por nombre de métrica y pares clave/valor. Posee su propio lenguaje de consultas “PromQL” que permite hacer cálculos en tiempo real de forma muy rápida y eficiente. El sistema se basa en un modelo de pulling (scraping) donde es el propio Prometheus el que cada cierto tiempo recopila y analiza datos de la aplicación para generar métricas.

Open Telemetry y Prometheus son dos software completamente distintos y con diferentes fines que pueden trabajar en conjunto, siendo Open Telemetry el encargado de la generación y recolección de datos y métricas dentro del sistema, mientras que Prometheus se encarga del almacenamiento, la consulta y las alertas.

## ¿Cuáles son los 3 pilares de la observabilidad? ¿Qué aborda Open Telemetry?

Los tres pilares de la observabilidad son:

* **Métricas:** Responde a la pregunta “¿Hay un problema y donde?”, son datos numéricos agregados con una marca de tiempo. Son eficientes y baratos de almacenar.
* **Logs:** Responde a la pregunta “Que paso específicamente?”, se trata de un texto plano con la descripción de un evento. Tienen mucho detalle pero son costosos de procesar a gran escala y, además, pueden ser difíciles de interpretar si no se conoce el sistema.
* **Trazas (Traces):** Responde a la pregunta “Donde se produjo la demora o el fallo?”, se puede interpretar como el viaje completo de una petición a través de todos los servicios, microservicios y bases de datos.

Históricamente Open Telemetry se implementa para la gestión de trazas (pilar principal), sin embargo actualmente puede cubrir los tres pilares si se integra con software externos. Para el caso de las métricas permite definir contadores, medidores (gauges) e histogramas compatibles con sistemas de métricas modernos como Prometheus. Por otro lado, en el caso de los logs, actualmente Open Telemetry está trabajando para estandarizar cómo se conectan los logs con una traza de forma automática.

## Expliquen el concepto de métricas RED. ¿Para qué sirve cada una?

Las métricas RED son un modelo de diseño de monitoreo pensado específicamente para servicios y microservicios (arquitecturas de tipo Request/Response), se basa en la idea de que para entender la salud  de un servicio, no se necesita medir múltiples indicadores, sino concentrarte en sólo tres que realmente afectan a la experiencia del usuario:

* **Rate:** Mide el número de peticiones por segundo que recibe el servicio, ayuda a entender la carga actual y detectar picos de tráfico inusuales.
* **Errors:** Mide la cantidad de peticiones que fallan (Status 500 en HTTP), es el indicador inmediato de que algo anda mal en el código o la infraestructura.
* **Duration:** Mide el tiempo que tarda en resolverse una petición (latencia del servicio), si el servicio no falla pero tarda 30 segundos en responder está “roto” para el usuario que lo está usando.

## ¿Qué es el OTLP (Open Telemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

Open Telemetry Protocol es el protocolo nativo diseñado específicamente para transportar datos de telemetría desde la aplicación hacia otros colectores o backends de almacenamiento. Cuando se quiere exportar directamente a Prometheus se utiliza texto plano sobre HTTP, mientras que OTLP se diseñó desde cero para ser eficiente, liviano y escalable. Funciona en base de los siguientes tres pilares:

1. **Serialización con Protocol Buffers (Protobuf):** En lugar de mandar los datos en formatos como JSON o texto plano legible, formatos que resultan pesados, OTLP codifica la información usando Protobuf donde los datos se transforman en un formato binario muy compacto. Esto reduce drásticamente el tamaño de los paquetes consumiendo menos memoria y CPU.
2. **Transporte mediante gRPC:** el estándar de la industria es que OTLP corra sobre gRPC permitir la multiplexación, donde se mandan múltiples flujos de datos en paralelo a través de una sola conexión TCP abierta, evitando tener que conectar y desconectar de forma recurrentrente.
3. **Modelo Push orientado a Batches:** Con diferencia del modelo Pull de Prometheus, con OTLP la aplicación acumula los datos de telemetría en memoria durante periodos cortos de tiempo y les hace Push en un solo lote binario hacia el Open Telemetry Collector.

Las ventajas frente a exportar directamente a Prometheus son las siguientes:

* **Mayor rendimiento en la aplicación:** en vez de procesar y armar un texto gigante cada vez que Prometheus hace un Pull, simplemente los datos se envían en rafagas de binarios compactos de forma sincronica.
* **Bajo acoplamiento:** Migrar de Prometheus a otra tecnología se vuelve más sencillo porque la telemetría se encuentra en el estándar de Open Telemetry y no es necesario hacer grandes cambios en la configuración del Collector.
* **Un único canal de comunicación:** El formato de Prometheus solo sirve para métricas. Mientras que con OTLP se utiliza una única conexión para enviar métricas, trazas y logs en conjunto, lo que permite cruzarlos automáticamente.
* **Proporciona observabilidad para entornos Serverless:** si se tienen funciones Serverless con periodos de vida muy cortos, Prometheus no alcanza a hacer el Pull para pedirles los datos. En cambio con OTLP, la propia aplicación hace el Push de los datos antes de morir, asegurando que no se pierda la telemetría.

## ¿Cómo se relaciona Open Telemetry con Grafana?

La aplicación o el servicio genera métricas, trazas y logs utilizando Open Telemetry, estos son enviados al Open Telemetry Collector, quien es el encargado de repartir los datos de la telemetría a las bases de datos correspondientes. En los stacks de Grafana usualmente se suele utilizar Prometheus para persistir las métricas, para las trazas existe Grafana Tempo y para los logs existe Grafana Loki. Grafana permite cruzar estas bases de datos en una sola para poder mostrar la información en pantalla y que el usuario pueda interactuar con los cruces. Una característica que permite visualizar estos cruces se llama “Data Links”, que por ejemplo: permite que el usuario haga click en un pico de un gráfico de latencia (métrica) y Grafana despliega una pestaña con la traza exacta de Open Telemetry que causó la demora. Otro ejemplo es de trazas a logs, si se está revisando una traza en Grafana que posee un fallo, haciendo click sobre el fallo Grafana despliega una pestaña que permite visualizar los logs de Loki filtrados para ese instante, mostrando el error en la aplicación.