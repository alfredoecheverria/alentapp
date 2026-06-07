# Diseño Propuesto: packages/api/Dockerfile.prod
## Propósito

El objetivo de este archivo es construir una imagen optimizada para el entorno de producción de la API, diferenciándose críticamente de una configuración de desarrollo.

La imagen resultante debe cumplir con las siguientes características:
- Contener únicamente lo estrictamente necesario para ejecutar la API.

- Excluir por completo herramientas de desarrollo y código fuente original.

- Garantizar un tamaño reducido.

- Garantizar una superficie de ataque mínima (seguridad).

- Asegurar un arranque veloz en producción.

- Ejecutar el servicio bajo usuario sin privilegios.

- Implementar healtcheck para verificar la disponibilidad del backend.



## Estructura General: Multi-Stage Build
El proceso de construcción se divide en un flujo de 3 etapas (multi-stage build) utilizando como imagen base común node:22-alpine:

- Stage 1 (deps): Instala solo dependencias de producción
       
- Stage 2 (build): Transpila TypeScript y genera JS (dist/)
       
- Stage 3 (runtime): Junta dependencias instaladas en el stage 1 y el codigo js generado en el paso 2, añade usuario no-root

### Stage 1 — deps
Base: node:22-alpine

Propósito: Instalar exclusivamente las dependencias necesarias para la ejecución en producción.

Comando clave: `npm ci --omit=dev`

¿Por qué es necesario? 
Mantiene la imagen final lo más pequeña posible, evita trasladar dependencias de desarrollo (como linters o herramientas de testing) al servidor.

### Stage 2 — build
Base: node:22-alpine
Propósito: Transpilar el código fuente escrito en TypeScript y generar los archivos en JavaScript.

Flujo: Copia de manifiestos, instalación de dependencias de desarrollo y producción (npm ci), copia de la carpeta src/ y ejecución de npm run build (o npx tsc).
Resultado: El artefacto compilado listo para producción (usualmente la carpeta dist/).

¿Por qué es necesario? La etapa de build genera los artefactos JavaScript que serán ejecutados por Node.js. Mantener la compilación separada evita incluir el código fuente y las dependencias de desarrollo en la imagen de producción.

### Stage 3 — runtime
Base: node:22-alpine

Propósito: La etapa final y la única que realmente se despliega. Su única tarea es ejecutar la API.

Pasos a realizar:

   - Incluir la carpeta dist/ generada en el Stage 2 (build).

   - Incluir los node_modules limpios del Stage 1 (deps).

   - Incluir archivos mínimos de configuración obligatorios (package.json, esquemas de Prisma, etc.).

   - Configura el entorno bajo el usuario node.

   - Implementa un HEALTHCHECK que verifica periódicamente la disponibilidad de la aplicación mediante solicitudes HTTP a http://localhost:3000.

¿Por qué es necesario? Al aislar el entorno de ejecución de la lógica de construcción, el contenedor se vuelve sumamente ligero, rápido en escalar y mucho más seguro ante posibles vulnerabilidades.


## Requisitos No Funcionales (RNF)

| Requisito             | Objetivo                                                              |
| ----------------------| --------------------------------------------------------------------- |
| Tamaño imagen final   | Menor a 300 MB                                                        |
| Tiempo de startup     | Menor a 30 segundos                                                   |
| Seguridad             | Ejecución sin usuario root                                            |
| Monitoreo             | Healthcheck cada 30 segundos                                          |
| Optimizacion de cache | Reutilización de capas de dependencias cuando package.json no cambia  |


# Diseño Propuesto: packages/web/Dockerfile.prod

## Propósito

Este Dockerfile tiene como objetivo construir y desplegar la aplicación frontend desarrollada con Vite de manera optimizada para entornos productivos.

Se implementa un enfoque multi-stage build para separar las tareas de instalación de dependencias, compilación y ejecución. Esto permite:

- Reducir el tamaño final de la imagen.
- Eliminar dependencias innecesarias en producción.
- Mejorar la seguridad al no exponer herramientas de desarrollo.
- Optimizar los tiempos de despliegue y transferencia de imágenes.

