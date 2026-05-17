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
import { membersService } from "../services/members.ts"; // Para cargar los socios en el select
import type { EquipmentLoanDTO, CreateEquipmentLoanRequest, MemberDTO } from "@alentapp/shared";
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
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Estado del Formulario alineado con shared en snake_case
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
      const [membersData] = await Promise.all([
        membersService.getAll()
      ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLoanId) {
        console.log("Edición no implementada aún en el backend");
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

  useEffect(() => {
    fetchData();
  }, []);

  // Función auxiliar para buscar el nombre del socio asociado a un préstamo
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

        {/* Modal de Registro */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLoanId ? "Editar Préstamo" : "Registrar Nuevo Préstamo"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                
                {/* Selector Desplegable de Socios */}
                <Field label="Socio / Miembro" required>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #3a3a3a",
                      background: "#18181b"
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

        {/* Tabla Desplegable con Chakra UI */}
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
              
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}