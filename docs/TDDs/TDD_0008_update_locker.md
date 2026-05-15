---
id: 0008
estado: Propuesto
autor: Nahuel Fabian Fredes Coronilla
fecha: 2026-05-02
titulo: Actualización de lockers existentes
---

# TDD-0008: Actualización de lockers existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos corregir o modificar la información de un locker existente en el sistema.

### User Persona

- Nombre: Miriam (Recepcionista).
- Necesidad: Modificar datos de los lockers rápidamente desde el panel de administracion. Por ejemplo, asignar un socio para que sea el propietario del locker, poner este en mantenimiento o cambiar su locación.

### Criterios de Aceptación
- Como administrativo quiero poder editar los lockers del club. Cambiar número, estado, locación y poder asignar o desasignar a un socio.
- El sistema debe permitir editar el número del locker siempre que el nuevo número no esté en uso por otro locker.

### Escenario de Éxito
- Si el usuario edita el locker con los datos validos, el sistema debe actualizarlo correctamente y mostrar el mensaje de éxito.

### Escenario de Fallo
- Si el usuario intenta cambiar el número a uno ya asignado a otro locker o ingresa una combinación inválida de `status` o `member_id`, el sistema debe rechazar la actualización y devolver el error correspondiente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- Endpoint: `PUT /api/v1/lockers/:id`
- Request Body (UpdateLockerRequest):

```ts
{
    number?: number;
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null; // opcional
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `LockerRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `LockerValidator`
3. **Caso de Uso**: `UpdateLockerUseCase` (Orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresLockerRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `LockerController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores
| Escenario                                  | Resultado Esperado                                          | Código HTTP               |
| ------------------------------------------ | ------------------------------------------------------------| ------------------------- |
| `number` duplicado                         | Mensaje: "Ya existe un locker con ese número"               | 409 Conflict              |
| Número inválido (<= 0 o no entero)         | Mensaje: "`number` debe ser entero y mayor a cero"          | 400 Bad Request           |
| `member_id` con formato inválido           | Mensaje: "`member_id` no válido"                            | 400 Bad Request           |
| `member_id` no existe                      | Mensaje: "El miembro indicado no existe"                    | 404 Not Found             |
| `member_id` ya tiene otro locker           | Mensaje: "El miembro ya posee un locker"                    | 422 Unprocessable entity  |
| Estado `Available` con `member_id`         | Mensaje: "Estado `Available` no permite `member_id`"        | 422 Unprocessable entity  |
| Estado `Occupied` sin `member_id`          | Mensaje: "Estado `Occupied` requiere `member_id`"           | 422 Unprocessable entity  |
| Estado `Maintenance` con `member_id`       | Mensaje: "Estado `Maintenance` no permite `member_id`"      | 422 Unprocessable entity  |
| Error de conexión a DB                     | Mensaje: "Error interno, reintente más tarde"               | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateLockerRequest`).
2. Ampliar el `LockerRepository` con el método `update`.
3. Implementar la lógica en `UpdateLockerUseCase` utilizando el `LockerValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.
