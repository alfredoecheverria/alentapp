**Analisís realizado por:** Juan Ignacio Piazza

----------------------------------------------------
| Problema | Donde Ocurre? | Impacto | Solucion Propuesta |
| ---- | ---- | --- | --- |
| Se esperan cambios en el codigo y, al detectarlos, actualiza la aplicación | docker-compose.yml:31,32,49,50 | Medio | Eliminar las variables de entorno que configuran la deteccion de cambios |
| Las variables de entorno estan hardcodeadas en el docker-compose | docker-compose.yml:6-8,30-32,49,50 | Alto | Hacer uso de env_file para importar esas variables de entorno y no persistirlas en git |
| No se realizan multi-stage builds para reducir el tamaño de las imagenes, tiempo de creacion de imagen y superficie de ataque disponible | packages/api/Dockerfile y packages/web/Dockerfile | Alto | Implementar multi-stage builds para ambos servicios |
| No se usa el flag --production de npm, por lo que no se limitan las dependencias a las minimas necesarias para ejecutar la aplicación | packages/api/Dockerfile:22 y packages/web/Dockerfile:16 | Medio | Aplicar el flag en los dockerfiles al correr la aplicación |
| El servicio de base de datos no esta configurado para auto-reiniciar en caso de error | docker-compose.yml:2-17 | Bajo | Agregar el atributo `restart: always` al servicio db |

Investigación de OpenTelemetry:
1) OpenTelemetry es un framework de observabilidad que facilita la generación, exportación y colección de metricas, logs y trazas. OpenTelemetry está diseñado para integrarse con otras herramientas, por lo que no provee un sistema de almacenamiento de datos de telemetria, ni un frontend donde visualizarlas, sino que éstas prestaciones deben ser proveidas por otros softwares en caso de necesitarlas.
A diferencia de OpenTelemetry, Prometheus es una herramienta de monitoreo y alarma, esto significa que su utilidad es mayormente en el area de saber en todo momento si nuesta aplicación esta funcionando o no, en vez de conocer, en caso de fallos, cual es la causa de dichos fallos.

2) Los tres pilares de la observabilidad son las Metricas, los Logs y las Trazas. Las metricas son valores numericos que nos indican el estado del sistema en un momento dado, los logs son registros inmutables de los eventos del sistema y las trazas son un registro punta a punta de cada request hecho al sistema. OpenTelemetry aborda los tres pilares.

3) Las metricas RED son tres metricas definidas en conjunto por Tom Walkie y su equipo en Grafana Labs, el cual plantea como una alternativa a otro conjunto de metricas (USE), ya que consideran que son mejores para la observabilidad de sistemas de microservicios. Estas metricas son:
- Rate (Taza en español, es la cantidad de requests por segundo que recibe el sistema)
- Errors (Cantidad de requests fallidos)
- Duration (Tiempo que toma el sistema en responder a los requests)
La taza de requests nos sirve principalmente para ver picos o valles de actividad.
La taza de errores sirve para medir la calidad de servicio y posiblemente detectar areas de la aplicación donde haya errores dificiles de encontrar.
La duración nos permite detectar areas mal optimizadas de la aplicación o medir si se requiere ampliar o mejorar el hardware sobre el cual corre nuestra aplicación.

4) OpenTelemetry Protocol (OTLP) es un protocolo que especifica la codificacion de data de telemetria y los protocolos permitidos de transporte entre un cliente y un servidor. Los protocolos permitidos son gRPC (un protocolo de transmision binario) y HTTP, a su vez, para utilizar OTLP se debe garantizar la capacidad de enviar los datos sin compresion o con gzip. La principal ventaja de exportar utilizando OTLP, a diferencia de exportar directamente a Prometheus es que se reduce el acoplamiento entre nuestros servicios, ya que utilizando OTLP es mucho mas facil cambiar de herramienta de monitoreo y/o almacenamiento de datos de telemetria, que si nuestra exportación estuviese desarrollada utilizando las APIs de Prometheus.

5) Grafana es una herramienta de analisis y visualizacion de metricas, logs y trazas, mientras que OpenTelemetry principalmente se encarga de la generacion y exportación de las mismas, por lo tanto suelen usarse ambas herramientas juntas, OpenTelemetry funcionando como "motor" mientras que Grafana funcionando como "frontend" de nuestro stack de observabilidad.
