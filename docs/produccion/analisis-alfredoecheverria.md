**Análisis realizado por**: Alfredo Echeverría

--------------------------------------------------------------------------------------------------------------
# Análisis en la Infraestructura Docker
**Propósito**: Identificar vulnerabilidades y problemas de producción en la configuración Docker actual
--------------------------------------------------------------------------------------------------------------

## Problema 1: API corriendo en modo desarrollo

### ¿Dónde ocurre?
- Archivo: `docker-compose.yml`
- Líneas: API: líneas 34-36

### Qué está pasando
El servicio `api` está arrancando en modo desarrollo con este comando:

api:
  command: >
    sh -c "npx prisma migrate dev --name init && 
           npx tsx watch packages/api/src/app.ts"

Eso inicia un watcher y ejecuta migraciones de desarrollo en runtime, en lugar de arrancar una versión de producción de la API.

### Impacto
- El modo desarrollo NO está pensado para producción
- Más lento, consume más recursos innecesariamente
- Carga herramientas de debugging y hot-reload que exponen el servidor

Por ende el impacto es ALTO porque rompe completamente el propósito de un ambiente de producción.

### Solución propuesta
- API: Ejecutar la aplicación compilada/empaquetada, no un watcher
- Eliminar `tsx watch` y el uso de `prisma migrate dev` en el comando de producción
- Separar completamente configuración dev vs prod

--------------------------------------------------------------------------------------------------------------
## Problema 2: Credenciales hardcodeadas en Docker Compose

### ¿Donde ocurre?
- Archivo: `docker-compose.yml`
- Líneas: 5-7 (credenciales DB), 26 (DATABASE_URL)

### Qué está pasando
```yaml
db:
  environment:
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password123
    POSTGRES_DB: alentapp_db

api:
  environment:
    DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db
```

### Impacto
- Credenciales visibles en el repositorio y en el historial de git
- Cualquiera con acceso al repo conoce la contraseña de DB
- Mezcla configuración de dev y prod en un mismo archivo
- Incumple estándares de seguridad

Por ende el impacto es ALTO — Riesgo de seguridad 

### Solución propuesta
Usar variables de entorno externas:
```yaml

# Mejor práctica
db:
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}

api:
  environment:
    DATABASE_URL: ${DATABASE_URL}
```

Crear archivos `.env` (NO commiteados en git):
- `.env.development` — para desarrollo
- `.env.production` — para producción

--------------------------------------------------------------------------------------------------------------

## Problema 3: No hay límites de recursos ni healthchecks

### ¿Dónde ocurre?
- Archivo: `docker-compose.yml`

### Qué está pasando
En `docker-compose.yml` no se definen límites de recursos ni healthchecks para los servicios. Eso permite que los contenedores consuman toda la CPU/memoria disponible y no ofrece comprobación automática de su estado.

```yaml
services:
  api:
    # Falta: deploy.resources.limits
    ports: ['3000:3000']
    
  web:
    # Falta: deploy.resources.limits y healthcheck
    ports: ['5173:5173']
```

### Impacto
- El contenedor puede consumir todos los recursos del servidor
- No hay forma automática de detectar que el servicio dejó de funcionar
- Reduce la estabilidad y el control en producción

Por ende el impacto es MEDIO/ALTO — riesgo de disponibilidad y uso excesivo de recursos

### Solución propuesta
Agregar límites de CPU y memoria:

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

Agregar healthcheck para validar que el servicio esté vivo:

```yaml
api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 10s
    timeout: 5s
    retries: 3
```

--------------------------------------------------------------------------------------------------------------

## Problema 4: Dockerfile de Web en modo desarrollo

### ¿Donde ocurre?
- Archivo: `packages/web/Dockerfile`
- Línea: 13 — `CMD ["npm", "run", "dev", "-w", "packages/web", "--", "--host", "0.0.0.0"]`

### Qué está pasando
En el Dockerfile del frontend se está arrancando el servidor de desarrollo de Vite con 'npm run dev'.

### Impacto
- Vite en modo development no es seguro ni escalable para producción
- No hay optimización ni cacheo de archivos estáticos
- Expone debug tools y hot-reload innecesarios