Además, la aplicación no se ejecuta mediante Node.js en producción, sino que los archivos estáticos generados por Vite son servidos mediante Nginx, una solución más eficiente para este tipo de aplicaciones.

---

## Estructura — Etapas y Capas

### Stage 1: `deps` — Instalación de dependencias

**Base:** `node:22-alpine`

En esta etapa se instalan todas las dependencias necesarias para construir la aplicación. Inicialmente se copian únicamente los archivos de definición de dependencias (`package.json`), antes de copiar el código fuente completo. Esto permite que Docker reutilice la caché de esta capa siempre que las dependencias no cambien, evitando reinstalaciones innecesarias durante los builds.

A continuación se ejecuta la instalación mediante `npm ci`. El propósito principal de esta etapa es desacoplar la gestión de dependencias del código fuente, mejorando significativamente los tiempos de construcción y garantizando reproducibilidad entre entornos.

---

### Stage 2: `build` — Compilación de la aplicación

**Base:** `node:22-alpine`

Esta etapa se encarga de generar la versión optimizada para producción del frontend. Se reutilizan las dependencias instaladas en la etapa anterior, se copia el código fuente de la aplicación y se ejecuta el proceso de transpilación mediante `npm run build`.

Como resultado se genera el directorio `dist/`, que contiene únicamente los archivos estáticos optimizados (HTML, CSS, JavaScript e imágenes). La separación entre instalación y compilación permite aprovechar mejor la caché de Docker y aislar el proceso de build del entorno de ejecución final.

---

### Stage 3: `runtime` — Ejecución en producción

**Base:** `nginx:stable-alpine`

La última etapa tiene como objetivo servir la aplicación en producción utilizando Nginx. Se copian exclusivamente los archivos generados en `dist/` hacia el directorio público de Nginx, evitando incluir código fuente, herramientas de compilación o el runtime de Node.js dentro de la imagen final.

Además, se incorpora una configuración personalizada de Nginx para habilitar:

- Compresión gzip
- Cacheo de recursos estáticos
- Cabeceras de seguridad HTTP
- Soporte para aplicaciones SPA mediante redirección de rutas hacia `index.html`

También se define un healthcheck sobre `localhost:80` para verificar periódicamente la disponibilidad del servicio.

Esta arquitectura permite obtener una imagen final más pequeña, segura y eficiente, ya que el contenedor de producción contiene únicamente Nginx y los recursos estáticos necesarios para ejecutar la aplicación.

---

## Requisitos No Funcionales

| Atributo            | Objetivo                                          | Justificación                                                                                       |
|---------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Tamaño imagen final | ≤ 50 MB                                           | `nginx:stable-alpine` pesa ~8 MB; la imagen final no debería superar los 50 MB incluyendo los assets del frontend |
| Tiempo de startup   | ≤ 3 s                                             | nginx con archivos estáticos inicia casi instantáneamente; es medible con el healthcheck            |
| Tiempo de rebuild   | ≤ 60 s sin cambio de deps                         | La separación de la capa de `node_modules` permite que un cambio de código no reinstale paquetes    |
| Healthcheck         | `GET http://localhost:80`                         | `interval=30s`, `timeout=5s`, `retries=3`; permite que el orquestador detecte un nginx caído        |
| Seguridad           | Sin secretos en capas; usuario no-root            | Los secrets de build no deben quedar en el historial de capas; nginx debe correr como usuario sin privilegios |
| Compresión          | gzip activado en nginx                            | Reduce el tamaño de transferencia de JS/CSS ~70%; configurado en `nginx.conf`, no en la aplicación  |
| Cache de assets     | `Cache-Control: max-age=31536000, immutable` para `/assets/*` | Los chunks de Vite tienen hash de contenido, por lo que es seguro cachearlos 1 año en el cliente    |
| Security headers    | `X-Frame-Options`, `X-Content-Type-Options`, `CSP` | Configurados como directivas `add_header` en nginx; no requieren lógica en la app                  |

