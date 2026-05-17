import {
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useEffect, useState } from "react";
import type { CreateLockerRequest, LockerStatus, MemberDTO } from "@alentapp/shared";
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

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await membersService.getAll();
        setMembers(data);
      } catch (error) {
        console.error("Error al cargar miembros", error);
      }
    };

    loadMembers();
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
    } catch (err: any) {
      alert(err.message || "Error al guardar el locker");
    } finally {
      setIsSubmitting(false);
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
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Locker
            </Button>
          </HStack>
        </Flex>

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