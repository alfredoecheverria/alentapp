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
  Input,
  Checkbox,
} from "@chakra-ui/react";

import { LuPlus, LuRefreshCw, LuPencil, LuTrash2 } from "react-icons/lu";
import { useEffect, useState } from "react";

import type {CreateDisciplineRequest, DisciplineDTO, MemberDTO,} from "@alentapp/shared";

import { disciplinesService } from "../services/disciplines";
import { membersService } from "../services/members";

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "../components/ui/dialog";

import { Field } from "../components/ui/field";

import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection,
} from "../components/ui/select";

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDisciplineId, setEditingDisciplineId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDisciplineRequest>({
    member_id: "",
    reason: "",
    start_date: "",
    end_date: "",
    is_total_suspension: false,
  });

  const fetchDisciplines = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await disciplinesService.getAll();
      setDisciplines(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar sanciones");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (err) {
      console.error("Error al cargar miembros", err);
    }
  };

  useEffect(() => {
    fetchDisciplines();
    fetchMembers();
  }, []);

  const memberOptions = createListCollection({
    items: members.map((member) => ({
      label: `${member.name} (${member.dni})`,
      value: member.id,
    })),
  });

  const openCreateModal = () => {
    setEditingDisciplineId(null);
    setFormData({
      member_id: "",
      reason: "",
      start_date: "",
      end_date: "",
      is_total_suspension: false,
    });

    setIsDialogOpen(true);
  };

  const openEditModal = (discipline: DisciplineDTO) => {
    setEditingDisciplineId(discipline.id);
    setFormData({
      member_id: discipline.member_id,
      reason: discipline.reason,
      start_date: discipline.start_date,
      end_date: discipline.end_date,
      is_total_suspension: discipline.is_total_suspension,
    });

    setIsDialogOpen(true);
  };

  const handleDeactivate = async (discipline: DisciplineDTO) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas finalizar la sanción de ${discipline.member_id}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      await disciplinesService.deactivate(discipline.id);
      alert('Sanción finalizada correctamente');
      await fetchDisciplines();
    } catch (err: any) {
      alert(err.message || 'Error al finalizar la sanción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (editingDisciplineId) {
        await disciplinesService.update(editingDisciplineId, formData);
      } else {
        await disciplinesService.create(formData);
      }

      setIsDialogOpen(false);
      setEditingDisciplineId(null);
      fetchDisciplines();
    } catch (err: any) {
      alert(err.message || "Error al guardar la sanción");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot
      open={isDialogOpen}
      onOpenChange={(e) => setIsDialogOpen(e.open)}
    >
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">
              Gestión de Sanciones
            </Heading>

            <Text color="fg.muted" fontSize="md">
              Administración de sanciones y suspensiones de socios.
            </Text>
          </Stack>

          <HStack gap="3">
            <Button
              variant="outline"
              onClick={fetchDisciplines}
              disabled={isLoading}
            >
              <LuRefreshCw /> Actualizar
            </Button>

            <Button
              colorPalette="blue"
              size="md"
              onClick={openCreateModal}
            >
              <LuPlus /> Nueva sanción
            </Button>
          </HStack>
        </Flex>

        {/* Modal crear sanción */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingDisciplineId ? "Editar sanción" : "Crear nueva sanción"}
              </DialogTitle>
            </DialogHeader>

            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot
                    collection={memberOptions}
                    value={formData.member_id ? [formData.member_id] : []}
                    onValueChange={(e) =>
                      setFormData({
                        ...formData,
                        member_id: e.value[0],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>

                    <SelectContent>
                      {memberOptions.items.map((member) => (
                        <SelectItem
                          item={member}
                          key={member.value}
                        >
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Motivo" required>
                  <Input
                    placeholder="Ej. Conducta inapropiada"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reason: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Fecha de inicio" required>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_date: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Fecha de fin" required>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_date: e.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Checkbox.Root
                  checked={formData.is_total_suspension}
                  onCheckedChange={(value) =>
                    setFormData({
                      ...formData,
                      is_total_suspension: value,
                    })
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    Suspensión total
                  </Checkbox.Label>
                </Checkbox.Root>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </DialogActionTrigger>

              <Button
                type="submit"
                colorPalette="blue"
                loading={isSubmitting}
              >
                {editingDisciplineId ? "Guardar Cambios" : "Crear sanción"}
              </Button>
            </DialogFooter>

            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {/* Error */}
        {error && (
          <Box
            p="4"
            bg="red.50"
            color="red.700"
            borderRadius="md"
            border="1px solid"
            borderColor="red.200"
          >
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        {/* Tabla */}
        <Box
          bg="bg.panel"
          borderRadius="xl"
          boxShadow="sm"
          borderWidth="1px"
          overflow="hidden"
          minH="300px"
          position="relative"
        >
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">
                  Cargando sanciones...
                </Text>
              </Stack>
            </Center>
          ) : disciplines.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">
                  No se encontraron sanciones.
                </Text>

                <Button
                  variant="ghost"
                  onClick={fetchDisciplines}
                >
                  Reintentar
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">
                    Socio
                  </Table.ColumnHeader>

                  <Table.ColumnHeader py="4">
                    Motivo
                  </Table.ColumnHeader>

                  <Table.ColumnHeader py="4">
                    Inicio
                  </Table.ColumnHeader>

                  <Table.ColumnHeader py="4">
                    Fin
                  </Table.ColumnHeader>

                  <Table.ColumnHeader py="4">
                    Tipo
                  </Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">
                    Acciones
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {disciplines.map((discipline) => (
                  <Table.Row
                    key={discipline.id}
                    _hover={{ bg: "bg.muted/30" }}
                  >
                    <Table.Cell>
                      {discipline.member_id}
                    </Table.Cell>

                    <Table.Cell>
                      {discipline.reason}
                    </Table.Cell>

                    <Table.Cell>
                      {discipline.start_date}
                    </Table.Cell>

                    <Table.Cell>
                      {discipline.end_date}
                    </Table.Cell>

                    <Table.Cell>
                      <Box
                        display="inline-block"
                        px="2"
                        py="0.5"
                        borderRadius="md"
                        bg={
                          discipline.is_total_suspension
                            ? "red.50"
                            : "orange.50"
                        }
                        color={
                          discipline.is_total_suspension
                            ? "red.700"
                            : "orange.700"
                        }
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {discipline.is_total_suspension
                          ? "Total"
                          : "Parcial"}
                      </Box>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Editar sanción"
                          onClick={() => openEditModal(discipline)}
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Finalizar sanción"
                          onClick={() => handleDeactivate(discipline)}
                        >
                          <LuTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}