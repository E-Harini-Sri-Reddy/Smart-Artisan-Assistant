import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  List,
  LoadingOverlay,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Anchor,
} from "@mantine/core";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import { PhotoCaptureInput } from "../components/PhotoCaptureInput";

const statusColor = (status) => {
  switch (status) {
    case "Completed":
      return "green";
    case "In Progress":
      return "blue";
    case "Accepted":
      return "cyan";
    case "Assigned":
      return "orange";
    case "In Transit":
      return "violet";
    case "Rejected":
      return "red";
    default:
      return "gray";
  }
};

const paymentStatusColor = (status) => {
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

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const formatPay = (amount) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return "—";
  }
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [negotiateMessage, setNegotiateMessage] = useState("");
  const [proposedPay, setProposedPay] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState({
    advance: 0,
    finalPay: 0,
    total: 0,
  });
  const [remaining, setRemaining] = useState(0);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(null);
  const [advanceNote, setAdvanceNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data }, payRes] = await Promise.all([
        API.get(`/products/assignments/${id}`),
        API.get(`/products/assignments/${id}/payments`).catch(() => ({
          data: null,
        })),
      ]);
      setAssignment(data);
      if (payRes?.data) {
        setPayments(payRes.data.payments || []);
        setPaymentTotals(
          payRes.data.totals || { advance: 0, finalPay: 0, total: 0 },
        );
        setRemaining(payRes.data.remaining ?? 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Assignment not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (fn) => {
    try {
      setActionLoading(true);
      setError("");
      await fn();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!startDate || !estimatedCompletionDate) {
      setError("Start date and estimated completion date are required");
      return;
    }
    if (new Date(estimatedCompletionDate) < new Date(startDate)) {
      setError("Estimated completion must be on or after the start date");
      return;
    }

    await runAction(async () => {
      await API.post(`/products/assignments/${id}/accept`, {
        startDate,
        estimatedCompletionDate,
      });
      setAcceptOpen(false);
      setStartDate("");
      setEstimatedCompletionDate("");
    });
  };

  const handleNegotiate = async () => {
    if (!negotiateMessage.trim()) {
      setError("Please write a note to the admin about the pay");
      return;
    }
    await runAction(async () => {
      await API.post(`/products/assignments/${id}/negotiate`, {
        message: negotiateMessage.trim(),
        proposedPay:
          proposedPay === null || proposedPay === undefined || proposedPay === ""
            ? undefined
            : proposedPay,
      });
      setNegotiateOpen(false);
      setNegotiateMessage("");
      setProposedPay(null);
    });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejecting this assignment");
      return;
    }
    await runAction(async () => {
      await API.post(`/products/assignments/${id}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectOpen(false);
      setRejectReason("");
    });
  };

  const handleStart = () =>
    runAction(() => API.post(`/products/assignments/${id}/start`));

  const handleRequestAdvance = async () => {
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      setError("Enter a valid advance amount");
      return;
    }
    await runAction(async () => {
      await API.post(`/products/assignments/${id}/request-advance`, {
        amount: advanceAmount,
        note: advanceNote,
      });
      setAdvanceOpen(false);
      setAdvanceAmount(null);
      setAdvanceNote("");
    });
  };

  const handleConfirmPayment = (paymentId) =>
    runAction(() =>
      API.post(`/products/assignments/payments/${paymentId}/confirm`),
    );

  const handleComplete = async () => {
    if (!completionNotes.trim()) {
      setError("Completion notes are required");
      return;
    }
    if (!photos?.length) {
      setError("Please upload at least one photo");
      return;
    }

    await runAction(async () => {
      const formData = new FormData();
      formData.append("completionNotes", completionNotes);
      formData.append("materialsUsed", materialsUsed);
      formData.append("hours", String(hours || 0));
      formData.append("minutes", String(minutes || 0));
      photos.forEach((file) => formData.append("photos", file));
      await API.post(`/products/assignments/${id}/complete`, formData);
      setCompleteOpen(false);
      setCompletionNotes("");
      setMaterialsUsed("");
      setHours(0);
      setMinutes(0);
      setPhotos([]);
    });
  };

  if (!assignment && !loading) {
    return (
      <Container size="xs" py="xl">
        <Text c="red">{error || "Assignment not found"}</Text>
        <Button mt="md" variant="light" onClick={() => navigate("/assignments")}>
          Back
        </Button>
      </Container>
    );
  }

  return (
    <Box style={{ position: "relative" }}>
      <LoadingOverlay visible={loading || actionLoading} />
      <Container size="xs" py="xl">
        <Group mb="lg">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => navigate("/assignments")}
          >
            <IconArrowLeft size={24} />
          </ActionIcon>
          <Title order={3}>Assignment Detail</Title>
        </Group>

        {assignment && (
          <Stack gap="md">
            <Paper withBorder radius="lg" p="lg">
              <Group justify="space-between" align="flex-start" mb="sm">
                <Stack gap={4}>
                  <Title order={3}>{assignment.product?.name}</Title>
                  <Text size="sm" c="dimmed">
                    Assignment #{assignment.assignmentNumber}
                  </Text>
                </Stack>
                <Badge size="lg" color={statusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
              </Group>

              <Stack gap="xs" mt="md">
                <Text size="sm">
                  <Text span fw={600}>
                    Product{" "}
                  </Text>
                  {assignment.product?.name}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Assignment{" "}
                  </Text>
                  {assignment.assignmentType}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Priority{" "}
                  </Text>
                  {assignment.priority}
                  {assignment.quantity > 1 ? ` · Qty ${assignment.quantity}` : ""}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Pay offered{" "}
                  </Text>
                  {formatPay(assignment.offeredPay)}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Due date{" "}
                  </Text>
                  {formatDateTime(assignment.dueDate)}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Start date{" "}
                  </Text>
                  {formatDateTime(assignment.startDate)}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Estimated completion{" "}
                  </Text>
                  {formatDateTime(assignment.estimatedCompletionDate)}
                </Text>
                <Text size="sm">
                  <Text span fw={600}>
                    Location{" "}
                  </Text>
                  {assignment.location || "—"}
                </Text>
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text fw={700} mb="xs">
                Pay discussion
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Review the offered amount. If it feels too low or too high, send
                a note to the admin before accepting.
              </Text>
              <Stack gap="sm">
                {(assignment.priceMessages || []).map((msg) => (
                  <Paper
                    key={msg._id || `${msg.role}-${msg.createdAt}`}
                    withBorder
                    radius="md"
                    p="sm"
                    bg={msg.role === "artisan" ? "orange.0" : "gray.0"}
                  >
                    <Text size="xs" c="dimmed" mb={4}>
                      {msg.role === "artisan" ? "You" : "Admin"}
                      {msg.proposedPay != null
                        ? ` · ${formatPay(msg.proposedPay)}`
                        : ""}
                      {msg.createdAt
                        ? ` · ${formatDateTime(msg.createdAt)}`
                        : ""}
                    </Text>
                    <Text size="sm">{msg.message}</Text>
                  </Paper>
                ))}
                {(assignment.priceMessages || []).length === 0 && (
                  <Text size="sm" c="dimmed">
                    No messages yet.
                  </Text>
                )}
              </Stack>
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text fw={700} mb="xs">
                Instructions
              </Text>
              <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                {assignment.notes || "No special instructions."}
              </Text>

              {assignment.requiredMaterials?.length > 0 && (
                <>
                  <Text fw={700} mt="lg" mb="xs">
                    Required Materials
                  </Text>
                  <List size="sm" spacing={4}>
                    {assignment.requiredMaterials.map((item) => (
                      <List.Item key={item}>{item}</List.Item>
                    ))}
                  </List>
                </>
              )}

              {assignment.requiredSkills?.length > 0 && (
                <>
                  <Text fw={700} mt="lg" mb="xs">
                    Required Skills
                  </Text>
                  <List size="sm" spacing={4}>
                    {assignment.requiredSkills.map((item) => (
                      <List.Item key={item}>{item}</List.Item>
                    ))}
                  </List>
                </>
              )}

              {assignment.attachments?.length > 0 && (
                <>
                  <Text fw={700} mt="lg" mb="xs">
                    Attachments
                  </Text>
                  <Stack gap={6}>
                    {assignment.attachments.map((file) => (
                      <Anchor
                        key={file.url}
                        href={file.url}
                        target="_blank"
                        size="sm"
                      >
                        📎 {file.name}
                      </Anchor>
                    ))}
                  </Stack>
                </>
              )}
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text fw={700} mb="xs">
                Payments
              </Text>
              <Text size="sm" c="dimmed" mb="sm">
                Offer {formatPay(assignment.offeredPay)} · Received{" "}
                {formatPay(paymentTotals.total)} · Remaining{" "}
                {formatPay(remaining)}
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Advance {formatPay(paymentTotals.advance)} · Final{" "}
                {formatPay(paymentTotals.finalPay)}
              </Text>
              <Stack gap="sm" mb="md">
                {payments.map((p) => (
                  <Paper key={p._id} withBorder radius="md" p="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Text size="sm" fw={600}>
                          {p.type === "advance" ? "Advance" : "Final"} ·{" "}
                          {formatPay(p.amount)}
                        </Text>
                        {p.note && (
                          <Text size="xs" c="dimmed">
                            {p.note}
                          </Text>
                        )}
                      </Stack>
                      <Stack gap="xs" align="flex-end">
                        <Badge color={paymentStatusColor(p.status)}>
                          {p.status}
                        </Badge>
                        {p.status === "Awaiting Confirmation" && (
                          <Button
                            size="xs"
                            color="#9c6238"
                            onClick={() => handleConfirmPayment(p._id)}
                          >
                            Confirm received
                          </Button>
                        )}
                      </Stack>
                    </Group>
                  </Paper>
                ))}
                {payments.length === 0 && (
                  <Text size="sm" c="dimmed">
                    No payments yet.
                  </Text>
                )}
              </Stack>
              {["Accepted", "In Progress", "In Transit"].includes(
                assignment.status,
              ) && (
                <Button
                  fullWidth
                  variant="light"
                  color="#9c6238"
                  onClick={() => {
                    setError("");
                    setAdvanceOpen(true);
                  }}
                >
                  Request advance
                </Button>
              )}
            </Paper>

            <Paper withBorder radius="lg" p="lg">
              <Text fw={700} mb="md">
                Assignment status
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Assigned → Accepted → In Progress → In Transit → Completed
              </Text>

              {error && (
                <Text size="sm" c="red" mb="md">
                  {error}
                </Text>
              )}

              {assignment.status === "Assigned" && (
                <Stack gap="sm">
                  <Button
                    fullWidth
                    color="#9c6238"
                    size="md"
                    onClick={() => {
                      setError("");
                      setAcceptOpen(true);
                    }}
                  >
                    Accept Assignment
                  </Button>
                  <Button
                    fullWidth
                    variant="light"
                    color="#9c6238"
                    size="md"
                    onClick={() => {
                      setError("");
                      setProposedPay(assignment.offeredPay ?? null);
                      setNegotiateOpen(true);
                    }}
                  >
                    Discuss pay with admin
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    color="red"
                    size="md"
                    onClick={() => {
                      setError("");
                      setRejectOpen(true);
                    }}
                  >
                    Reject Assignment
                  </Button>
                </Stack>
              )}

              {assignment.status === "Accepted" && (
                <Button
                  fullWidth
                  color="#9c6238"
                  size="md"
                  onClick={handleStart}
                >
                  Start Work
                </Button>
              )}

              {assignment.status === "In Progress" && (
                <Button
                  fullWidth
                  color="#9c6238"
                  size="md"
                  onClick={() => {
                    setError("");
                    setCompleteOpen(true);
                  }}
                >
                  Mark work done (ship / In Transit)
                </Button>
              )}

              {assignment.status === "In Transit" && (
                <Paper radius="md" p="md" bg="violet.0">
                  <Text fw={700} c="violet" mb="xs">
                    In Transit
                  </Text>
                  <Text size="sm">
                    Work finished on {formatDateTime(assignment.completedAt)}.
                    Waiting for the admin to confirm they received the product.
                  </Text>
                  {assignment.completionNotes && (
                    <Text size="sm" mt="sm">
                      {assignment.completionNotes}
                    </Text>
                  )}
                </Paper>
              )}

              {assignment.status === "Rejected" && (
                <Paper radius="md" p="md" bg="red.0">
                  <Text fw={700} c="red" mb="xs">
                    Rejected
                  </Text>
                  <Text size="sm">
                    {assignment.rejectionReason || "No reason provided."}
                  </Text>
                  {assignment.rejectedAt && (
                    <Text size="sm" c="dimmed" mt={4}>
                      {formatDateTime(assignment.rejectedAt)}
                    </Text>
                  )}
                </Paper>
              )}

              {assignment.status === "Completed" && (
                <Paper radius="md" p="md" bg="green.0">
                  <Group gap="xs" mb="xs">
                    <IconCheck color="green" />
                    <Text fw={700} c="green">
                      Completed — product received
                    </Text>
                  </Group>
                  <Text size="sm">
                    Work finished {formatDateTime(assignment.completedAt)}
                  </Text>
                  {assignment.productReceivedAt && (
                    <Text size="sm" c="dimmed" mt={4}>
                      Admin confirmed receipt{" "}
                      {formatDateTime(assignment.productReceivedAt)}
                    </Text>
                  )}
                  {assignment.completionNotes && (
                    <Text size="sm" mt="sm">
                      {assignment.completionNotes}
                    </Text>
                  )}
                  {assignment.timeSpent && (
                    <Text size="sm" c="dimmed" mt={4}>
                      Time spent: {assignment.timeSpent}
                    </Text>
                  )}
                  {assignment.materialsUsed && (
                    <Text size="sm" c="dimmed" mt={4}>
                      Materials used: {assignment.materialsUsed}
                    </Text>
                  )}
                  {assignment.completionPhotos?.length > 0 && (
                    <Stack gap={6} mt="sm">
                      {assignment.completionPhotos.map((file) => (
                        <Anchor
                          key={file.url}
                          href={file.url}
                          target="_blank"
                          size="sm"
                        >
                          📎 {file.name}
                        </Anchor>
                      ))}
                    </Stack>
                  )}
                </Paper>
              )}
            </Paper>
          </Stack>
        )}
      </Container>

      <Modal
        opened={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        title="Accept Assignment"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            You are accepting this work for{" "}
            <Text span fw={700}>
              {formatPay(assignment?.offeredPay)}
            </Text>
            . Provide your planned start and estimated completion dates.
          </Text>
          <TextInput
            label="Start date"
            withAsterisk
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <TextInput
            label="Estimated completion date"
            withAsterisk
            type="datetime-local"
            value={estimatedCompletionDate}
            onChange={(e) => setEstimatedCompletionDate(e.target.value)}
            required
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button color="#9c6238" onClick={handleAccept} loading={actionLoading}>
            Confirm Accept
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        title="Discuss pay"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Current offer: {formatPay(assignment?.offeredPay)}. Send a note to
            the admin if this feels too low or too high. Wait for their reply
            before accepting.
          </Text>
          <NumberInput
            label="Your proposed pay (₹)"
            description="Optional"
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={proposedPay}
            onChange={(v) =>
              setProposedPay(v === "" || v === null ? null : Number(v))
            }
          />
          <Textarea
            label="Message to admin"
            withAsterisk
            minRows={3}
            placeholder="Explain why the amount should change"
            value={negotiateMessage}
            onChange={(e) => setNegotiateMessage(e.target.value)}
            required
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button
            color="#9c6238"
            onClick={handleNegotiate}
            loading={actionLoading}
          >
            Send message
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Assignment"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Tell the admin why you cannot take this assignment.
          </Text>
          <Textarea
            label="Reason"
            withAsterisk
            minRows={3}
            placeholder="e.g. schedule conflict, pay too low, skills mismatch"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button color="red" onClick={handleReject} loading={actionLoading}>
            Confirm Reject
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={advanceOpen}
        onClose={() => setAdvanceOpen(false)}
        title="Request advance"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Request an advance from the admin. It stays Pending until they send
            it, then Awaiting Confirmation until you confirm receipt.
          </Text>
          <NumberInput
            label="Amount (₹)"
            withAsterisk
            min={0}
            decimalScale={2}
            thousandSeparator=","
            prefix="₹ "
            value={advanceAmount}
            onChange={(v) =>
              setAdvanceAmount(v === "" || v === null ? null : Number(v))
            }
          />
          <Textarea
            label="Note"
            minRows={2}
            value={advanceNote}
            onChange={(e) => setAdvanceNote(e.target.value)}
          />
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Button
            color="#9c6238"
            onClick={handleRequestAdvance}
            loading={actionLoading}
          >
            Send request
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Mark work done"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            After you submit, status becomes In Transit until the admin confirms
            they received the product.
          </Text>
          <Textarea
            label="Completion notes"
            description="What was done?"
            required
            minRows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
          <PhotoCaptureInput
            label="Upload photos"
            description="Choose a file or take a photo with your camera"
            required
            multiple
            value={photos}
            onChange={setPhotos}
            accept="image/*"
          />
          <Textarea
            label="Materials used"
            description="Optional"
            minRows={2}
            value={materialsUsed}
            onChange={(e) => setMaterialsUsed(e.target.value)}
          />
          <Group grow>
            <NumberInput
              label="Hours"
              min={0}
              value={hours}
              onChange={(v) => setHours(Number(v) || 0)}
            />
            <NumberInput
              label="Minutes"
              min={0}
              max={59}
              value={minutes}
              onChange={(v) => setMinutes(Number(v) || 0)}
            />
          </Group>
          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}
          <Divider />
          <Button color="#9c6238" onClick={handleComplete} loading={actionLoading}>
            Submit — mark In Transit
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}
