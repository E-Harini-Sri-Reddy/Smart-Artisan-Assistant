import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Container,
  Group,
  LoadingOverlay,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconClipboardList } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

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

const formatPay = (amount) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return null;
  }
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const priorityRank = (priority) => {
  if (priority === "Urgent") return 0;
  if (priority === "High") return 1;
  if (priority === "Medium") return 2;
  return 3;
};

const sortAssignments = (list) =>
  [...list].sort((a, b) => {
    const p = priorityRank(a.priority) - priorityRank(b.priority);
    if (p !== 0) return p;
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDue - bDue;
  });

function AssignmentCard({ assignment, onOpen }) {
  const isUrgent = assignment.priority === "Urgent";

  return (
    <Paper
      withBorder
      radius="lg"
      p="lg"
      style={{
        cursor: "pointer",
        backgroundColor: isUrgent ? "#fff1f0" : undefined,
        borderColor: isUrgent ? "#ffa39e" : undefined,
      }}
      onClick={() => onOpen(assignment._id)}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={700}>{assignment.product?.name || "Assignment"}</Text>
            {isUrgent && (
              <Badge color="red" variant="filled" size="sm">
                Urgent
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {assignment.assignmentNumber} · {assignment.assignmentType}
          </Text>
        </Stack>
        <Badge color={statusColor(assignment.status)}>
          {assignment.status}
        </Badge>
      </Group>
      {formatPay(assignment.offeredPay) && (
        <Text size="sm" fw={600}>
          Pay {formatPay(assignment.offeredPay)}
        </Text>
      )}
      {assignment.dueDate && (
        <Text size="sm" c="dimmed">
          Due {new Date(assignment.dueDate).toLocaleString()}
        </Text>
      )}
      {assignment.location && (
        <Text size="sm" c="dimmed">
          {assignment.location}
        </Text>
      )}
    </Paper>
  );
}

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/products/assignments/mine");
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeList = useMemo(() => {
    const active = assignments.filter((a) =>
      ["Assigned", "Accepted", "In Progress", "In Transit"].includes(a.status),
    );
    const filtered =
      statusFilter === "all"
        ? active
        : active.filter((a) => a.status === statusFilter);
    return sortAssignments(filtered);
  }, [assignments, statusFilter]);

  const completedList = useMemo(
    () =>
      sortAssignments(
        assignments.filter((a) =>
          ["Completed", "Rejected"].includes(a.status),
        ),
      ),
    [assignments],
  );

  const openAssignment = (id) => navigate(`/assignments/${id}`);

  const emptyState = (message) => (
    <Paper withBorder radius="lg" p="xl">
      <Stack align="center" gap="sm">
        <IconClipboardList size={36} color="#9c6238" />
        <Text fw={600}>{message}</Text>
        <Text size="sm" c="dimmed" ta="center">
          When your organization assigns work to you, it will show up here.
        </Text>
      </Stack>
    </Paper>
  );

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
          <Title order={3}>My Assignments</Title>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} color="#9c6238">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="completed">Completed</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active">
            <SegmentedControl
              fullWidth
              mb="md"
              color="#9c6238"
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { label: "All", value: "all" },
                { label: "Assigned", value: "Assigned" },
                { label: "Accepted", value: "Accepted" },
                { label: "In Progress", value: "In Progress" },
                { label: "In Transit", value: "In Transit" },
              ]}
            />
            <Stack gap="md">
              {activeList.map((a) => (
                <AssignmentCard
                  key={a._id}
                  assignment={a}
                  onOpen={openAssignment}
                />
              ))}
              {!loading && activeList.length === 0 && emptyState("No active assignments")}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="completed">
            <Stack gap="md">
              {completedList.map((a) => (
                <AssignmentCard
                  key={a._id}
                  assignment={a}
                  onOpen={openAssignment}
                />
              ))}
              {!loading &&
                completedList.length === 0 &&
                emptyState("No completed assignments")}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>
  );
}
