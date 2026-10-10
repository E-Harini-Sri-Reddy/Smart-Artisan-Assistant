import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import API from "../api/axios";
import classes from "./PaymentsPage.module.css";

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

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendForm, setSendForm] = useState({
    assignmentId: null,
    type: "advance",
    amount: null,
    note: "",
  });
  const [approveAmount, setApproveAmount] = useState(null);
  const [approveNote, setApproveNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [payRes, assignRes] = await Promise.all([
        API.get("/products/assignments/payments/list"),
        API.get("/products/assignments/list"),
      ]);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
    } catch (err) {
      console.error(err);
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

  const stats = useMemo(() => {
    const received = payments.filter((p) => p.status === "Received");
    const paid = received.reduce((s, p) => s + Number(p.amount || 0), 0);
    const awaiting = payments
      .filter((p) => p.status === "Awaiting Confirmation")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending = payments
      .filter((p) => p.status === "Pending")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return {
      paid,
      awaiting,
      pending,
      count: payments.length,
    };
  }, [payments]);

  const assignmentOptions = useMemo(
    () =>
      assignments
        .filter(
          (a) =>
            !["Cancelled", "Rejected", "Assigned"].includes(a.status),
        )
        .map((a) => ({
          value: a._id,
          label: `${a.assignmentNumber} · ${a.product?.name || "Product"} · ${a.user?.name || "Artisan"}`,
        })),
    [assignments],
  );

  const openSend = () => {
    setSendForm({
      assignmentId: null,
      type: "advance",
      amount: null,
      note: "",
    });
    setSendOpen(true);
  };

  const handleSend = async () => {
    if (!sendForm.assignmentId) {
      alert("Select an assignment");
      return;
    }
    if (!sendForm.amount || Number(sendForm.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await API.post(`/products/assignments/${sendForm.assignmentId}/payments`, {
        type: sendForm.type,
        amount: sendForm.amount,
        note: sendForm.note,
      });
      setSendOpen(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  const openApprove = (payment) => {
    setSelectedPayment(payment);
    setApproveAmount(payment.amount);
    setApproveNote(payment.note || "");
    setApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setSaving(true);
    try {
      await API.post(
        `/products/assignments/payments/${selectedPayment._id}/approve`,
        {
          amount: approveAmount,
          note: approveNote,
        },
      );
      setApproveOpen(false);
      setSelectedPayment(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not approve payment");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelivery = async (assignmentId) => {
    try {
      await API.post(
        `/products/assignments/${assignmentId}/confirm-delivery`,
      );
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not confirm delivery");
    }
  };

  const inTransit = assignments.filter((a) => a.status === "In Transit");

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <div>
          <Title order={2}>Payments</Title>
          <Text c="dimmed" mt={4}>
            Track advances and final payments to artisans. Awaiting confirmation
            means you marked it sent — waiting for the artisan to confirm
            receipt.
          </Text>
        </div>
        <Button color="#9c6238" onClick={openSend}>
          Record payment
        </Button>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl" mt="lg">
        <Paper withBorder radius="lg" p="md" className={classes.statCard}>
          <Text size="sm" c="dimmed">
            Paid (confirmed)
          </Text>
          <Text fw={700} size="xl">
            {formatPay(stats.paid)}
          </Text>
        </Paper>
        <Paper withBorder radius="lg" p="md" className={classes.statCard}>
          <Text size="sm" c="dimmed">
            Awaiting confirmation
          </Text>
          <Text fw={700} size="xl">
            {formatPay(stats.awaiting)}
          </Text>
        </Paper>
        <Paper withBorder radius="lg" p="md" className={classes.statCard}>
          <Text size="sm" c="dimmed">
            Pending requests
          </Text>
          <Text fw={700} size="xl">
            {formatPay(stats.pending)}
          </Text>
        </Paper>
      </SimpleGrid>

      {inTransit.length > 0 && (
        <Paper withBorder radius="xl" p="lg" mb="xl">
          <Text fw={700} mb="sm">
            Products in transit — confirm receipt
          </Text>
          <Stack gap="sm">
            {inTransit.map((a) => (
              <Group key={a._id} justify="space-between">
                <Stack gap={2}>
                  <Text fw={600}>
                    {a.product?.name} · {a.assignmentNumber}
                  </Text>
                  <Text size="sm" c="dimmed">
                    From {a.user?.name} · Offer {formatPay(a.offeredPay)}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  color="#9c6238"
                  onClick={() => confirmDelivery(a._id)}
                >
                  Confirm product received
                </Button>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      <SegmentedControl
        mb="md"
        color="#9c6238"
        value={filter}
        onChange={setFilter}
        data={[
          { label: "All", value: "all" },
          { label: "Pending", value: "Pending" },
          { label: "Awaiting confirmation", value: "Awaiting Confirmation" },
          { label: "Received", value: "Received" },
        ]}
      />

      <Paper withBorder radius="xl" p="xl">
        {loading ? (
          <Text c="dimmed">Loading…</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Assignment</Table.Th>
                <Table.Th>Artisan</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((p) => (
                <Table.Tr key={p._id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {p.assignment?.product?.name || "Product"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {p.assignment?.assignmentNumber}
                    </Text>
                  </Table.Td>
                  <Table.Td>{p.artisan?.name || "—"}</Table.Td>
                  <Table.Td>
                    {p.type === "advance" ? "Advance" : "Final"}
                  </Table.Td>
                  <Table.Td>{formatPay(p.amount)}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(p.status)}>{p.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {p.status === "Pending" ? (
                      <Button
                        size="xs"
                        color="#9c6238"
                        onClick={() => openApprove(p)}
                      >
                        Send & await confirmation
                      </Button>
                    ) : p.status === "Awaiting Confirmation" ? (
                      <Text size="xs" c="dimmed">
                        Waiting for artisan
                      </Text>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Confirmed{" "}
                        {p.confirmedAt
                          ? new Date(p.confirmedAt).toLocaleDateString()
                          : ""}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {filtered.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No payments in this view.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Record payment to artisan"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Select
            label="Assignment"
            withAsterisk
            searchable
            data={assignmentOptions}
            value={sendForm.assignmentId}
            onChange={(v) => setSendForm((f) => ({ ...f, assignmentId: v }))}
            nothingFoundMessage="No eligible assignments"
          />
          <Select
            label="Payment type"
            withAsterisk
            data={[
              { value: "advance", label: "Advance" },
              { value: "final", label: "Final payment" },
            ]}
            value={sendForm.type}
            onChange={(v) => setSendForm((f) => ({ ...f, type: v }))}
          />
          <NumberInput
            label="Amount (₹)"
            withAsterisk
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={sendForm.amount}
            onChange={(v) =>
              setSendForm((f) => ({
                ...f,
                amount: v === "" || v === null ? null : Number(v),
              }))
            }
          />
          <Textarea
            label="Note"
            minRows={2}
            value={sendForm.note}
            onChange={(e) =>
              setSendForm((f) => ({ ...f, note: e.target.value }))
            }
          />
          <Text size="xs" c="dimmed">
            This will show as “Awaiting Confirmation” until the artisan confirms
            they received the money.
          </Text>
          <Button color="#9c6238" loading={saving} onClick={handleSend}>
            Mark as sent
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Approve advance request"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {selectedPayment?.artisan?.name} requested an advance for{" "}
            {selectedPayment?.assignment?.assignmentNumber}. Mark it sent to
            move it to awaiting confirmation.
          </Text>
          <NumberInput
            label="Amount (₹)"
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={approveAmount}
            onChange={(v) =>
              setApproveAmount(v === "" || v === null ? null : Number(v))
            }
          />
          <Textarea
            label="Note"
            minRows={2}
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
          />
          <Button color="#9c6238" loading={saving} onClick={handleApprove}>
            Send & await confirmation
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};
