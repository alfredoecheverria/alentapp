---
id: 0022
estado: Propuesto
autor: Juan Ignacio Piazza
fecha: 2026-05-09
titulo: Registro de Nuevas Inscripciones
---

# TDD-0022: Registro de Nuevas Inscripciones

## Contexto de Negocio (PRD)

### Objetivo

Digitalizar el registro de inscripciones de socios a deportes ofrecidos.

### User Persona

- Nombre: Jorge (Administrativo).
- Necesidad: Registrar las inscripciones de los socios a los deportes ofrecidos por el club. No debe poder existir más inscripciones a un dado deporte que su cupo máximo.

### Criterios de Aceptación

- Como Administrativo quiero poder registrar nuevas inscripciones a un dado deporte para poder llevar un registro de las actividades que realiza un socio.

### Escenario de Exito

- Si el usuario completa el formulario de registro con los campos Miembro, Deporte, Inscripcion activa y fecha de inscripcion con datos válidos, y el deporte tiene cupo disponible, entonces el sistema registra la nueva inscripción e informa al usuario con un mensaje de exito.

### Escenario de Fallo

- Si el usuario ingresa un Miembro que ya esta inscripto a dicho deporte, el sistema debe informarlo con un mensaje de error.

- Si el usuario ingresa datos válidos pero el deporte ya tiene una cantidad de inscripciones igual a su cupo máximo, el sistema debe informarlo con un mensaje de error.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Enrollment` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `member_id`: Identificador de un socio que practica o practicó un deporte dado. (UUID, clave foránea hacia `Member`)
- `sport_id`: Identificador de un deporte practicado por un socio. (UUID, clave foránea hacia `Sport`)
- `enrollment_date`: Fecha en la que el socio empezó a practicar el deporte. (Date)
- `is_active`: Registra si el socio actualmente practica el deporte. (Booleano)

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/enrollments`
- Request Body (CreateEnrollmentRequest):
```ts
{
    member_id: string;
    sport_id: string;
    enrollment_date: string;
    is_active: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EnrollmentRepository` (Método `create(data)`).
2. **Servicio de Dominio**: `EnrollmentValidator` (Lógica que verifica si el miembro no está inscripto al deporte y la cantidad de inscripciones actuales es menor a la capacidad maxima del mismo antes de llamar al repositorio).
3. **Caso de Uso**: `CreateEnrollmentUseCase` (Orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresEnrollmentRepository` (Creacion del registro usando el método `create` de Prisma).
5. **Adaptador de Entrada**: `EnrollmentController` (Ruta HTTP)

## Casos de Borde y Errores

| Escenario                             | Resultado Esperado                                                            | Código HTTP               |
| ------------------------------------- | ----------------------------------------------------------------------------  | ------------------------- |
| Socio ya inscripto al deporte         | Mensaje: "Ya existe una inscripcion del socio a este deporte"                 | 409 Conflict              |
| Capacidad máxima igual a las inscripciones actuales    | Mensaje: "Capacidad máxima del deporte excedida"             | 409 Conflict              |
| Error de conexión a DB                | Mensaje: "Error interno, reintente más tarde"                                 | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración: crear la tabla `Enrollment` con los campos correspondientes, y correr la migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: Implementar lógica de para verificar que no exista una inscripción socio-deporte duplicada y que la nueva inscripción no exceda la cantidad maxima de inscripciones del deporte.
4. Crear formulario en React y conectar con el endpoint del backend.
