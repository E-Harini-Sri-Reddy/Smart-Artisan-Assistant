import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Tabs, Badge, Text, Paper, ActionIcon, Group, 
  Title, Modal, NumberInput, Button, Stack, Switch, TextInput, Divider, LoadingOverlay, Box
} from "@mantine/core";
import { 
  IconArrowLeft, IconCheck, IconClock, IconEdit, IconPlus, IconSearch, IconPhone 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";

// Connected directly to your local Node/Express + MongoDB backend
const API_BASE_URL = "http://localhost:5000/api/orders";

export function MoneyFlow() {
  const navigate = useNavigate();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  
  // App states
  const [orders, setOrders] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Safely extract the logged-in artisan's MongoDB ID
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const artisanId = userInfo?.user?._id || userInfo?.id || "anonymous_artisan";

  // Form State: Add New Order
  const [newOrder, setNewOrder] = useState({
    name: "",
    contact: "",
    product: "",
    pending: 0,
    delivered: false
  });

  // Form State: Editing Order
  const [editingOrder, setEditingOrder] = useState(null);

  // FETCH: Get user-scoped orders from MongoDB
  const fetchOrdersFromDb = useCallback(async () => {
    try {
      setGlobalLoading(true);
      const response = await axios.get(API_BASE_URL, {
        params: { artisanId }
      });
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Database connection failure:", error);
    } finally {
      setGlobalLoading(false);
    }
  }, [artisanId]);

  // Hook lifecycle mount
  useEffect(() => {
    fetchOrdersFromDb();
  }, [fetchOrdersFromDb]);

  // POST: Add a new order record directly to MongoDB
  const handleSaveNewOrder = async () => {
    if (!newOrder.name || !newOrder.product) {
      alert("Please enter Name and Product");
      return;
    }

    const payload = {
      artisanId,
      name: newOrder.name,
      contact: newOrder.contact || "No Contact",
      product: newOrder.product,
      pending: newOrder.delivered ? 0 : newOrder.pending,
      delivered: newOrder.delivered ? "Yes" : "No"
    };

    try {
      setGlobalLoading(true);
      const response = await axios.post(API_BASE_URL, payload);
      
      // MongoDB natively returns the newly written document object containing its generated _id
      const savedItem = response.data;
      setOrders([savedItem, ...orders]);
      
      setNewOrder({ name: "", contact: "", product: "", pending: 0, delivered: false });
      closeAdd();
    } catch (error) {
      alert("Failed to write record to MongoDB. Ensure your local server port 5000 is running!");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Open edit modal and bind contextual states
  const handleStartEdit = (item) => {
    setEditingOrder({
      ...item,
      delivered: item.delivered === "Yes"
    });
    openEdit();
  };

  // PUT: Update an existing document row by its strict MongoDB _id string reference
  const handleSaveEditOrder = async () => {
    if (!editingOrder) return;

    const isNowDelivered = editingOrder.delivered;
    const targetId = editingOrder._id; // Essential fix: uses the true database field key

    const updatePayload = {
      pending: isNowDelivered ? 0 : editingOrder.pending,
      delivered: isNowDelivered ? "Yes" : "No"
    };

    try {
      setGlobalLoading(true);
      await axios.put(`${API_BASE_URL}/${targetId}`, updatePayload);

      // Instantly synchronize the frontend array to mirror back-end values cleanly
      setOrders(orders.map(order => {
        if (order._id === targetId) {
          return {
            ...order,
            pending: updatePayload.pending,
            delivered: updatePayload.delivered
          };
        }
        return order;
      }));

      closeEdit();
      setEditingOrder(null);
    } catch (error) {
      alert("Failed to update this record on the Express server.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // UI Filtering logic
  const filtered = orders.filter(o => 
    (o.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (o.product || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeOrders = filtered.filter(o => o.delivered === "No");
  const satisfiedOrders = filtered.filter(o => o.delivered === "Yes");

  const OrderCard = ({ item }) => (
    <Paper withBorder p="md" radius="md" shadow="xs" mb="sm">
      <Group justify="space-between" mb="xs">
        <Stack gap={0}>
          <Text fw={700} size="lg">{item.name}</Text>
          <Group gap={4} c="dimmed">
            <IconPhone size={14} />
            <Text size="xs">{item.contact}</Text>
          </Group>
        </Stack>
        <ActionIcon variant="light" color="orange" onClick={() => handleStartEdit(item)}>
          <IconEdit size={18} />
        </ActionIcon>
      </Group>
      <Divider my="sm" variant="dashed" />
      <Group justify="space-between">
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Product</Text>
          <Text size="sm" fw={500}>{item.product}</Text>
        </Stack>
        <Stack gap={0} align="flex-end">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pending</Text>
          <Text c={item.pending > 0 ? "red" : "green"} fw={800}>₹{item.pending}</Text>
        </Stack>
      </Group>
      <Badge fullWidth mt="md" size="lg" radius="sm" color={item.delivered === "Yes" ? "green" : "orange"} variant="light">
        {item.delivered === "Yes" ? "Delivered" : "Delivery Pending"}
      </Badge>
    </Paper>
  );

  return (
    <Box style={{ position: "relative" }}>
      <LoadingOverlay visible={globalLoading} overlayProps={{ radius: "sm", blur: 1 }} loaderProps={{ color: "orange", type: "bars" }} />
      
      <Container size="sm" py="md">
        {/* ADD ORDER MODAL */}
        <Modal opened={addOpened} onClose={closeAdd} title="New Order Entry" centered radius="lg">
          <Stack>
            <TextInput 
              label="Customer Name" 
              placeholder="e.g. Pranav" 
              value={newOrder.name}
              onChange={(e) => setNewOrder({...newOrder, name: e.target.value})}
              required
            />
            <TextInput 
              label="Contact Number" 
              placeholder="10 digit phone number" 
              value={newOrder.contact}
              onChange={(e) => setNewOrder({...newOrder, contact: e.target.value})}
            />
            <TextInput 
              label="Product Name" 
              placeholder="e.g. 3 Clay Pots" 
              value={newOrder.product}
              onChange={(e) => setNewOrder({...newOrder, product: e.target.value})}
              required
            />
            <NumberInput 
              label="Amount Pending (₹)" 
              value={newOrder.pending}
              onChange={(val) => setNewOrder({...newOrder, pending: val || 0})}
              min={0}
              disabled={newOrder.delivered}
            />
            <Group justify="space-between" mt="sm">
              <Text size="sm" fw={500}>Mark as Delivered?</Text>
              <Switch 
                checked={newOrder.delivered}
                onChange={(e) => setNewOrder({...newOrder, delivered: e.currentTarget.checked})}
                color="green"
              />
            </Group>
            <Button fullWidth color="orange" size="md" radius="md" mt="md" onClick={handleSaveNewOrder}>
              Save Order
            </Button>
          </Stack>
        </Modal>

        {/* EDIT ORDER STATUS MODAL */}
        <Modal opened={editOpened} onClose={closeEdit} title="Update Order Status" centered radius="lg">
          {editingOrder && (
            <Stack>
              <Paper p="xs" bg="var(--mantine-color-gray-0)" radius="md" withBorder>
                <Text size="sm" fw={700}>{editingOrder.name}</Text>
                <Text size="xs" c="dimmed">Product: {editingOrder.product}</Text>
              </Paper>

              <NumberInput 
                label="Pending Amount (₹)" 
                value={editingOrder.delivered ? 0 : editingOrder.pending}
                onChange={(val) => setEditingOrder({...editingOrder, pending: val || 0})}
                min={0}
                disabled={editingOrder.delivered}
              />

              <Group justify="space-between" mt="sm">
                <Text size="sm" fw={500}>Delivery Status</Text>
                <Switch 
                  label={editingOrder.delivered ? "Delivered" : "Delivery Pending"}
                  checked={editingOrder.delivered}
                  onChange={(e) => setEditingOrder({...editingOrder, delivered: e.currentTarget.checked})}
                  color="green"
                />
              </Group>

              <Button fullWidth color="orange" size="md" radius="md" mt="md" onClick={handleSaveEditOrder}>
                Update Order
              </Button>
            </Stack>
          )}
        </Modal>

        {/* PAGE HEADER */}
        <Group justify="space-between" mb="lg" wrap="nowrap">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray">
              <IconArrowLeft size={22} />
            </ActionIcon>
            <Title order={4}>Money Flow</Title>
          </Group>
          <Button 
            size="xs" 
            leftSection={<IconPlus size={16} />} 
            color="orange" 
            radius="xl"
            onClick={openAdd}
          >
            Add Order
          </Button>
        </Group>

        <TextInput
          placeholder="Search customers..."
          mb="lg"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          radius="md"
        />

        <Tabs defaultValue="active" color="orange" variant="pills" radius="xl">
          <Tabs.List grow mb="lg">
            <Tabs.Tab value="active" leftSection={<IconClock size={16} />}>Active</Tabs.Tab>
            <Tabs.Tab value="satisfied" leftSection={<IconCheck size={16} />}>Satisfied</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active">
            {activeOrders.length > 0 ? activeOrders.map(order => <OrderCard key={order._id} item={order} />) : <Text c="dimmed" ta="center" mt="xl">No active orders</Text>}
          </Tabs.Panel>

          <Tabs.Panel value="satisfied">
            {satisfiedOrders.length > 0 ? satisfiedOrders.map(order => <OrderCard key={order._id} item={order} />) : <Text c="dimmed" ta="center" mt="xl">No satisfied orders</Text>}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>
  );
}