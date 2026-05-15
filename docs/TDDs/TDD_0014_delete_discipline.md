---
id: 0014
estado: Propuesto
autor: Alfredo Echeverria
fecha: 2026-05-02
titulo: Baja de Sanción Disciplinaria
---

# TDD-0014: Baja de Sanción Disciplinaria

## Contexto de Negocio (PRD)

### Objetivo

Permitir al equipo de disciplina finalizar anticipadamente una sanción disciplinaria vigente.
Una vez dada de baja, el socio recuperará inmediatamente la posibilidad de realizar operaciones restringidas.
La finalización anticipada no elimina el registro, sino que lo marca como concluido, preservando el historial completo de la sanción.

### User Persona

- Nombre: Maria (Administrativo).
- Necesidad: Finalizar sanciones activas de forma segura, asegurándose de que el socio recupere sus permisos inmediatamente.

### Criterios de Aceptación

- Como usuario quiero dar de baja una sanción disciplinaria vigente para rehabilitar inmediatamente al socio y permitirle operar nuevamente en el sistema.
- Como usuario quiero ver un mensaje de confirmación al finalizar la operación para asegurarme de que la baja se realizó correctamente.

### Escenario de éxito

- Si la sanción existe y está activa, el sistema debe registrar la fecha de finalización anticipada y devolver una confirmación exitosa.

### Escenario de fallo

- Si la sanción no existe, el sistema debe rechazar la operación e informar el error.

## Diseño Técnico (RFC)

### Modelo de Datos

La operación actuará sobre la entidad `Discipline`, agregando soporte de trazabilidad para bajas anticipadas:

- `id`: Identificador único universal (UUID).
- `reason`: Cadena de texto obligatoria que describe la causa de la sanción.
- `start_date`: Fecha y hora de inicio de la sanción.
- `end_date`: Fecha y hora de finalización de la sanción.
- `deactivated_at`: DateTime o null (fecha de baja anticipada)
- `is_total_suspension`: Valor booleano que indica si la sanción bloquea completamente al socio.
- `member_id`: Identificador del socio sancionado (UUID, clave foránea hacia `Member`).

### Consideraciones de Persistencia

La baja será lógica: el registro no se eliminará físicamente de la base de datos.
El sistema actualizará el campo `deactivated_at` con la fecha y hora actual, preservando el historial de sanciones.

### Contrato de API (@alentapp/shared)

- Endpoint: `PUT /api/v1/disciplines/:id/deactivate`
- Request Body: `None`
- Response: `200 OK` en caso de éxito.

```ts
interface DeactivateDisciplineResponse {
  id: string;
  deactivated_at: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: `DisciplineRepository` (Método `deactivate(id)`).
2. Caso de Uso: `DeactivateDisciplineUseCase` (Verifica existencia, valida que la sanción esté activa y asigna deactivated_at con la fecha actual del sistema).
3. Adaptador de Salida: `PostgresDisciplineRepository` (Actualizacion utilizando Prisma).
4. Adaptador de Entrada: `DisciplineController` (Ruta HTTP que extrae el `id` y devuelve la respuesta correspondiente).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                           | Código HTTP                |
| ---------------------------|----------------------------------------------| ---------------------------|
| Sancion inexistente        | Mensaje: "La sancion indicada no existe"     | 404 Not Found              |
| Sancion ya finalizada      | Mensaje: "La sanción ya fue finalizada previamente"| 409 Conflict         |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"| 500 Internal Server Error  |
| Baja exitosa               | Mensaje: "Sanción finalizada correctamente"  | 200 OK                     |


## Plan de Implementación

1. Ampliar el `DisciplineRepository` y `PostgresDisciplineRepository` con el método `deactivate`.
2. Crear la lógica de negocio en `DeactivateDisciplineUseCase`.
3. Crear el endpoint `PUT /api/v1/disciplines/:id/deactivate` en `DisciplineController`.
4. Añadir el método `deactivate` al servicio frontend.
5. Enlazar la acción de baja en la vista de sanciones, solicitando confirmación previa al usuario.