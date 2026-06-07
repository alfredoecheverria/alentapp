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