import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import API from "../api/axios";
import { PhotoCaptureInput } from "../components/PhotoCaptureInput";
import classes from "./SettingsPage.module.css";

const statusColor = (status) => {
  switch (status) {
    case "Completed":
      return "green";
    case "In Progress":
      return "blue";
    case "Accepted":
      return "cyan";
    case "In Transit":
      return "violet";
    case "Rejected":
      return "red";
    case "Cancelled":
      return "gray";
    default:
      return "orange";
  }
};

const formatPay = (amount) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return "—";
  }
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const emptyForm = {
  productId: null,
  userId: null,
  assignmentType: "Customization",
  quantity: 1,
  priority: "Medium",
  offeredPay: null,
  dueDate: "",
  location: "",
  notes: "",
  requiredMaterials: "",
  requiredSkills: "",
};

export const AdminAssignmentsPage = () => {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState(emptyForm);
  const [assignFiles, setAssignFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyPay, setReplyPay] = useState(null);
  const [replySaving, setReplySaving] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payType, setPayType] = useState("advance");
  const [payAmount, setPayAmount] = useState(null);
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [membersRes, productsRes, assignRes] = await Promise.all([
        API.get("/organizations/members"),
        API.get("/products"),
        API.get("/products/assignments/list"),
      ]);
      setMembers(membersRes.data || []);
      setProducts(productsRes.data || []);
      setAssignments(assignRes.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const artisanOptions = members
    .filter((m) => m.status === "active" && m.role === "user" && m.user)
    .map((m) => ({
      value: m.user._id,
      label: `${m.user.name} (${m.user.email})`,
    }));

  const productOptions = products.map((p) => ({
    value: p._id,
    label: p.name,
  }));

  const handleCreate = async () => {
    if (!assignForm.productId || !assignForm.userId) {
      alert("Product and artisan are required");
      return;
    }
    if (!assignForm.assignmentType) {
      alert("Assignment type is required");
      return;
    }
    if (!assignForm.quantity || Number(assignForm.quantity) < 1) {
      alert("Quantity is required");
      return;
    }
    if (!assignForm.priority) {
      alert("Priority is required");
      return;
    }
    if (
      assignForm.offeredPay === null ||
      assignForm.offeredPay === undefined ||
      assignForm.offeredPay === "" ||
      Number(assignForm.offeredPay) < 0
    ) {
      alert("Offered pay is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(assignForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });
      (assignFiles || []).forEach((file) => {
        formData.append("attachments", file);
      });
      await API.post("/products/assignments", formData);
      setAssignForm(emptyForm);
      setAssignFiles([]);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Assignment failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.put(`/products/assignments/${id}`, { status: "Cancelled" });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleConfirmDelivery = async (id) => {
    try {
      await API.post(`/products/assignments/${id}/confirm-delivery`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not confirm delivery");
    }
  };

  const openPay = (assignment, type = "advance") => {
    setPayTarget(assignment);
    setPayType(type);
    setPayAmount(type === "final" ? assignment.offeredPay : null);
    setPayNote("");
    setPayOpen(true);
  };

  const handleSendPayment = async () => {
    if (!payTarget) return;
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    setPaySaving(true);
    try {
      await API.post(`/products/assignments/${payTarget._id}/payments`, {
        type: payType,
        amount: payAmount,
        note: payNote,
      });
      setPayOpen(false);
      setPayTarget(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not record payment");
    } finally {
      setPaySaving(false);
    }
  };

  const openReply = (assignment) => {
    setReplyTarget(assignment);
    setReplyMessage("");
    setReplyPay(assignment.offeredPay ?? null);
    setReplyOpen(true);
  };

  const handlePriceReply = async () => {
    if (!replyTarget) return;
    if (!replyMessage.trim()) {
      alert("A reply message is required");
      return;
    }
    setReplySaving(true);
    try {
      await API.post(`/products/assignments/${replyTarget._id}/price-reply`, {
        message: replyMessage.trim(),
        offeredPay: replyPay,
      });
      setReplyOpen(false);
      setReplyTarget(null);
      setReplyMessage("");
      setReplyPay(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Reply failed");
    } finally {
      setReplySaving(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <Title order={2}>Assignments</Title>
        <Text c="dimmed" mt={4}>
          Assign products and work to artisans. Completed work updates Production
          Management.
        </Text>
      </div>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Text fw={700} mb="md">
          Assignment details
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          <Select
            label="Product"
            withAsterisk
            data={productOptions}
            value={assignForm.productId}
            onChange={(v) => setAssignForm((f) => ({ ...f, productId: v }))}
            placeholder={
              productOptions.length ? "Select product" : "No products yet"
            }
            searchable
            nothingFoundMessage="No products found"
            required
          />
          <Select
            label="Assign to Artisan"
            withAsterisk
            data={artisanOptions}
            value={assignForm.userId}
            onChange={(v) => setAssignForm((f) => ({ ...f, userId: v }))}
            placeholder={
              artisanOptions.length ? "Select artisan" : "No artisans yet"
            }
            searchable
            nothingFoundMessage="No artisans found"
            required
          />
          <Select
            label="Assignment type"
            withAsterisk
            data={[
              "Installation",
              "Repair",
              "Customization",
              "Inspection",
              "Other",
            ]}
            value={assignForm.assignmentType}
            onChange={(v) =>
              setAssignForm((f) => ({ ...f, assignmentType: v }))
            }
            required
          />
          <NumberInput
            label="Quantity"
            withAsterisk
            min={1}
            value={assignForm.quantity}
            onChange={(v) =>
              setAssignForm((f) => ({ ...f, quantity: Number(v) || 1 }))
            }
            required
          />
          <Select
            label="Priority"
            withAsterisk
            data={["Low", "Medium", "High", "Urgent"]}
            value={assignForm.priority}
            onChange={(v) => setAssignForm((f) => ({ ...f, priority: v }))}
            required
          />
          <NumberInput
            label="Offered pay (₹)"
            withAsterisk
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            placeholder="Amount you will pay the artisan"
            value={assignForm.offeredPay}
            onChange={(v) =>
              setAssignForm((f) => ({
                ...f,
                offeredPay: v === "" || v === null ? null : Number(v),
              }))
            }
            required
          />
          <TextInput
            label="Due date"
            type="datetime-local"
            value={assignForm.dueDate}
            onChange={(e) =>
              setAssignForm((f) => ({ ...f, dueDate: e.target.value }))
            }
          />
        </SimpleGrid>

        <Textarea
          label="Notes / Instructions"
          placeholder="Anything the artisan needs to know"
          mb="md"
          minRows={3}
          value={assignForm.notes}
          onChange={(e) =>
            setAssignForm((f) => ({ ...f, notes: e.target.value }))
          }
        />

        <Accordion variant="separated" radius="md" mb="md">
          <Accordion.Item value="optional">
            <Accordion.Control>
              <Text fw={600}>Optional Fields</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <TextInput
                  label="Location / Site"
                  placeholder="Customer / workshop location"
                  value={assignForm.location}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
                <Textarea
                  label="Required materials"
                  placeholder="One per line or comma-separated"
                  minRows={2}
                  value={assignForm.requiredMaterials}
                  onChange={(e) =>
                    setAssignForm((f) => ({
                      ...f,
                      requiredMaterials: e.target.value,
                    }))
                  }
                />
                <Textarea
                  label="Required skills"
                  placeholder="One per line or comma-separated"
                  minRows={2}
                  value={assignForm.requiredSkills}
                  onChange={(e) =>
                    setAssignForm((f) => ({
                      ...f,
                      requiredSkills: e.target.value,
                    }))
                  }
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <PhotoCaptureInput
          label="Attachments"
          description="Optional — upload a file or take a photo"
          multiple
          value={assignFiles}
          onChange={setAssignFiles}
          accept="image/*,application/pdf"
        />

        <Button mt="lg" color="#9c6238" loading={saving} onClick={handleCreate}>
          Create Assignment
        </Button>
      </Paper>

      <Text fw={700} className={classes.sectionTitle}>
        Current assignments
      </Text>
      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Stack gap="sm">
          {assignments.map((a) => {
            const artisanMessages =
              a.priceMessages?.filter((m) => m.role === "artisan") || [];
            const hasNegotiation = artisanMessages.length > 0;

            return (
              <Paper
                key={a._id}
                withBorder
                radius="md"
                p="md"
                style={
                  a.priority === "Urgent"
                    ? { backgroundColor: "#fff1f0", borderColor: "#ffa39e" }
                    : undefined
                }
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={700}>
                      {a.product?.name || "Product"}{" "}
                      <Text span c="dimmed" fw={500} size="sm">
                        {a.assignmentNumber}
                      </Text>
                    </Text>
                    <Text size="sm">
                      Assign to Artisan: {a.user?.name} ({a.user?.email})
                    </Text>
                    <Text size="sm" c="dimmed">
                      {a.assignmentType} · Qty {a.quantity} · {a.priority}{" "}
                      priority
                      {a.dueDate
                        ? ` · Due ${new Date(a.dueDate).toLocaleString()}`
                        : ""}
                    </Text>
                    <Text size="sm" fw={600}>
                      Offered pay: {formatPay(a.offeredPay)}
                    </Text>
                    {a.location && (
                      <Text size="sm" c="dimmed">
                        Location: {a.location}
                      </Text>
                    )}
                    {a.status === "Rejected" && a.rejectionReason && (
                      <Text size="sm" c="red">
                        Rejected: {a.rejectionReason}
                      </Text>
                    )}
                    {hasNegotiation && a.status === "Assigned" && (
                      <Stack gap={6} mt="xs">
                        <Text size="sm" fw={600}>
                          Price discussion
                        </Text>
                        {a.priceMessages.slice(-4).map((msg) => (
                          <Paper
                            key={msg._id || msg.createdAt}
                            withBorder
                            p="xs"
                            radius="sm"
                            bg={msg.role === "artisan" ? "orange.0" : "gray.0"}
                          >
                            <Text size="xs" c="dimmed">
                              {msg.role === "artisan" ? "Artisan" : "You"}
                              {msg.proposedPay != null
                                ? ` · ${formatPay(msg.proposedPay)}`
                                : ""}
                              {msg.createdAt
                                ? ` · ${new Date(msg.createdAt).toLocaleString()}`
                                : ""}
                            </Text>
                            <Text size="sm">{msg.message}</Text>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                  <Group>
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>
                    {a.status === "Assigned" && (
                      <Button
                        size="xs"
                        variant="light"
                        color="#9c6238"
                        onClick={() => openReply(a)}
                      >
                        {hasNegotiation ? "Reply on pay" : "Update pay"}
                      </Button>
                    )}
                    {a.status === "In Transit" && (
                      <Button
                        size="xs"
                        color="violet"
                        onClick={() => handleConfirmDelivery(a._id)}
                      >
                        Confirm product received
                      </Button>
                    )}
                    {["Accepted", "In Progress", "In Transit", "Completed"].includes(
                      a.status,
                    ) && (
                      <>
                        <Button
                          size="xs"
                          variant="light"
                          color="#9c6238"
                          onClick={() => openPay(a, "advance")}
                        >
                          Send advance
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          color="#9c6238"
                          onClick={() => openPay(a, "final")}
                        >
                          Send final pay
                        </Button>
                      </>
                    )}
                    {a.status !== "Cancelled" &&
                      a.status !== "Completed" &&
                      a.status !== "Rejected" &&
                      a.status !== "In Transit" && (
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => handleCancel(a._id)}
                        >
                          Cancel
                        </Button>
                      )}
                  </Group>
                </Group>
              </Paper>
            );
          })}
          {assignments.length === 0 && (
            <Text size="sm" c="dimmed">
              No assignments yet.
            </Text>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={replyOpen}
        onClose={() => setReplyOpen(false)}
        title="Respond on pay"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Current offered pay: {formatPay(replyTarget?.offeredPay)}. Update
            the amount if needed and send a note to the artisan.
          </Text>
          <NumberInput
            label="Updated offered pay (₹)"
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={replyPay}
            onChange={(v) =>
              setReplyPay(v === "" || v === null ? null : Number(v))
            }
          />
          <Textarea
            label="Message to artisan"
            withAsterisk
            minRows={3}
            placeholder="Explain the updated offer or confirm the current amount"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            required
          />
          <Button
            color="#9c6238"
            loading={replySaving}
            onClick={handlePriceReply}
          >
            Send reply
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={payOpen}
        onClose={() => setPayOpen(false)}
        title={
          payType === "final" ? "Send final payment" : "Send advance payment"
        }
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {payTarget?.assignmentNumber} · {payTarget?.user?.name}. Offered pay{" "}
            {formatPay(payTarget?.offeredPay)}. Status becomes Awaiting
            Confirmation until the artisan confirms receipt.
          </Text>
          <NumberInput
            label="Amount (₹)"
            withAsterisk
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={payAmount}
            onChange={(v) =>
              setPayAmount(v === "" || v === null ? null : Number(v))
            }
          />
          <Textarea
            label="Note"
            minRows={2}
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
          />
          <Button color="#9c6238" loading={paySaving} onClick={handleSendPayment}>
            Mark as sent
          </Button>
        </Stack>
      </Modal>
    </div>
  );
};
