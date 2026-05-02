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
- El sistema debe validar que el número de locker sea único.
- El sistema debe validar que el número de locker sea entero y mayor a cero.
- Si no se informa `status`, el locker debe crearse por defecto con el estado `Available`.
- Si `status` es `Available`, `memberId` debe ser `null`.
- Si `status` es `Maintenance`, `memberId` debe ser `null`.
- Si `status` es `Occupied`, `memberId` es obligatorio.
- El locker en estado `Maintenance` no puede asignarse a ningún miembro.
- Un miembro no puede tener más de un locker a la vez.


## Diseño Técnico (RFC)

Se definirá la entidad `Locker` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `number`: Número de identificación física del locker, número entero y único.
- `location`: Lugar donde se encuentra físicamente el locker. Cadena de texto.
- `status`: Estado en el que se encuentra el locker, Enumeración(`Available`, `Occupied`, `Maintenance`).
- `memberId`: Identificador del socio propietario del locker (UUID, clave foránea hacia `Member`).

### Contrato de API (@alentapp/shared)

Se documenta únicamente la operación de CREAR un locker (`new locker`) siguiendo el estilo de los demás TDD.

- **Endpoint**: `POST /api/v1/lockers`
- **Request Body** (`CreateLockerRequest`):

```ts
{
    number: number; // requerido, entero > 0, único
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance'; // opcional, default 'Available'
    memberId?: string | null; // opcional
}
```

### Componentes de Arquitectura Hexagonal
1. Puerto: LockerRepository (Interface en el Dominio).
2. Caso de Uso: CreateLocker (Lógica que verifica si ya existe un Locker con ese numero).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: LockerController (Ruta HTTP).

## Escenarios

### Escenario de Éxito
- Si el ususario crea el locker con los datos validos, el sistema debe registrarlo correctamente y mostrar el mensaje de éxito

### Escenario de Fallo
- Si el usuario ingresa un locker con `number` duplicado, inválido o con una combinación inválida de `status` o `memberId`, el sistema debe rechazar la creación y devolver el error correspondiente.

## Casos de Borde y Errores
| Escenario                                  | Resultado Esperado                                          | Código HTTP               |
| ------------------------------------------ | ------------------------------------------------------------| ------------------------- |
| Número duplicado (`number`)                | Mensaje: "Ya existe un locker con ese número"               | 409 conflict              |
| Número inválido (<= 0 o no entero)         | Mensaje: "`number` debe ser entero y mayor a cero"          | 400 Bad Request           |
| `memberId` con formato inválido            | Mensaje: "`memberId` no válido"                             | 400 Bad Request           |
| `memberId` no existe                       | Mensaje: "El miembro indicado no existe"                    | 404 Not Found             |
| `memberId` ya tiene otro locker            | Mensaje: "El miembro ya posee un locker"                    | 422 Unprocessable entity  |
| Estado `Occupied` sin `memberId`           | Mensaje: "Estado `Occupied` requiere `memberId`"            | 422 Unprocessable entity  |
| Error de conexión a DB                     | Mensaje: "Error interno, reintente más tarde"               | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia, incluir constraint `UNIQUE` para `number` y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso.
4. Crear formulario en React y conectar con el endpoint del backend.