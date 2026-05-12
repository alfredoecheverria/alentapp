---
id: 0005
estado: Propuesto
autor: Avril Lugo Gonzalez
fecha: 2026-05-03
titulo: Modificación de Pagos
---

# TDD-0005: Modificación de Pagos

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos corregir o modificar la información de un pago ya existente en el sistema, como la fecha de pago, el monto u otros datos que se hayan cargado de forma errónea y requieran cambiarse.

### User Persona
- Nombre: Juan (Tesorería/Administración)
- Necesidad: Modificar datos de los pagos rápidamente desde la tabla del panel de administración. Por ejemplo, actualizar el monto abonado o la fecha de pago.


### Criterios de Aceptación
- Como Tesorero quiero modificar un pago que ya existe para corregir y/o modificar los datos que se ingresaron de manera errónea.

### Escenario de Éxito
 - Si el usuario modifica el/los dato/s necesarios con un formato válido, entonces el sistema actualiza el registro y lo informa al usuario mediante un mensaje de éxito.
 
 ### Escenario de Fallo
 - Si el usuario quiere modificar el estado de pago de 'Pendiente' a 'Pago', el sistema cancela la operacion y muestra un mensaje de error indicando que los pagos solo pueden pasar de 'Pendiente' o 'Pago' a 'Cancelado'.
 - Si el usuario ingresa un id de pago que no está registrado, el sistema debe notificar mediante un mensaje de error que el pago ingresado no existe. 


## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
- Endpoint: `PUT /api/v1/payments/:id`.
- Request Body (CreatePaymentRequest):
```ts
{
    amount?: float;
    month?: int;
    year?: int;
    due_date?: date;
    status?: 'Pendiente' | 'Pago' | 'Cancelado';
    payment_date?: datetime;
    member_id?: string;
}
```


### Componentes de Arquitectura Hexagonal
1. Puerto: PaymentRepository (metodo update(id, data)).
2. Servicio de Dominio: `PaymentValidator`.
3. Caso de Uso: UpdatePayment (orquesta la validación y llama al repositorio).
4. Adaptador de Salida: PostgresPaymentRepository (actualización usando el método `update` de Prisma).
5. Adaptador de Entrada: PaymentController (Ruta HTTP, se extrae el id especificado en la url y mapea excepciones a códigos HTTP).


## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Pago Inexistente            | Mensaje: "El pago ingresado no existe"        | 404 Not Found             |
| Monto Inválido              | Mensaje: "El valor del pago debe ser un numero mayor a cero"| 400 Bad Request |
| Cambio de Estado Inválido   | Mensaje: "No se puede cambiar el estado de 'Pago' a 'Pendiente' o desde 'Pago' o 'Pendiente' a 'Cancelado'" | 400 Bad Request |
| Error en la Base de Datos   | Mensaje: "Error al procesar la operación, intente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdatePaymentRequest`).
2. Ampliar el `PaymentRepository` con el método `update`.
3. Implementar la lógica en `UpdatePaymentUseCase` utilizando el `PaymentValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.