Por ende el impacto es MEDIO/ALTO — Frontend inestable y expuesto

### Solución propuesta
Usar **multi-stage con servidor estático**:
Etapa 1: Construir la app → `npm run build`
Etapa 2: Servir con `nginx` o servidor estático ligero

--------------------------------------------------------------------------------------------------------------

## Problema 5: Dockerfile de la API usa modo desarrollo y copia todo el repositorio

### ¿Dónde ocurre?
- Archivo: `packages/api/Dockerfile`
- Líneas: todo el archivo, especialmente la línea con `COPY . .`

### Qué está pasando
El Dockerfile de la API construye una imagen de desarrollo en lugar de una de producción. Copia todo el repositorio dentro de la imagen y luego ejecuta `npm run dev` para levantar el backend, en vez de usar un artefacto compilado o un servidor listo para producción.

### Impacto
- La imagen incluye archivos innecesarios (tests, documentación, código completo)
- Se instalan dependencias de desarrollo que no hacen falta en producción
- La imagen es más pesada y lenta de construir
- La API arranca en modo desarrollo, lo que no es estable ni seguro en producción

Por ende el impacto es MEDIO-ALTO — despliegues más lentos, imágenes más pesadas y menor calidad de producción

### Solución propuesta
Usar **multi-stage build**:
1. Etapa 1 (builder): instalar dependencias y compilar
2. Etapa 2 (runtime): copiar solo lo necesario para ejecutar la API en producción
3. Reemplazar `CMD ["npm", "run", "dev", "-w", "packages/api"]` por un comando de producción

--------------------------------------------------------------------------------------------------------------
### Investigacion OpenTelemetry 
**Propósito**: Definir los conceptos clave de OpenTelemetry, sus métricas esenciales y su relación con herramientas como Prometheus y Grafana para el monitoreo de aplicaciones.
--------------------------------------------------------------------------------------------------------------

1. ### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
OpenTelemetry: Es una herramienta estándar que sirve únicamente para generar y recolectar datos sobre el funcionamiento de un sistema.

Prometheus: Es un sistema completo de monitoreo que sirve para guardar y consultar esos datos.

Diferencia: OpenTelemetry extrae la información de la aplicación, mientras que Prometheus la almacena en una base de datos.

2. ### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
Son los tres tipos de datos necesarios para entender un sistema:

Métricas: Números y estadísticas que miden el rendimiento.

Trazas: El recorrido detallado que hace una petición a través de todo el sistema.

Logs: Mensajes de texto que registran eventos o errores específicos en un momento exacto.

¿Cuál aborda OpenTelemetry? Aborda los tres por igual, ya que está diseñado para recolectar métricas, trazas y logs de forma unificada.

3. ### El método RED (Rate, Errors, Duration) ¿Para qué sirve cada una?
Es un modelo para medir el rendimiento de un servicio mediante tres datos:

Rate (Tasa): Mide la cantidad de peticiones que recibe el servicio por segundo - Sirve para conocer el nivel de carga.

Errors (Errores): Mide cuántas de esas peticiones fallan - Sirve para detectar caídas o fallas en el servicio.

Duration (Duración): Mide el tiempo que tarda el servicio en responder - Sirve para detectar problemas de lentitud.

4. ### ¿Qué es OTLP y qué ventaja tiene frente a exportar directo a Prometheus?
¿Qué es OTLP? Es el formato de comunicación estándar y optimizado que usa OpenTelemetry para enviar los datos recopilados.

Ventaja: Al usar OTLP, los datos se envían en un formato neutral. La ventaja es que no dependes de una sola herramienta: puedes cambiar el destino de tus datos (como cambiar de Prometheus a cualquier otro sistema) modificando solo una línea de configuración, sin necesidad de alterar el código de tu aplicación.

5. ### ¿Cómo se relaciona OpenTelemetry con Grafana?
Se relacionan como el recolector de datos y el visualizador de pantallas:

OpenTelemetry se encarga de extraer la información técnica desde el interior de la aplicación.

Grafana se conecta a esos datos para transformarlos en gráficos visuales, paneles y alertas fáciles de entender.