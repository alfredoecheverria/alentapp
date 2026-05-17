import {
  Button,
  Heading,
  Stack,
  Text,
  Box,
  Input,
  Checkbox,
} from "@chakra-ui/react";
import { useState } from "react";
import { disciplinesService } from "../services/disciplines";
import type { CreateDisciplineRequest } from "@alentapp/shared";

export function DisciplinesView() {
  const [form, setForm] = useState<CreateDisciplineRequest>({
    member_id: "",
    reason: "",
    start_date: "",
    end_date: "",
    is_total_suspension: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await disciplinesService.create(form);
      setMessage("Sanción creada correctamente");
      setForm({
        member_id: "",
        reason: "",
        start_date: "",
        end_date: "",
        is_total_suspension: false,
      });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="6">
      <Heading>Gestión de Sanciones</Heading>

      <Box as="form" onSubmit={handleSubmit} p="4" borderWidth="1px" borderRadius="lg">
        <Stack gap="3">

          <Input
            name="member_id"
            placeholder="ID del socio"
            value={form.member_id}
            onChange={handleChange}
          />

          <Input
            name="reason"
            placeholder="Motivo"
            value={form.reason}
            onChange={handleChange}
          />

          <Input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
          />

          <Input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
          />

          <Checkbox.Root>
            <Checkbox.HiddenInput
            name="is_total_suspension"
            Checked={form.is_total_suspension}
            onChange={handleChange}
          />
            <Checkbox.Control />
            <Checkbox.Label>
                Suspensión total
            </Checkbox.Label>
          </Checkbox.Root>

          <Button type="submit" colorScheme="blue" isLoading={loading}>
            Crear sanción
          </Button>

          {message && <Text>{message}</Text>}
        </Stack>
      </Box>
    </Stack>
  );
}