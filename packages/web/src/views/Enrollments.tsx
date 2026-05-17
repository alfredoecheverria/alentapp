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
import type { EnrollmentDTO, CreateEnrollmentRequest } from "@alentapp/shared";
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
        console.log("Not Implemented");
      } else {
        await enrollmentsService.create(formData as CreateEnrollmentRequest);
      }
      setIsDialogOpen(false);
      //fetchEnrollments(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Error al guardar la inscripcion");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    //fetchEnrollments()
    fetchMembers()
    fetchSports()
  }, []);

    return (
    <Stack gap="6">
      <Heading>Gestión de Inscripciones</Heading>

      <Box as="form" onSubmit={handleSubmit} p="4" borderWidth="1px" borderRadius="lg">
        <Stack gap="3">
            <Field label="Socio" required>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        placeholder="Seleccione un Socio"
                        required
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
            <Field label="Deporte" required>
                <NativeSelect.Root>
                    <NativeSelect.Field
                        placeholder="Seleccione un Deporte"
                        required
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
            <Field label="Fecha de Inscripcion" required>
                <Input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                required
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

          <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
            Crear inscripcion
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
