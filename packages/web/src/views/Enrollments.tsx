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
    NativeSelect
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { enrollmentsService } from "../services/enrollments.ts";
import { sportsService } from "../services/sports.ts";
import { membersService } from "../services/members.ts";
import type { EnrollmentDTO, CreateEnrollmentRequest, UpdateEnrollmentRequest } from "@alentapp/shared";
import type { SportDTO, MemberDTO } from "@alentapp/shared";
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
import {
    CheckboxRoot,
    CheckboxHiddenInput,
    CheckboxControl,
    CheckboxLabel,
} from "../components/ui/checkbox";
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
    createListCollection,
} from "../components/ui/select";

export function EnrollmentsView() {
    const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
    const [sports, setSports] = useState<SportDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for the modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateEnrollmentRequest>({
        member_id: "",
        sport_id: "",
        enrollment_date: "",
        is_active: false,
    });


    const fetchEnrollments = async () => {
        setError(null);
        try {
            const data = await enrollmentsService.getAll();
            setEnrollments(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar las Inscripciones");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los miembros");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSports = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await sportsService.getAll();
            setSports(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los deportes");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingEnrollmentId(null);
        setFormData({
            member_id: "",
            sport_id: "",
            enrollment_date: "",
            is_active: false,
        });
        setIsDialogOpen(true);
    };

    const openEditModal = (enrollment: EnrollmentDTO) => {
        setEditingEnrollmentId(enrollment.id);
        setFormData({
            member_id: enrollment.member_id,
            sport_id: enrollment.sport_id,
            enrollment_date: enrollment.enrollment_date,
            is_active: enrollment.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEnrollmentId) {
                const finalData = { enrollment_date: formData.enrollment_date, is_active: formData.is_active};
                await enrollmentsService.update(editingEnrollmentId, finalData as UpdateEnrollmentRequest);
            } else {
                await enrollmentsService.create(formData as CreateEnrollmentRequest);
            }
            setIsDialogOpen(false);
            fetchEnrollments(); // Refresh the list
        } catch (err: any) {
            alert(err.message || "Error al guardar la inscripcion");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEnrollment = async (id: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar esta inscripción? Esta acción no se puede deshacer.`)) {
            try {
                await enrollmentsService.delete(id);
                fetchEnrollments(); // Refresh the list
            } catch (err: any) {
                alert(err.message || "Error al eliminar la inscripción");
            }
        }
    };

    const getMemberName = (memberId: string) => {
        const member = members.find(m => m.id === memberId);
        return member ? member.name : "Desconocido";
    };

    const getSportName = (sportId: string) => {
        const sport = sports.find(s => s.id === sportId);
        return sport ? sport.name : "Desconocido";
    };

    useEffect(() => {
        fetchEnrollments()
        fetchMembers()
        fetchSports()
    }, []);

    return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Inscripciones</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona las inscripciones de socios a los deportes ofrecidos por Alentapp.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchEnrollments} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Inscripcion
            </Button>
          </HStack>
        </Flex>

        {/* Modal para agregar/editar deporte */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingEnrollmentId ? "Editar Inscripción" : "Inscribir Socio"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required={!editingEnrollmentId}>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            placeholder="Seleccione un Socio"
                            disabled={editingEnrollmentId}
                            required={!editingEnrollmentId}
                            value={[formData.member_id]}
                            onChange={(e) => setFormData({ ...formData, member_id: e.target.value})}
                        >
                            {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                        {member.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator/>
                    </NativeSelect.Root>
                </Field>
                <Field label="Deporte" required={!editingEnrollmentId}>
                    <NativeSelect.Root>
                        <NativeSelect.Field
                            placeholder="Seleccione un Deporte"
                            disabled={editingEnrollmentId}
                            required={!editingEnrollmentId}
                            value={[formData.sport_id]}
                            onChange={(e) => setFormData({ ...formData, sport_id: e.target.value})}
                        >
                            {sports.map((sport) => (
                                <option key={sport.id} value={sport.id}>
                                        {sport.name}
                                </option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator/>
                    </NativeSelect.Root>
                </Field>
                <Field label="Fecha de Inscripcion" required={!editingEnrollmentId}>
                    <Input
                    type="date"
                    value={formData.enrollment_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                    required={!editingEnrollmentId}
                    />
                </Field>
                <CheckboxRoot
                checked={formData.is_active}
                onCheckedChange={(e) => setFormData({ ...formData, is_active: !!e.checked})}
                >
                                <CheckboxHiddenInput />
                                <CheckboxControl />
                                <CheckboxLabel>Inscripcion activa?</CheckboxLabel>
                </CheckboxRoot>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingEnrollmentId ? "Guardar Cambios" : "Inscribir Socio"}
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
              <Text color="fg.muted">Cargando inscripciones...</Text>
            </Stack>
          </Center>
        ) : enrollments.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron inscripciones.</Text>
              <Button variant="ghost" onClick={fetchEnrollments}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Deporte</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Fecha de Inscripcion</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Activa?</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {enrollments.map((enrollment) => (
                <Table.Row key={enrollment.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    {getMemberName(enrollment.member_id)}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {getSportName(enrollment.sport_id)}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                        {enrollment.enrollment_date}
                  </Table.Cell>
                  <Table.Cell>
                    <Box
                      display="inline-block"
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      bg="blue.50"
                      color="blue.700"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {enrollment.is_active? 'Si' : 'No'}
                    </Box>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap="2" justify="flex-end">
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label="Editar inscripción"
                        onClick={() => openEditModal(enrollment)}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        colorPalette="red"
                        aria-label="Eliminar inscripción"
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
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
