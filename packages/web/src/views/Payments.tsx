import { 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Input
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useState } from "react";
import { paymentsService } from "../services/payments";
import type { CreatePaymentRequest, PaymentStatus } from "@alentapp/shared";
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
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

const statusCategories = createListCollection({
  items: [
    { label: "Pendiente", value: "Pendiente" },
    { label: "Pago", value: "Pago" },
    { label: "Cancelado", value: "Cancelado" },
  ],
});

export function PaymentsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentRequest>({
    amount: 0,
    due_date: "",
    member_id: "",
    status: "Pendiente",
    payment_date: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const openCreateModal = () => {
    setFormData({ 
      amount: 0, 
      due_date: "", 
      member_id: "", 
      status: "Pendiente", 
      payment_date: "", 
      year: new Date().getFullYear(), 
      month: new Date().getMonth() + 1 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await paymentsService.create(formData);
      setIsDialogOpen(false);
      alert("¡Pago registrado con éxito!");
    } catch (err: any) {
      alert(err.message || "Error al intentar crear el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Módulo de Registro de Pagos.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Registrar Nuevo Pago
            </Button>
          </HStack>
        </Flex>

        <Box 
          p="20" 
          border="2px dashed" 
          borderColor="gray.200" 
          borderRadius="xl" 
          bg="gray.50/50"
          textAlign="center"
        >
          <Text color="fg.muted" fontWeight="medium">
            No hay pagos registrados aún. Haz clic en "Registrar Nuevo Pago" para comenzar.
          </Text>
        </Box>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            
            <DialogBody>
              <Stack gap="4">
                <Field label="ID del Miembro" required helperText="Ingrese el identificador único del socio">
                  <Input 
                    placeholder="Ej: uuid-1234..." 
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Monto total" required>
                  <Input 
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Field>

                <HStack gap="4" width="full">
                  <Field label="Mes" required>
                    <Input 
                      type="number"
                      min={1} max={12}
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Field>
                  <Field label="Año" required>
                    <Input 
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </Field>
                </HStack>

                <Field label="Fecha de Vencimiento" required>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Fecha de Pago (Opcional)">
                  <Input 
                    type="date" 
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </Field>

                <Field label="Estado" required>
                  <SelectRoot 
                    collection={statusCategories} 
                    value={[formData.status]}
                    onValueChange={(e) => setFormData({ ...formData, status: e.value[0] as PaymentStatus })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusCategories.items.map((stat) => (
                        <SelectItem item={stat} key={stat.value}>
                          {stat.label}
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
                Guardar Registro
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}