# Diseño Propuesto: docker-compose.prod.yml

## Propósito

Este archivo debe definir cómo se ejecutan los servicios en producción, con un enfoque en:
- Estabilidad
- Seguridad
- Control de recursos
- Monitoreo básico
- Separación de datos sensibles del repositorio

No debe ser una copia del docker-compose.yml de desarrollo, sino una versión optimizada para producción.

## Estructura general

El docker-compose.prod.yml debe tener estas secciones:
- `version`: La versión de Compose.
- `services`: Definición de db, api y web.
- `networks`: Red interna personalizada.
- `volumes`: Volumen de datos de PostgreSQL.
- `env_file`: Carga de variables sensibles desde un archivo externo.

## Servicios clave

1) db
   - Imagen: `postgres:16-alpine`
   - Propósito: Base de datos PostgreSQL en producción.
   - Debe tener:
     - Healthcheck
     - Volumen persistente
     - Logging
     - Configuración sensible desde `.env.prod`
     - Seguridad estricta (aunque no puede ser `read_only`)
     - El puerto de la db no tiene que estar expuesto

2) api
   - Imagen: Imagen o build de producción.
   - Propósito: Ejecutar la API de backend con el Dockerfile de producción.
   - Debe tener:
     - Healthcheck contra `http://localhost:3000`
     - Límites de CPU/memoria
     - Seguridad: `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `no-new-privileges`
     - Logging rotado
     - `depends_on` de db con condición de salud
     - Exponer puerto 3000

3) web
   - Imagen: Imagen de frontend de producción.
   - Propósito: Servir el frontend estático.
   - Debe tener: 
     - Límites de recursos
     - Healthcheck
     - Seguridad similar a api
     - Logging rotado
     - Exponer puerto 8080

## Requisitos no funcionales

- Cotas de recursos: Cada servicio define CPU y memoria.
- Healthchecks: db, api y web deben verificar que estén funcionando.
- Logging: Driver `json-file` con rotación: `max-size: 10m`, `max-file: 3`.
- Red: Usar una red interna personalizada, no la red por defecto.
- Secrets: Variables sensibles deben venir de un `.env` externo, no estar hardcodeadas.

## Seguridad

- Contenedores con `read_only: true`: true cuando sea viable.

Nota importante de seguridad: `read_only: true` puede aplicarse bien en api y web. En db no debe usarse `read_only: true` porque PostgreSQL necesita escribir en su volumen de datos.



# Diseño de la observabilidad


### a) Metricas RED a capturar


Las métricas RED (Rate, Errors, Duration) son el conjunto mínimo indispensable para entender el comportamiento de un servicio de cara al usuario. A continuación se detallan las 5 métricas que se implementarán:


| Métrica | Tipo OpenTelemetry | Descripción | Labels |
| --- | --- | --- | --- |
| http.requests.total | Counter | Cantidad total de requests HTTP recibidas. Permite calcular el Rate (tasa de requests por segundo) usando rate() en PromQL. | method, route, status |
| http.requests.errors | Counter | Total de requests que terminaron en error (4xx o 5xx). Permite calcular la tasa de error relativa al total de requests. | method, route, status |
| http.request.duration | Histogram | Latencia de cada request en milisegundos. Al ser un histograma, permite calcular percentiles (p50, p95, p99) para medir la Duration real percibida por el usuario. | method, route |
| process.memory.usage | Gauge | Memoria heap utilizada por el proceso Node.js en bytes. Permite detectar memory leaks o picos de consumo en producción. | — (ninguno, es un valor global del proceso) |
| http.requests.active | Gauge | Cantidad de requests HTTP que se están procesando concurrentemente en un instante dado. Útil para detectar saturación. | method, route |


Justificación de la elección de tipos:
- Counter: para valores que solo crecen (conteos acumulados). Siempre se consultan via rate() para obtener una tasa por segundo.
- Histogram: para medir distribuciones de tiempo. Permite calcular percentiles exactos con histogram_quantile() en lugar de solo promedios.
- Gauge: para valores que suben y bajan libremente (memoria actual, conexiones activas).



### b) OpenTelemetry SDK


#### Estructura y configuración del SDK


El SDK se inicializa una sola vez en un archivo dedicado (packages/api/src/infrastructure/telemetry.ts) y debe ser el primer import del entrypoint de la aplicación, antes de que cualquier otro módulo sea cargado. Esto garantiza que las auto-instrumentaciones puedan registrarse correctamente en los módulos HTTP y Fastify.


```typescript
// packages/api/src/infrastructure/Telemetry.ts


