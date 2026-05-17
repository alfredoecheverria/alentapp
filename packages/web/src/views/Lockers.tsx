import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Table,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { useEffect, useState } from "react";
import { type CreateLockerRequest, type LockerDTO, type LockerStatus, type MemberDTO } from "@alentapp/shared";
import { lockersService } from "../services/lockers";
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

const statusOptions = createListCollection({
  items: [
    { label: "Disponible", value: "Available" },
    { label: "Ocupado", value: "Occupied" },
    { label: "Mantenimiento", value: "Maintenance" },
  ],
});

export function LockersView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLockers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await lockersService.getAll();
        setLockers(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar los lockers");
      } finally {
        setIsLoading(false);
      }
    };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (error) {
      console.error("Error al cargar miembros", error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLockers();
  }, []);

  const memberOptions = createListCollection({
    items: [
      { label: "Ninguno", value: "" },
      ...members.map((member) => ({
        label: `${member.name} (${member.dni})`,
        value: member.id,
      })),
    ],
  });

  // Form state
  const [formData, setFormData] = useState<CreateLockerRequest>({
    number: 0,
    location: "",
    status: "Available",
    member_id: undefined,
  });

  const openCreateModal = () => {
    setFormData({
      number: 0,
      location: "",
      status: "Available",
      member_id: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await lockersService.create(formData);
      setIsDialogOpen(false);
      setFormData({
        number: 0,
        location: "",
        status: "Available",
        member_id: undefined,
      });
      fetchLockers();
    } catch (err: any) {
      alert(err.message || "Error al guardar el locker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocker = async (lockerId: string, lockerNumber: number) => {
    const confirmed = window.confirm(
      `Estás seguro de que deseas eliminar el locker número ${lockerNumber}?`
    );
    if (!confirmed) return;

    try {
      await lockersService.delete(lockerId);
      fetchLockers();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el locker");
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">
              Administración de Lockers
            </Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona los lockers disponibles del gimnasio.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Locker
            </Button>
          </HStack>
        </Flex>

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
                <Text color="fg.muted">Cargando lockers...</Text>
              </Stack>
            </Center>
          ) : lockers.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron lockers.</Text>
                <Button variant="ghost" onClick={fetchLockers}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Locación</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Miembro</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {lockers.map((locker) => (
                  <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {locker.number}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                    <Table.Cell color="fg.muted">{locker.status}</Table.Cell>
                    <Table.Cell color="fg.muted">
                      {locker.member ? `${locker.member.name} (${locker.member.dni})` : "Sin asignar"}
                    </Table.Cell>
                    <Table.Cell>
                      <IconButton
                        aria-label="Eliminar locker"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => handleDeleteLocker(locker.id, locker.number)}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        {/* Modal para agregar locker */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Locker</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número" required>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.number || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        number: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Locación" required>
                  <Input
                    placeholder="Ej. Natatorio"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Estado" required>
                  <SelectRoot
                    collection={statusOptions}
                    value={[formData.status || "Available"]}
                    onValueChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.value[0] as LockerStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.items.map((item) => (
                        <SelectItem item={item} key={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Miembro" helperText="Opcional">
                  <SelectRoot
                    collection={memberOptions}
                    value={formData.member_id ? [formData.member_id] : []}
                    onValueChange={(e) =>
                      setFormData({
                        ...formData,
                        member_id: e.value[0] || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberOptions.items.map((member) => (
                        <SelectItem item={member} key={member.value}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Agregar Locker
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}