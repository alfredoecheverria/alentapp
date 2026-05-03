---
id: 0015
estado: Propuesto
autor: Alfredo Echeverria
fecha: 2026-05-01
titulo: Actualizacion de Sanciones Existentes
---

# TDD-0015: Actualización de Sanciones Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir al equipo de disciplina modificar una sanción existente para corregir errores de carga, actualizar su período de vigencia o cambiar su alcance.

### User Persona

- Nombre: Maria (Equipo de Disciplina).
- Necesidad: Editar una sanción previamente registrada, por ejemplo, corregir las fechas de suspensión, actualizar el motivo o cambiar una suspensión parcial a total.

### Criterios de Aceptación

- Como usuario quiero actualizar uno, varios o todos los campos de una sanción para corregir información previamente registrada.
- Como usuario quiero que el sistema valide las fechas ingresadas para asegurar la consistencia del período de vigencia.
- Como usuario quiero visualizar la sanción con los datos actualizados para confirmar que la modificación se realizó correctamente.

### Escenario de éxito

- Si la sanción y los datos enviados son validos, el sistema debe actualizarla correctamente y devolver una confirmación exitosa.

### Escenario de fallo

- Si la sanción no existe, el sistema debe rechazar la operación e informar el error.
- Si el socio indicado no existe, el sistema debe rechazar la operación e informar el error.
- Si la fecha de finalización es anterior o igual a la fecha de inicio, el sistema debe rechazar la operación e informar el error.
- Si no se envía ningún campo para actualizar, el sistema debe rechazar la operación e informar el error.


## Diseño Técnico (RFC)

### Modelo de Datos

La operación actuará sobre la entidad `Discipline` existente, que posee las siguientes propiedades:

- `id`: Identificador único universal (UUID).
- `reason`: Cadena de texto obligatoria que describe la causa de la sanción.
- `start_date`: Fecha y hora de inicio de la sanción.
- `end_date`: Fecha y hora de finalización de la sanción.
- `is_total_suspension`: Valor booleano que indica si la sanción bloquea completamente al socio.
- `member_id`: Identificador del socio sancionado (UUID, clave foránea hacia `Member`).

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial.

- Endpoint: `PATCH /api/v1/discipline/:id`
- Request Body (`UpdateDisciplineRequest`):

```ts
{
    motivo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    es_suspension_total?: boolean;
    member_id?: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Método update(id, data)).
2. Caso de Uso: UpdateDisciplineUseCase.
3. Adaptador de Salida: PostgresDisciplineRepository.
4. Adaptador de Entrada: DisciplineController.

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                           | Código HTTP                |
| ---------------------------|----------------------------------------------| ---------------------------|
| Sancion inexistente        | Mensaje: "La sancion indicada no existe"     | 404 Not Found              |
| Socio inexistente          | Mensaje: "El socio indicado no existe"       | 404 Not Found              |
| Fecha fin anterior a fecha inicio| Mensaje: "La fecha de fin debe ser posterior a la fecha de inicio" | 400 Bad Request |
| Sin campos para actualizar | Mensaje: "Debe indicar al menos un campo a modificar" | 400 Bad Request   |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"| 500 Internal Server Error  |
| Actualizacion exitosa      | Retorna la sancion actualizada               | 200 OK                     |

## Plan de Implementación

1. Crear la interfaz UpdateDisciplineRequest en @alentapp/shared.
2. Incorporar el método update en DisciplineRepository.
3. Implementar UpdateDisciplineUseCase, validando existencia de la sanción, existencia del socio, presencia de al menos un campo y consistencia de fechas.
4. Implementar la actualización en PostgresDisciplineRepository.
5. Exponer el endpoint PUT /api/v1/disciplines/:id en DisciplineController.
6. Añadir el método update al servicio frontend de sanciones.