---
id: 0004
estado: Propuesto
autor: Avril Lugo Gonzalez
fecha: 2026-05-02
titulo: Registro de Nuevos Pagos
---

# TDD-0004: Registro de Nuevos Pagos

## Contexto de Negocio (PRD)

### Objetivo
Digitalizar el registro de cuotas sociales vinculadas a un socio. Este registro verifica que el socio cumple con la obligación financiera que tiene con la institución. 

### User Persona
- Nombre: Juan (Tesorería/Administración)
- Necesidad: Registrar los pagos realizados. No debe permitirse que el proceso de cobro se ejecute dos veces. 

### Criterios de Aceptación
- Como Tesorero quiero ingresar un nuevo pago para registar que el socio cumplió con su obligación financiera.

### Escenario de Éxito
 - Si el usuario ingresa el pago completando los campos Monto, Mes, Año, Estado, Fecha de Vencimiento y Fecha de Pago con datos que sean válidos, entonces el sistema registra el pago y lo informa al usuario mediante un mensaje de éxito.
 
 ### Escenario de Fallo
 - Si el usuario ingresa un socio que no existe, el sistema debe informarlo con un mensaje de error.


## Diseño Técnico (RFC)

### Modelo de Datos
Se definirá la entidad `Payment` con las siguientes propiedades:
- `id`: Identificador único universal (UUID).
- `amount`: Importe total pagado por la cuota social.
- `month`: Mes correspondiente a la cuota a pagar.
- `year`: Año correspondiente a la cuota a pagar.
- `status`: Enumeración (`Pendiente`, `Pago`, `Cancelado`)
- `due_date`: Fecha en la que vence el plazo de pago de la cuota social.
- `payment_date`: Fecha en la que se efectuó el pago de la cuota social. 
- `member_id`: Identificador único universal del socio asociado al pago realizado (UUID, FK hacia la entidad 'Member').

### Contrato de API (@alentapp/shared)
- Endpoint: `POST /api/v1/payment`
- Request Body (CreatePaymentRequest):
```ts
{
    amount: float;
    month: int;
    year: int;
    status: 'Pendiente' | 'Pago' | 'Cancelado';
    due_date: date;
    payment_date: datetime;
    member_id: string;
}
```


### Componentes de Arquitectura Hexagonal
1. Puerto: PaymentRepository (Interface en el Dominio).
2. Caso de Uso: CreatePayment (Lógica que verifica si el Member existe antes de llamar al repositorio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: PaymentController (Ruta HTTP).


## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Usuario Inexistente         | Mensaje: "El usuario ingresado no existe"     | 404 Not Found             |
| Monto Inválido              | Mensaje: "El valor del pago debe ser un numero mayor a cero"| 400 Bad Request |
| Creación de un Pago con estado 'Cancelado'| Mensaje: "No se puede crear un pago con estado 'Cancelado'"| 400 Bad Request |
| Pago ya registrado          | Mensaje: "Ya existe un pago registrado asociado a este socio en correspondiente al mes y año ingresados"  | 409 Confict |
| Error en la Base de Datos   | Mensaje: "Error al procesar la operación, intente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración: crear la tabla Payment con sus relaciones a Member y los campos correspondientes. 
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: programar la logica para verificar que el socio exista, el monto sea un valor mayor a cero y que el registro del pago sea inmutable (es decir, que no se permita realizar la baja fisica del mismo).
4. Crear formulario en React y conectar con el endpoint del backend: desarrollar la interfaz de usuario para que el personal de Tesorería cargue los pagos, enviando los datos al endpoint POST /api/v1/payments y manejando las respuestas de éxito o error.