import {
  Table,
  Button,
  Heading,
  HStack,
  IconButton,
  Stack,
  Text,
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { equipmentLoansService } from "../services/equipment-loans.ts";
import { membersService } from "../services/members.ts";
import type { CreateEquipmentLoanRequest, UpdateEquipmentLoanRequest, EquipmentLoanDTO, MemberDTO } from "@alentapp/shared";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

export function EquipmentLoansView() {
  const [loans, setLoans] = useState<EquipmentLoanDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Estado del Formulario
  const [formData, setFormData] = useState<CreateEquipmentLoanRequest>({
    item_name: "",
    status: "Loaned",
    loan_date: "",
    due_date: "",
    member_id: "",
  });

  // Carga inicial de datos (Préstamos y Socios)
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loansData, membersData] = await Promise.all([
        equipmentLoansService.getAll(),
        membersService.getAll()
      ]);
      setLoans(loansData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLoanId(null);
    setFormData({
      item_name: "",
      status: "Loaned",
      loan_date: "",
      due_date: "",
      member_id: "",
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (loan: EquipmentLoanDTO) => {
    setEditingLoanId(loan.id);
    setFormData({
      item_name: loan.item_name,
      status: loan.status,
      loan_date: loan.loan_date,
      due_date: loan.due_date,
      member_id: loan.member_id,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLoanId) {
        await equipmentLoansService.update(editingLoanId, formData as UpdateEquipmentLoanRequest);
      } else {
        await equipmentLoansService.create(formData);
      }
      setIsDialogOpen(false);
      fetchData(); // Refrescar la lista automáticamente
    } catch (err: any) {
      alert(err.message || "Error al guardar el préstamo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Estas seguro de que deseas eliminar este registro de prestamo?");
    if (!confirmDelete) return;

    try {
      await equipmentLoansService.delete(id);
      fetchData(); // Refrescar la tabla al toque
    } catch (err: any) {
      alert(err.message || "Error al eliminar el préstamo");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Socio no encontrado";
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Préstamos de Equipamiento</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona el inventario y control de recursos prestados a los integrantes de Alentapp.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Registrar Préstamo
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLoanId ? "Editar Préstamo" : "Registrar Nuevo Préstamo"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                
                <Field label="Socio / Miembro" required>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #3a3a3a",
                      background: "#18181b",
                      color: "white"
                    }}
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccione un socio...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} (DNI: {member.dni})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Equipo / Elemento" required>
                  <Input
                    placeholder="Nombre del equipo"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                  />
                </Field>

                {editingLoanId && (
                  <Field label="Estado del Préstamo" required>
                    <select
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #3a3a3a",
                        background: "#18181b",
                        color: "white"
                      }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      required
                    >
                      <option value="Loaned">Prestado</option>
                      <option value="Returned">Devuelto</option>
                      <option value="Damaged">Dañado</option>
                    </select>
                  </Field>
                )}

                <Field label="Fecha de Préstamo" required>
                  <Input
                    type="date"
                    value={formData.loan_date}
                    onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de Devolución Estimada" required>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingLoanId ? "Guardar Cambios" : "Confirmar Préstamo"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        {/* Tabla con Chakra UI */}
        <Box
          bg="bg.panel"
          borderRadius="xl"
          boxShadow="sm"
          borderWidth="1px"
          overflow="hidden"
          minH="200px"
          position="relative"
        >
          {isLoading ? (
            <Center h="200px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando registros...</Text>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row bg="bg.muted">
                  <Table.ColumnHeader fontSummary="bold">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader fontSummary="bold">Equipo</Table.ColumnHeader>
                  <Table.ColumnHeader fontSummary="bold">Fecha Retiro</Table.ColumnHeader>
                  <Table.ColumnHeader fontSummary="bold">Fecha Devolución</Table.ColumnHeader>
                  <Table.ColumnHeader fontSummary="bold">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader fontSummary="bold" textAlign="right">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {loans.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py="8" color="fg.muted">
                      No hay préstamos registrados actualmente.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  loans.map((loan) => (
                    <Table.Row key={loan.id} _hover={{ bg: "bg.subtle" }}>
                      <Table.Cell fontWeight="medium">{getMemberName(loan.member_id)}</Table.Cell>
                      <Table.Cell>{loan.item_name}</Table.Cell>
                      <Table.Cell>{loan.loan_date}</Table.Cell>
                      <Table.Cell>{loan.due_date}</Table.Cell>
                      <Table.Cell>
                        <Box
                          as="span"
                          px="2"
                          py="1"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="bold"
                          bg={loan.status === "Loaned" ? "orange.100" : loan.status === "Returned" ? "green.100" : "red.100"}
                          color={loan.status === "Loaned" ? "orange.800" : loan.status === "Returned" ? "green.800" : "red.800"}
                        >
                          {loan.status === "Loaned" ? "Prestado" : loan.status === "Returned" ? "Devuelto" : "Dañado"}
                        </Box>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <HStack gap="2" justify="flex-end">
                          <IconButton 
                           size="xs" 
                           variant="ghost" 
                           aria-label="Editar"
                           onClick={() => openEditModal(loan)}
                         >
                          <IconButton 
                            size="xs" 
                            variant="ghost" 
                            colorPalette="red" 
                            aria-label="Eliminar" 
                            onClick={() => handleDelete(loan.id)}>
                            <LuTrash2 />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
             </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}