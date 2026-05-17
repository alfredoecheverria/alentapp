
---
id: 0020
estado: Propuesto
autor: Ignacio Williams
fecha: 2026-05-10
titulo: Eliminar un detalle de prestamo de equipamiento
---

# TDD-0020: Eliminacion de un detalle de prestamo de equipamiento

## Contexto de Negocio (PRD)

### Objetivo
Permite eliminar un registro de detalle de prestamo de equipamiento de un socio, de esta forma el administrativo puede llevar la lista de registros sin detalles duplicados o cargados erroneamente.


### User Persona
- **Nombre**: Franco (Administrativo)
- **Necesidad**: Eliminar un registro de detalle de prestamo de equipamiento erroneo, irrelevante o de prueba de forma rapida desde la tabla principal.

### Criterios de Aceptación
- Como Administrativo quiero eliminar un detalle de prestamo asociado a un socio para llevar un registro limpio sin detalles repetidos o erroneos.
- Como Administrativo quiero ver un mensaje de confirmacion cuando finalice la operacion para garantizar que se realizo correctamente.
- Como Administrativo quiero ver un mensaje de advertencia previo a confirmar la operacion debido a que se trata de una accion irremediable.

### Escenario de Exito
- Si el usuario intenta eliminar un detalle de prestamo mediante la seleccion en la lista de detalles y confirma la operacion, entonces el sistema debe eliminar el detalle de la base de datos e informar al usuario con un mensaje de exito y finalmente actualizar la tabla.

### Escenario de Fallo
- Si el usuario intenta eliminar un detalle de prestamo con un id no existente mediante la seleccion en la lista de detalles y confirma la operacion, entonces el sistema debe rechazar la operacion y devolver un mensaje de error.


## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]

Como se trata de una operacion DELETE no requiere enviar todos los datos del prestamo, solo con el id del detalle se debe poder efectuar la operacion.

- Endpoint: `DELETE /api/v1/equipment-loans/:id-loan/details/:id-detail`
- Request Body: `None`
- Response: `204 No Content` en caso de exito.

### Componentes de Arquitectura Hexagonal

1. Puerto: EquipmentLoanDetailRepository (Metodo `delete(id)`).
2. Caso de Uso: `DeleteEquipmentLoanDetail` (Comprueba existencia previa via `findById` y delega la eliminacion).
3. Adaptador de Salida: `PostgresEquipmentLoanDetailRepository` (Eliminacion usando el metodo `delete` de Prisma).
4. Adaptador de Entrada: `EquipmentLoanDetailController` (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Detalle de prestamo inexistente | Mensaje: "El detalle de prestamo seleccionado no existe" | 404 Not Found |
| Eliminacion exitosa | Respuesta vacia | 204 No Content |
| Error en la Base de Datos | Mensaje: "Error al procesar la operacion, intente mas tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Ampliar el `EquipmentLoanDetailRepository` y `PostgresEquipmentLoanDetailRepository` con el metodo `delete`.
2. Implementar la logica de negocio en `DeleteEquipmentLoanDetailUseCase`.
3. Implementar el endpoint `Delete /api/v1/equipment-loans/:id-loan/details/:id-detail` en el `EquipmentLoanController` y registrarlo en `app.ts`.
4. Agregar el metodo `delete` al servicio Frontend (`equipmentLoanDetail.ts`).
5. Enlazar el boton de eliminacion en `EquipmentLoanDetailView.tsx` agregando la configuracion del navegador (`window.confirm`) antes de hacer la llamada.