---
id: 0013
estado: Propuesto
autor: Alfredo Echeverria
fecha: 2026-05-01
titulo: Registro de Sanciones Disciplinarias
---

# TDD-0013: Registro de Sanciones Disciplinarias

## Contexto de Negocio (PRD)

### Objetivo

Digitalizar el registro de sanciones disciplinarias aplicadas a socios. Una sanción activa debe impedir que el socio realice cualquier operación dentro del sistema, como ingresar al club o inscribirse a actividades.

### User Persona

- Nombre: Maria (Administrativo).
- Necesidad: Registrar sanciones asegurándose de que el sistema bloquee automáticamente al socio durante el período establecido.

### Criterios de Aceptación

- Como usuario quiero registrar una sancion sobre un socio existente para dejar constancia formal e inhabilitar al socio durante el periodo de la sancion.
- Como usuario quiero ver un mensaje de confirmacion al finalizar la carga para asegurarme de que la accion se realizo correctamente. 

### Escenario de éxito

- Si el usuario completa todos los campos obligatorios con datos válidos, el sistema debe registrar la sanción y devolver una confirmación exitosa.

### Campos obligatorios

Los siguientes son campos obligatorios para registrar una sanción:

- `member_id`: Identificador del socio.
- `reason`: Motivo/descripcion de la sancion.
- `start_date`: Fecha y hora de inicio de la sanción.
- `end_date`: Fecha y hora de finalización de la sanción. 
- `is_total_suspension`: Indica si la sanción bloquea completamente al socio.

### Escenario de fallo

- Si el socio no existe, el sistema debe rechazar la operación e informar el conflicto.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Discipline` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `reason`: Cadena de texto obligatoria que describe la causa de la sanción.
- `start_date`: Fecha y hora de inicio de la sanción.
- `end_date`: Fecha y hora de finalización de la sanción.
- `is_total_suspension`: Valor booleano que indica si la sanción bloquea completamente al socio.
- `member_id`: Identificador del socio sancionado (UUID, clave foránea hacia `Member`).
- `deactivated_at`: DateTime | null (gestionado internamente por el sistema, se inicializa en null.)

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/disciplines`
- Request Body (CreateDisciplineRequest):

```ts
{
    memberId: string;
    reason: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: CreateDiscipline (Lógica que valida fechas antes de persistir).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Ruta HTTP).


## Casos de Borde y Errores

| Escenario                         | Resultado Esperado                                 | Código HTTP   |
| --------------------------------- | -------------------------------------------------- | ------------- |
| Socio inexistente                 | Mensaje: "El socio indicado no existe"             | 404 Not Found |
| Fecha fin anterior a fecha inicio | Mensaje: "La fecha de finalización debe ser posterior a la fecha de inicio"| 400 Bad Request |
| Error de conexión a DB            | Mensaje: "Error interno, reintente más tarde"      | 500 Internal Server Error |
| Registro exitoso                  | Mensaje: "Sanción creada correctamente"            | 201 Created   |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración: crear la tabla Discipline con sus relaciones hacia Member y los campos correspondientes.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: desarrollar la lógica de negocio para verificar que el socio exista, validar que todos los campos obligatorios estén presentes, comprobar que la fecha de finalización sea posterior a la fecha de inicio y persistir la sanción en la base de datos.
4. Crear formulario en React y conectar con el endpoint del backend: desarrollar la interfaz para que el equipo de Disciplina registre sanciones, enviando los datos al endpoint correspondiente (POST /api/v1/disciplines) y mostrando mensajes claros ante operaciones exitosas o errores de validación.