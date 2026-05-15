---
id: 0018
estado: Propuesto
autor: Ignacio Williams
fecha: 2026-05-03
titulo: Modificacion de prestamo de equipamiento
---

# TDD-0018: Modificacion de prestamo de equipamiento

## Contexto de Negocio (PRD)

### Objetivo
Permite al equipo administrativo modificar la informacion relacionada a un prestamo de equipamiento existente en el sistema que requiera cambiarse.


### User Persona
- **Nombre**: Franco (Administrativo)
- **Necesidad**: Modificar los datos de un prestamo seleccionado desde la tabla de forma rapida.

### Criterios de Aceptación
- Como Administrativo quiero modificar un prestamo existente para corregir los datos erroneos ingresados.

### Escenario de Exito
- Si el usuario intenta modificar los datos de un prestamo completando el formulario respetando los datos necesarios y sus respectivos formatos, entonces el sistema actualiza el registro del prestamo e informa al usuario con un mensaje de exito.

### Escenario de Fallo
- Si el usuario intenta modificar el prestamo completando el formulario con un socio que no existe, entonces el sistema debe emitir un mensaje de error notificando al usuario.

- Si el usuario intenta modificar el prestamo completando el formulario con un socio categoria "Cadet", entonces el sistema debe emitir un mensaje de error notificando al usuario.

- Si el usuario intenta modificar el prestamo completando el formulario con una fecha de prestamo posterior a la fecha de entrega, entonces el sistema debe emitir un mensaje de error notificando al usuario.

## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
- Endpoint: `PUT /api/v1/equipment-loans/:id`
- Request Body (UpdateEquipmentLoanRequest):
```ts
{
    item_name?: string;
    status?: 'Loaned' | 'Returned' | 'Damaged';
    loan_date?: date;
    due_date?: date;
    member_id?: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: EquipmentLoanRepository (Metodo `update(id, data)`).
2. Servicio de Dominio: `EquipmentLoanValidator`
3. Caso de Uso: `UpdateEquipmentLoan` (orquesta la validacion y llama al repositorio)
4. Adaptador de Salida: `PostgresEquipmentLoanRepository` (Actualizacion usando el metodo `update` de Prisma)
5. Adaptador de Entrada: `EquipmentLoanController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a codigos HTTP).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Miembro inexistente | Mensaje: "El usuario no existe" | 404 Not Found |
| Fecha Prestamo posterior a Fecha Devolucion | Mensaje: "Fecha prestamo no puede ser posterior a Fecha Devolucion" | 400 Bad Request |
| Miembro con categoria "Cadet" | Mensaje: "Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime" | 400 Bad Request |
| Error en la Base de Datos | Mensaje: "Error al procesar la operacion, intente mas tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Actualizar interfaces en el paquete `@alentapp/shared` (`UpdateEquipmentLoanRequest`).
2. Ampliar el `EquipmentLoanRepository` con el metodo `update`.
3. Implementar la logica en `UpdateEquipmentLoanUserCase` utilizando el `EquipmentLoanValidator` centralizado.
4. Crear la ruta `PUT` en el controller y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creacion para permitir la edicion.
