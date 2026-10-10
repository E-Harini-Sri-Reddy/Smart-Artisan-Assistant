import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const formatPay = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const statusColor = (status) => {
  switch (status) {
    case "Received":
      return "green";
    case "Awaiting Confirmation":
      return "orange";
    case "Pending":
      return "yellow";
    default:
      return "gray";
  }
};

export function MoneyFlow() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/products/assignments/payments/mine");
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const byAssignment = useMemo(() => {
    const map = new Map();
    for (const payment of filtered) {
      const key = payment.assignment?._id || payment.assignment || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          assignment: payment.assignment,
          payments: [],
        });
      }
      map.get(key).payments.push(payment);
    }
    return Array.from(map.values());
  }, [filtered]);

  const totals = useMemo(() => {
    const received = payments.filter((p) => p.status === "Received");
    const advance = received
      .filter((p) => p.type === "advance")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const finalPay = received
      .filter((p) => p.type === "final")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const awaiting = payments
      .filter((p) => p.status === "Awaiting Confirmation")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = payments
      .filter((p) => p.status === "Pending")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return { advance, finalPay, total: advance + finalPay, awaiting, pending };
  }, [payments]);

  const confirmPayment = async (paymentId) => {
    try {
      setConfirmingId(paymentId);
      await API.post(`/products/assignments/payments/${paymentId}/confirm`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not confirm payment");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <Box style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />
      <Container size="xs" py="xl">
        <Group mb="xl">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => navigate("/")}
          >
            <IconArrowLeft size={24} />
          </ActionIcon>
          <Title order={3}>Money Flow</Title>
        </Group>

        <SimpleStats totals={totals} />

        <SegmentedControl
          fullWidth
          mb="md"
          color="#9c6238"
          value={filter}
          onChange={setFilter}
          data={[
            { label: "All", value: "all" },
            { label: "Pending", value: "Pending" },
            { label: "Awaiting", value: "Awaiting Confirmation" },
            { label: "Received", value: "Received" },
          ]}
        />

        <Stack gap="md">
          {byAssignment.map(({ assignment, payments: rows }) => {
            const receivedRows = rows.filter((p) => p.status === "Received");
            const advanceTotal = receivedRows
              .filter((p) => p.type === "advance")
              .reduce((s, p) => s + Number(p.amount || 0), 0);
            const finalTotal = receivedRows
              .filter((p) => p.type === "final")
              .reduce((s, p) => s + Number(p.amount || 0), 0);

            return (
              <Paper key={assignment?._id || rows[0]?._id} withBorder radius="lg" p="lg">
                <Group justify="space-between" mb="sm" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={700}>
                      {assignment?.product?.name || "Assignment"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {assignment?.assignmentNumber || "—"} · Offer{" "}
                      {formatPay(assignment?.offeredPay)}
                    </Text>
                  </Stack>
                  <Badge color="#9c6238" variant="light">
                    Received {formatPay(advanceTotal + finalTotal)}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mb="sm">
                  Advance {formatPay(advanceTotal)} · Final{" "}
                  {formatPay(finalTotal)}
                </Text>

                <Stack gap="sm">
                  {rows.map((p) => (
                    <Paper key={p._id} withBorder radius="md" p="sm">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={2}>
                          <Text size="sm" fw={600}>
                            {p.type === "advance" ? "Advance" : "Final payment"}{" "}
                            · {formatPay(p.amount)}
                          </Text>
                          {p.note && (
                            <Text size="xs" c="dimmed">
                              {p.note}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed">
                            {new Date(p.createdAt).toLocaleString()}
                          </Text>
                        </Stack>
                        <Stack gap="xs" align="flex-end">
                          <Badge color={statusColor(p.status)}>{p.status}</Badge>
                          {p.status === "Awaiting Confirmation" && (
                            <Button
                              size="xs"
                              color="#9c6238"
                              loading={confirmingId === p._id}
                              onClick={() => confirmPayment(p._id)}
                            >
                              Confirm received
                            </Button>
                          )}
                        </Stack>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            );
          })}

          {!loading && byAssignment.length === 0 && (
            <Paper withBorder radius="lg" p="xl">
              <Text fw={600} ta="center">
                No payments yet
              </Text>
              <Text size="sm" c="dimmed" ta="center" mt="xs">
                Advances and final payments for your assignments will appear
                here.
              </Text>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

function SimpleStats({ totals }) {
  return (
    <Stack gap="xs" mb="lg">
      <Paper withBorder radius="md" p="md">
        <Text size="xs" c="dimmed">
          Total received
        </Text>
        <Text fw={700} size="lg">
          {formatPay(totals.total)}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          Advance {formatPay(totals.advance)} · Final {formatPay(totals.finalPay)}
        </Text>
      </Paper>
      <Group grow>
        <Paper withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed">
            Awaiting confirmation
          </Text>
          <Text fw={600}>{formatPay(totals.awaiting)}</Text>
        </Paper>
        <Paper withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed">
            Pending requests
          </Text>
          <Text fw={600}>{formatPay(totals.pending)}</Text>
        </Paper>
      </Group>
    </Stack>
  );
}
