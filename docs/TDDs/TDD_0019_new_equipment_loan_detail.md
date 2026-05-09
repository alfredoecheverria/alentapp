---
id: 0019
estado: Propuesto
autor: Ignacio Williams
fecha: 2026-05-09
titulo: Creacion de un nuevo detalle de prestamo de equipamiento
---

# TDD-0019: Creacion de nuevo detalle de prestamo de equipamiento

## Contexto de Negocio (PRD)

### Objetivo
Permite digitalizar el registro de detalles de prestamos de equipamiento que se le realiza a un miembro de un club, permitiendo ampliar la informacion relacionada (conjunto de equipos prestados, estado inicial de los equipos, cantidad de cada equipo, etc) al prestamo de equipamiento.


### User Persona
- **Nombre**: Franco (Administrativo)
- **Necesidad**: Llevar el registro de los detalles de los prestamos de equipamiento de forma que se ajuste a las necesidades de cada uno. El detalle del prestamo no puede ser parte de dos o mas prestamos.

### Criterios de Aceptación
- Como Administrativo quiero registrar un nuevo detalle de prestamo para poder registrar de forma amplia las particularidades de dicho prestamo.


### Escenario de Exito
- Si el usuario intenta registrar el detalle de un prestamo completando el formulario con los campos titulo y detalle, entonces el sistema registra el nuevo detalle de prestamo e informa con un mensaje de exito al usuario. 

### Escenario de Fallo
- Si el usuario intenta registrar el detalle de un prestamo completando el formulario con un prestamo de equipamiento que no existe, entonces el sistema debe emitir un mensaje de error notificando al usuario.

- Si el usuario intenta registrar el detalle de un prestamo completando el formulario dejando alguno de sus campos vacios, entonces el sistema debe emitir un mensaje de error notificando al usuario.

## Diseño Técnico (RFC)

### Modelo de Datos
Se definira la entidad `Equipment_Loan` con las siguientes propiedades:
- `id`: Identificador unico universal (UUID).
- `title`: Cadena de texto.
- `date`: Fecha en la que se registra el detalle.
- `detail`: Cadena de texto.
- `equipment_loan_id`: Identificador unico universal del prestamo de equipamiento al que se le asocia el detalle del prestamo (UUID, FK a la entidad `equipment_loan`).

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
- Endpoint: `POST /api/v1/equipment-loan-details`
- Request Body (CreateEquipmentLoanDetailRequest):
```ts
{
    title: string; //requerido
    date: date; //requerido
    detail: string; //requerido
    equipment_loan_id: string; //requerido
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: EquipmentLoanDetailRepository (Interface en el Dominio).
2. Caso de Uso: CreateEquipmentLoanDetail (Logica que verifica si el EquipmentLoan existe antes de llamar al repositorio)
3. Adaptador de Salida: DB persistence adapter (implementacion real en BD)
4. Adaptador de Entrada: EquipmentLoanDetailController (Ruta HTTP)

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Prestamo inexistente | Mensaje: "El prestamo no existe" | 404 Not Found |
| Campos vacios | Mensaje: "Los campos no pueden estar vacios" | 404 Not Found |
| Formato invalido de `date` | Mensaje: "Formato de fecha invalido" | 404 Not Found |
| Error en la Base de Datos | Mensaje: "Error al procesar la operacion, intente mas tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia y correr migracion: crear la tabla Equipment_Loan_Detail con sus campos correspondientes y su relacion a la tabla Equipment_Loan.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: Implementar logica para verificar que el prestamo de equipamiento existe.
4. Crear formulario en React y conectar con el endpoint del backend.
