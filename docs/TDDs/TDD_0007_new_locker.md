---
id: 0007
estado: Propuesto
autor: Nahuel Fabian Fredes Coronilla
fecha: 2026-05-02
titulo: Creación de nuevo locker
---

# TDD-0007: Creación de nuevo locker

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos crear el registro de lockers del gimnasio para posteriormente llevar un control más exacto de a qué miembro le corresponde cada uno de estos y cuáles están disponibles.

### User Persona
*   **Nombre**: Miriam (Recepcionista)
*   **Necesidad**: Poder cargar el registro de lockers disponibles en el gimnasio para posteriormente llevar un mejor control de estos. Ver el estado de cada uno y asignarlo a un miembro.

### Criterios de Aceptación
- Como administrativo quiero poder registrar los lockers del club. Cargar su numero, estado, locación y poder asignarlo a un socio.

### Escenario de Éxito
- Si el usuario crea el locker con los datos validos, el sistema debe registrarlo correctamente y mostrar el mensaje de éxito.

### Escenario de Fallo
- Si el usuario ingresa un locker con `number` duplicado, inválido o con una combinación inválida de `status` o `member_id`, el sistema debe rechazar la creación y devolver el error correspondiente.


## Diseño Técnico (RFC)

Se definirá la entidad `Locker` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `number`: Número de identificación física del locker, número entero y único.
- `location`: Lugar donde se encuentra físicamente el locker. Cadena de texto.
- `status`: Estado en el que se encuentra el locker, Enumeración(`Available`, `Occupied`, `Maintenance`).
- `member_id`: Identificador del socio propietario del locker (UUID, clave foránea hacia `Member`).

### Contrato de API (@alentapp/shared)

- **Endpoint**: `POST /api/v1/lockers`
- **Request Body** (`CreateLockerRequest`):

```ts
{
    number: number; // requerido, entero > 0, único
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance'; // opcional, default 'Available'
    member_id?: string | null; // opcional
}
```

### Componentes de Arquitectura Hexagonal
1. **Puerto**: `LockerRepository` (Interface en el Dominio).
2. **Servicio de Dominio**: `LockerValidator` (Valida `number`, `member_id` y combinaciones válidas de `status`/`member_id`).
3. **Caso de Uso**: `CreateLocker` (Lógica que verifica si ya existe un locker con ese número).
4. **Adaptador de Salida**: `PostgresLockerRepository` (Persistencia usando Prisma).
5. **Adaptador de Entrada**: `LockerController` (Ruta HTTP).

## Casos de Borde y Errores
| Escenario                                  | Resultado Esperado                                          | Código HTTP               |
| ------------------------------------------ | ------------------------------------------------------------| ------------------------- |
| Número duplicado (`number`)                | Mensaje: "Ya existe un locker con ese número"               | 409 conflict              |
| Número inválido (<= 0 o no entero)         | Mensaje: "`number` debe ser entero y mayor a cero"          | 400 Bad Request           |
| `member_id` con formato inválido           | Mensaje: "`member_id` no válido"                            | 400 Bad Request           |
| `member_id` no existe                      | Mensaje: "El miembro indicado no existe"                    | 404 Not Found             |
| `member_id` ya tiene otro locker           | Mensaje: "El miembro ya posee un locker"                    | 422 Unprocessable entity  |
| Estado `Available` con `member_id`         | Mensaje: "Estado `Available` no permite `member_id`"        | 422 Unprocessable entity  |
| Estado `Occupied` sin `member_id`          | Mensaje: "Estado `Occupied` requiere `member_id`"           | 422 Unprocessable entity  |
| Estado `Maintenance` con `member_id`       | Mensaje: "Estado `Maintenance` no permite `member_id`"      | 422 Unprocessable entity  |
| Error de conexión a DB                     | Mensaje: "Error interno, reintente más tarde"               | 500 Internal Server Error |

## Plan de Implementación
1. Actualizar/añadir tipos en `@alentapp/shared` (`CreateLockerRequest`).
2. Crear `LockerValidator` en el dominio (valida tipo/rango de `number`, formato y existencia de `member_id`, y reglas de combinación `status`/`member_id`).
3. Implementar el `LockerRepository` con el metodo `create`
4. Implementar `CreateLockerUseCase` que use `LockerValidator` y el repositorio para la lógica de creación.
5. Crear la ruta `POST` en el controlador y enlazarla a la app de Fastify.
6. Consumir el endpoint desde el servicio de Frontend y crear modal en el frontend para la creación de lockers.