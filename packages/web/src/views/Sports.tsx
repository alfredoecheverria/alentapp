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
import { sportsService } from "../services/sports.ts";
import type { SportDTO, CreateSportRequest } from "@alentapp/shared";
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

export function SportsView() {
  //const [sports, setSports] = useState<SportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSportRequest>({
    name: "",
    description: "",
    max_capacity: 0,
    additional_price: 0.0,
    requires_medical_certificate: false,
  });

  /*const fetchSports = async () => {
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
  };*/

  const openCreateModal = () => {
    setEditingSportId(null);
    setFormData({ name: "", description: "", max_capacity: 0, additional_price: 0.0, requires_medical_certificate: false });
    setIsDialogOpen(true);
  };

  const openEditModal = (sport: SportDTO) => {
    setEditingSportId(sport.id);
    setFormData({
      name: sport.name,
      description: sport.description,
      max_capacity: sport.max_capacity,
      additional_price: sport.additional_price,
      requires_medical_certificate: sport.requires_medical_certificate,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
            console.log(formData);
      if (editingSportId) {
        console.log("Not Implemented");
      } else {
        await sportsService.create(formData as CreateSportRequest);
      }
      setIsDialogOpen(false);
      //fetchSports(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Error al guardar el deporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSport = async (id: string, name: string) => {
    /*if (window.confirm(`¿Estás seguro de que deseas eliminar al miembro "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await membersService.delete(id);
        fetchMembers(); // Refresh the list
      } catch (err: any) {
        alert(err.message || "Error al eliminar el miembro");
      }
    }*/
    console.log("Not Implemented");
  };

  /*useEffect(() => {
    fetchSports();
  }, []);*/

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Deportes</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona los deportes ofrecidos a los integrantes de Alentapp.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline"  disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Deporte
            </Button>
          </HStack>
        </Flex>

        {/* Modal para agregar/editar deporte */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSportId ? "Editar Deporte" : "Agregar Nuevo Deporte"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre" required>
                  <Input
                    placeholder="Ej. Kung-Fu"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Descripcion" required>
                  <Input
                    placeholder="Ej. Arte marcial full-contact de origen chino"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Capacidad Máxima de Practicantes" required>
                  <Input
                                        type="number"
                    placeholder="5"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Coste Adicional" required>
                  <Input
                                        type="number"
                    value={formData.additional_price}
                    onChange={(e) => setFormData({ ...formData, additional_price: parseFloat(e.target.value) })}
                    required
                  />
                </Field>
                  <CheckboxRoot
                    checked={formData.requires_medical_certificate}
                    onCheckedChange={(e) => setFormData({ ...formData, requires_medical_certificate: !!e.checked})}
                  >
                                    <CheckboxHiddenInput />
                                    <CheckboxControl />
                                    <CheckboxLabel>Requiere certificado médico?</CheckboxLabel>
                  </CheckboxRoot>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingSportId ? "Guardar Cambios" : "Crear Deporte"}
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
              <Text color="fg.muted">Cargando deportes...</Text>
            </Stack>
          </Center>
        ) : <div></div>}
        </Box>
    </Stack>
  </DialogRoot>
);
}