import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';
import type { Meter } from '@opentelemetry/api';


// 1. Configurar el exportador de Prometheus
//    - Expone las métricas en http://localhost:9464/metrics
//    - Prometheus scrapeará este endpoint periódicamente
const prometheusExporter = new PrometheusExporter({
 port: 9464,
 endpoint: '/metrics',
});


// 2. Inicializar el SDK con auto-instrumentaciones
//    - HTTP: instrumenta automáticamente requests entrantes/salientes
//    - Fastify: agrega atributos específicos del framework (route, etc.)
const sdk = new NodeSDK({
 metricReader: prometheusExporter,
 instrumentations: [
   getNodeAutoInstrumentations({
     '@opentelemetry/instrumentation-http': {
       // Captura automáticamente: method, url, status_code, duration
     },
     '@opentelemetry/instrumentation-fastify': {
       // Agrega: http.route (ruta normalizada, ej: /api/v1/socios/:id)
     },
   }),
 ],
});


sdk.start();


// 3. Obtener un Meter nombrado para métricas manuales (RED)
const meter = metrics.getMeter('alentapp-api');


// 4. Factory de métricas RED para usar en los controllers
export function createREDMetrics(meter: Meter) {
 const requestCounter = meter.createCounter('http.requests.total', {
   description: 'Total de requests HTTP recibidas',
 });


 const errorCounter = meter.createCounter('http.requests.errors', {
   description: 'Total de errores HTTP (4xx/5xx)',
 });


 const requestDuration = meter.createHistogram('http.request.duration', {
   description: 'Latencia de cada request HTTP',
   unit: 'ms',
 });


 const activeRequests = meter.createUpDownCounter('http.requests.active', {
   description: 'Requests HTTP concurrentes en proceso',
 });


 const memoryUsage = meter.createObservableGauge('process.memory.usage', {
   description: 'Memoria heap utilizada por el proceso Node.js',
   unit: 'bytes',
 });


 // La memoria se observa de forma asíncrona en cada scrape
 memoryUsage.addCallback((result) => {
   result.observe(process.memoryUsage().heapUsed);
 });


 return { requestCounter, errorCounter, requestDuration, activeRequests };
}


export { sdk, meter, prometheusExporter };
```


#### Inicialización en el entrypoint


```typescript
// packages/api/src/app.ts
import './infrastructure/telemetry.js';


// el resto de imports
import Fastify from 'fastify';
// ...
```


#### Uso en los controllers (instrumentación manual)


```typescript
// Ejemplo: packages/api/src/controllers/MemberController.ts
import { metrics } from '@opentelemetry/api';
import { createREDMetrics } from '../infrastructure/telemetry.js';


const meter = metrics.getMeter('alentapp-api');
const { requestCounter, errorCounter, requestDuration, activeRequests } =
 createREDMetrics(meter);


async getAll(request, reply) {
 const start = Date.now();
 const labels = {
   method: request.method,
   route: request.url.split('?')[0],
 };


 activeRequests.add(1, labels);   // +1 al iniciar


 try {
   const members = await this.getMembersUseCase.execute();
   requestCounter.add(1, { ...labels, status: '200' });
   return reply.status(200).send({ data: members });
 } catch (error) {
   errorCounter.add(1, { ...labels, status: '500' });
   requestCounter.add(1, { ...labels, status: '500' });
   return reply.status(500).send({ error: 'Error interno' });
 } finally {
   requestDuration.record(Date.now() - start, labels);
   activeRequests.add(-1, labels);  // -1 al finalizar
 }
}
```
