import React, { useState } from "react";
import { 
  Container, Tabs, Badge, Text, Paper, ActionIcon, Group, 
  Title, Modal, NumberInput, Button, Stack, Switch, TextInput, Divider 
} from "@mantine/core";
import { 
  IconArrowLeft, IconCheck, IconClock, IconEdit, IconPlus, IconSearch, IconPhone 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

export function MoneyFlow() {
  const navigate = useNavigate();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  
  // State for orders
  const [orders, setOrders] = useState([
    { id: 1, name: "Rahul Sharma", contact: "9876543210", product: "Clay Pot (Large)", pending: 500, delivered: "No" },
    { id: 2, name: "Anjali Devi", contact: "8877665544", product: "Silk Saree", pending: 0, delivered: "Yes" },
  ]);

  // State for the "Add New Order" form
  const [newOrder, setNewOrder] = useState({
    name: "",
    contact: "",
    product: "",
    pending: 0,
    delivered: false
  });

  // State for tracking the order currently being edited
  const [editingOrder, setEditingOrder] = useState(null);

  const [search, setSearch] = useState("");

  // Logic to save a new order
  const handleSaveNewOrder = () => {
    if (!newOrder.name || !newOrder.product) {
      alert("Please enter Name and Product");
      return;
    }
    const createdOrder = {
      id: Date.now(),
      name: newOrder.name,
      contact: newOrder.contact || "No Contact",
      product: newOrder.product,
      // Auto-zero pending balance if created directly as already delivered
      pending: newOrder.delivered ? 0 : newOrder.pending,
      delivered: newOrder.delivered ? "Yes" : "No"
    };
    setOrders([createdOrder, ...orders]);
    
    setNewOrder({ name: "", contact: "", product: "", pending: 0, delivered: false });
    closeAdd();
  };

  // Open edit modal and populate current values
  const handleStartEdit = (item) => {
    setEditingOrder({
      ...item,
      delivered: item.delivered === "Yes"
    });
    openEdit();
  };

  // Save the modified order back to state with structural business logic adjustments
  const handleSaveEditOrder = () => {
    setOrders(orders.map(order => {
      if (order.id === editingOrder.id) {
        const isNowDelivered = editingOrder.delivered;
        return {
          ...order,
          // Force pending to 0 if marked delivered; otherwise, use input value
          pending: isNowDelivered ? 0 : editingOrder.pending,
          delivered: isNowDelivered ? "Yes" : "No"
        };
      }
      return order;
    }));
    closeEdit();
    setEditingOrder(null);
  };

  // Search Filter Logic
  const filtered = orders.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.product.toLowerCase().includes(search.toLowerCase())
  );

  // Tabs split strictly by Delivery Status
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
            disabled={newOrder.delivered} // UI Helper: disables field if switch is on
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
              disabled={editingOrder.delivered} // UI Helper: clarity on zeroing out
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
          {activeOrders.length > 0 ? activeOrders.map(order => <OrderCard key={order.id} item={order} />) : <Text c="dimmed" ta="center" mt="xl">No active orders</Text>}
        </Tabs.Panel>

        <Tabs.Panel value="satisfied">
          {satisfiedOrders.length > 0 ? satisfiedOrders.map(order => <OrderCard key={order.id} item={order} />) : <Text c="dimmed" ta="center" mt="xl">No satisfied orders</Text>}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}