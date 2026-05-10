---
id: 0021
estado: Propuesto
autor: Ignacio Williams
fecha: 2026-05-10
titulo: Modificacion de detalle de prestamo de equipamiento
---

# TDD-0018: Modificacion de detalle de prestamo de equipamiento

## Contexto de Negocio (PRD)

### Objetivo
Permite al equipo administrativo modificar la informacion relacionada a un detalle de prestamo de equipamiento existente en el sistema que requiera cambiarse.


### User Persona
- **Nombre**: Franco (Administrativo)
- **Necesidad**: Modificar los datos de un detalle de un prestamo seleccionado desde la tabla de forma rapida.

### Criterios de Aceptación
- Como Administrativo quiero modificar un detalle existente para corregir los datos ingresados erroneamente.

### Escenario de Exito
- Si el usuario intenta modificar los datos de un detalle completando el formulario respetando los datos necesarios y sus respectivos formatos, entonces el sistema actualiza el registro del detalle e informa al usuario con un mensaje de exito.

### Escenario de Fallo
- Si el usuario intenta modificar el detalle dejando algun campo del formulario incompleto, entonces el sistema debe emitir un mensaje de error notificando al usuario.


## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
- Endpoint: `PUT /api/v1/equipment-loan-details/:id`
- Request Body (UpdateEquipmentLoanDetailRequest):
```ts
{
    title?: string;
    detail?: string;
    date?: date;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: EquipmentLoanDetailRepository (Metodo `update(id, data)`).
2. Servicio de Dominio: `EquipmentLoanDetailValidator`
3. Caso de Uso: `UpdateEquipmentLoanDetail` (orquesta la validacion y llama al repositorio)
4. Adaptador de Salida: `PostgresEquipmentLoanDetailRepository` (Actualizacion usando el metodo `update` de Prisma)
5. Adaptador de Entrada: `EquipmentLoanDetailController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a codigos HTTP).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Detalle inexistente | Mensaje: "El detalle no existe" | 400 Bad Request |
| Formato de fecha invalido | Mensaje: "Formato invalido de fecha" | 400 Bad Request |
| Modificar un campo a vacio | Mensaje: "No se permite modificar un campo a vacio" | 400 Bad Request |
| Error en la Base de Datos | Mensaje: "Error al procesar la operacion, intente mas tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Actualizar interfaces en el paquete `@alentapp/shared` (`UpdateEquipmentLoanDetailRequest`).
2. Ampliar el `EquipmentLoanDetailRepository` con el metodo `update`.
3. Implementar la logica en `UpdateEquipmentLoanDetailUserCase` utilizando el `EquipmentLoanDetailValidator` centralizado.
4. Crear la ruta `PUT` en el controller y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creacion para permitir la edicion.
