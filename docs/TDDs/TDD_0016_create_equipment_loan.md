---
id: 0016
estado: Propuesto
autor: Ignacio Williams
fecha: 2026-05-03
titulo: Creacion de un nuevo prestamo de equipamiento
---

# TDD-0016: Creacion de nuevo prestamo de equipamiento

## Contexto de Negocio (PRD)

### Objetivo
Permite digitalizar el registro de prestamos de equipamiento que se le realiza a un miembro de un club, permitiendo verificar el detalle de lo que se presto, a quien se presto y el plazo del prestamo.


### User Persona
- **Nombre**: Franco (Administrativo)
- **Necesidad**: Llevar el registro de los prestamos de equipamiento efectuados por los socios del club. El mismo equipamiento no puede ser parte de dos o mas prestamos en simultaneo.

### Criterios de Aceptación
- Como Administrativo quiero registrar un nuevo prestamo que solicito un socio de categoria "Senior" o "Lifetime" para poder efectuar dicho prestamo.

### Escenario de Exito
- Si el usuario intenta registrar el prestamo completando el formulario con los campos Nombre Item, Estado, Fecha Prestamo, Fecha Devolucion y Miembro ("Senior" o "Lifetime"), entonces el sistema registra el nuevo prestamo e informa con un mensaje de exito al usuario. 

### Escenario de Fallo
- Si el usuario intenta registrar el prestamo completando el formulario con un socio que no existe, entonces el sistema debe emitir un mensaje de error notificando al usuario.

- Si el usuario intenta registrar el prestamo completando el formulario con un socio categoria "Cadet", entonces el sistema debe emitir un mensaje de error notificando al usuario.

## Diseño Técnico (RFC)

### Modelo de Datos
Se definira la entidad `Equipment_Loan` con las siguientes propiedades:
- `id`: Identificador unico universal (UUID).
- `item_name`: cadena de texto.
- `status`: Enumeracion (`Loaned`, `Returned`, `Damaged`).
- `loan_date`: Fecha en la que se realiazo el prestamo.
- `due_date`: Fecha en la que se termina el prestamo.
- `member_id`: Identificador unico universal del miembro al que se le asocia el prestamo del equipamiento (UUID, FK a la entidad `Member`).

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
- Endpoint: `POST /api/v1/equipment-loans`
- Request Body (CreateEquipmentLoanRequest):
```ts
{
    item_name: string;
    status: 'Loaned' | 'Returned' | 'Damaged';
    loan_date: date;
    due_date: date;
    member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: EquipmentLoanRepository (Interface en el Dominio).
2. Caso de Uso: CreateEquipmentLoan (Logica que verifica si el Member existe antes de llamar al repositorio)
3. Adaptador de Salida: DB persistence adapter (implementacion real en BD)
4. Adaptador de Entrada: EquipmentLoanController (Ruta HTTP)

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Miembro inexistente | Mensaje: "El usuario no existe" | 404 Not Found |
| Fecha Prestamo posterior a Fecha Devolucion | Mensaje: "Fecha prestamo no puede ser posterior a Fecha Devolucion" | 400 Bad Request |
| Miembro con categoria "Cadet" | Mensaje: "Solo se permite realizar prestamos a miembros con categoria Senior o Lifetime" | 400 Bad Request |
| Error en la Base de Datos | Mensaje: "Error al procesar la operacion, intente mas tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia y correr migracion: crear la tabla Equipment_Loan con sus campos correspondientes y su relacion a la tabla Member.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso: Implementar logica para verificar que el miembro existe, que el miembro pertenece a la categoria "Senior" o "Lifetime" y que `due_date` sea posterior a `loan_date`.
4. Crear formulario en React y conectar con el endpoint del backend.