---
id: 0010
estado: Propuesto
autor: Juan Ignacio Piazza
fecha: 2026-05-02
titulo: Registro de Nuevos Deportes
---

# TDD-0010: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Digitalizar el registro de actividades deportivas ofrecidas por el club. Este registro verifica que el nombre del deporte es único e inmutable para cada deporte ofrecido.

### User Persona

- Nombre: Jorge (Administrativo).
- Necesidad: Registrar los deportes ofrecidos para luego poder llevar el registro de que socios practican que deportes. No debe poder existir más de una vez el mismo deporte, y una vez ingresado un deporte, solo deben poder modificarse su descripción y/o cupo máximo.

### Criterios de Aceptación

- Como Administrativo quiero poder registrar nuevos deportes para poder llevar un registro de las actividades que realiza cada socio, asi como los montos extra que deben pagar.

### Escenario de Exito

- Si el usuario completa el formulario de registro con los campos Nombre, Descripcion, Capacidad máxima, Precio adicional y Requiere certificado médico con datos validos, entonces el sistema registra el nuevo deporte e informa al usuario con un mensaje de exito.

### Escenario de Fallo

- Si el usuario ingresa un nombre de deporte ya existente, una capacidad máxima menor o igual a cero, o un precio adicional negativo, el sistema debe informarlo con un mensaje de error.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único.
- `description`: Cadena de texto, describe el deporte.
- `max_capacity`: Capacidad de socios registrados en un dado momento. Debe ser mayor a cero.
- `additional_price`: Importe extra al costo de la cuota social. Debe ser cero o mayor a cero.
- `requires_medical_certificate`: Registra si se requiere certificado medico para practicar dicho deporte. (Booleano)

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/sports`
- Request Body (CreateSportRequest):
```ts
{
    name: string;
    description: string;
    max_capacity: number;
    additional_price?: float | null; // opcional, default: 0
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `create(data)`).
2. **Servicio de Dominio**: `SportValidator` (Lógica que verifica si el `name` ya existe y si `max_capacity` es mayor a 0 antes de llamar al repositorio).
3. **Caso de Uso**: `CreateSportUseCase` (Orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresSportRepository` (Creacion del registro usando el método `create` de Prisma).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP)

## Casos de Borde y Errores

| Escenario                             | Resultado Esperado                                                            | Código HTTP               |
| ------------------------------------- | ----------------------------------------------------------------------------  | ------------------------- |
| Nombre ya registrado                  | Mensaje: "Ya existe un deporte con ese nombre"                                | 409 Conflict              |
| Capacidad máxima menor o igual a 0    | Mensaje: "Capacidad máxima inválida"                                          | 400 Bad Request           |
| Precio adicional menor a 0            | Mensaje: "El valor de precio adicional debe ser un numero igual o mayor a 0"  | 400 Bad Request           |
| Error de conexión a DB                | Mensaje: "Error interno, reintente más tarde"                                 | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración: crear la tabla Sport con los campos correspondientes, incluyendo contraint `UNIQUE` para `name`, y correr la migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: Implementar lógica de para verificar que `max_capacity` sea mayor a cero y `additional_price` sea igual o mayor a cero.
4. Crear formulario en React y conectar con el endpoint del backend.
