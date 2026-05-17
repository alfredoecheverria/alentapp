import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import type { PaymentDTO, CreatePaymentRequest, PaymentStatus } from "@alentapp/shared";
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
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePaymentRequest & { status?: PaymentStatus }>({
    amount: 0,
    due_date: "",
    member_id: "",
    status: "Pendiente",
    payment_date: "",
    year: 0,
    month: 0,
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await paymentsService.getAll();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los pagos");
    } finally {
      setIsLoading(false);
    }
  };

    const openCreateModal = () => {
        setFormData({ amount: 0, due_date: "", member_id: "", status: "Pendiente", payment_date: "", year: 0, month: 0 });
        setIsDialogOpen(true);
    };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await paymentsService.create(formData as CreatePaymentRequest);
        setIsDialogOpen(false);
        fetchPayments(); // Refresh the list
    } catch (err: any) {
      alert(err.message || "Error al guardar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona los pagos de los integrantes de Alentapp.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Pago
            </Button>
          </HStack>
        </Flex>

        {/* Modal para agregar/editar pago */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{"Agregar Nuevo Pago"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">

                <Field label="DNI del Socio" required>
                  <Input 
                    placeholder="Ej. 12345678" 
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Monto" required>
                  <Input 
                    placeholder="Ej. 1000" 
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Field>
                <Field label="Mes Correspondiente al Pago" required>
                  <Input 
                    placeholder="Ej. 2023" 
                    type="number"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) || 0 })}
                    required
                  />
                </Field>
                <Field label="Año Correspondiente alPago" required>
                  <Input 
                    placeholder="Ej. 2023" 
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                    required
                  />
                </Field>
                <Field label="Fecha de Vencimiento" required>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha de Pago o Estimada" required>
                  <Input 
                    type="date" 
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Estado del Pago" required>
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
                {"Crear Pago"}
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
              <Text color="fg.muted">Cargando miembros...</Text>
            </Stack>
          </Center>
        ) : payments.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron pagos.</Text>
              <Button variant="ghost" onClick={fetchPayments}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Nro de Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Mes</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Año</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Fecha de Vencimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Fecha de Pago o Estimada</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payments.map((payment) => (
                <Table.Row key={payment.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    {payment.member_id}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{payment.amount}</Table.Cell>
                  <Table.Cell color="fg.muted">{payment.month}</Table.Cell>
                  <Table.Cell color="fg.muted">{payment.year}</Table.Cell>
                  <Table.Cell color="fg.muted">{payment.due_date}</Table.Cell>
                  <Table.Cell color="fg.muted">{payment.payment_date}</Table.Cell>
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
                      {payment.status}
                    </Box>
                  </Table.Cell>
                  <Table.Cell>
                    <Box 
                      display="inline-block" 
                      px="2" 
                      py="0.5" 
                      borderRadius="md" 
                      bg={payment.status === 'Pago' ? 'green.50' : 'orange.50'} 
                      color={payment.status === 'Pago' ? 'green.700' : 'orange.700'} 
                      fontSize="xs" 
                      fontWeight="bold"
                    >
                      {payment.status}
                    </Box>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap="2" justify="flex-end">
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