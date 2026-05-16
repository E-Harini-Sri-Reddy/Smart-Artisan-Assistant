import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Tabs, Text, Paper, ActionIcon, Group, Title, 
  Button, Stack, Progress, Badge, TextInput, NumberInput, Modal, Select, Box, LoadingOverlay, Menu
} from "@mantine/core";
import { 
  IconArrowLeft, IconPlus, IconMinus, IconPackage, IconArchive, IconDotsVertical, IconTrash, IconEdit 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/inventory";

export function InventoryPage() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState("products");
  
  // App States
  const [items, setItems] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // Track if we are editing an item or creating a new one
  const [editingItemId, setEditingItemId] = useState(null);

  // Identity extraction from localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const artisanId = userInfo?.user?._id || userInfo?.id || "anonymous_artisan";

  // Form State for creating/editing an item
  const [itemForm, setItemForm] = useState({
    name: "",
    itemType: "product",
    stock: 0,
    maxStock: 50,
    unit: "pcs",
    price: 0
  });

  // GET: Load artisan inventory documents
  const fetchInventory = useCallback(async () => {
    try {
      setGlobalLoading(true);
      const response = await axios.get(API_BASE_URL, {
        params: { artisanId }
      });
      if (Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (error) {
      console.error("Failed to read inventory:", error);
    } finally {
      setGlobalLoading(false);
    }
  }, [artisanId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // PUT: Adjust stock dynamically using a delta offset (+1 or -1)
  const updateStock = async (id, amount) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, stock: Math.max(0, item.stock + amount) } : item
      )
    );

    try {
      await axios.put(`${API_BASE_URL}/${id}/stock`, { amount });
    } catch (error) {
      console.error("Backend sync rejection:", error);
      alert("Failed to synchronize quantity update to database.");
      fetchInventory();
    }
  };

  // Open modal in creation mode
  const handleOpenCreateModal = () => {
    setEditingItemId(null);
    setItemForm({ name: "", itemType: "product", stock: 0, maxStock: 50, unit: "pcs", price: 0 });
    open();
  };

  // Open modal in edit mode with pre-populated values
  const handleOpenEditModal = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      name: item.name,
      itemType: item.itemType,
      stock: item.stock,
      maxStock: item.maxStock,
      unit: item.unit,
      price: item.price || 0
    });
    open();
  };

  // POST / PUT: Handles submission for both creating and modifying a document
  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return alert("Item name is required!");

    try {
      setGlobalLoading(true);
      if (editingItemId) {
        // PUT: Update complete object attributes
        const response = await axios.put(`${API_BASE_URL}/${editingItemId}`, itemForm);
        setItems((prev) => prev.map((item) => (item._id === editingItemId ? response.data : item)));
      } else {
        // POST: Add new entry
        const payload = { artisanId, ...itemForm };
        const response = await axios.post(API_BASE_URL, payload);
        setItems([response.data, ...items]);
      }
      close();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      alert("Could not commit item adjustments to DB.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // DELETE: Drop item entry permanently from the data collection
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this inventory item?")) return;

    try {
      setGlobalLoading(true);
      await axios.delete(`${API_BASE_URL}/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error dropping inventory document:", error);
      alert("Failed to drop database item record.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const products = items.filter((i) => i.itemType === "product");
  const materials = items.filter((i) => i.itemType === "material");

  const InventoryCard = ({ item }) => {
    const stockPercent = Math.min((item.stock / (item.maxStock || 50)) * 100, 100);

    const getBarColor = (percent) => {
      if (percent < 20) return "red";
      if (percent <= 70) return "yellow";
      return "green";
    };

    const barColor = getBarColor(stockPercent);
    const isMaterial = item.itemType === "material";

    return (
      <Paper withBorder p="md" radius="lg" shadow="xs" mb="sm">
        <Group justify="space-between" mb="xs" style={{ alignItems: "flex-start" }}>
          <Stack gap={0}>
            <Text fw={700} size="md">{item.name}</Text>
            <Text size="xs" c="dimmed">
              {isMaterial ? `Unit: ${item.unit}` : `Price: ₹${item.price}`}
            </Text>
          </Stack>
          
          <Group gap="xs">
            <Badge color={barColor} variant="light" size="lg" radius="sm">
              {item.stock} {item.unit}
            </Badge>
            
            {/* Action Dropdown Menu for Edit and Delete */}
            <Menu shadow="md" width={140} radius="md" position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item 
                  leftSection={<IconEdit size={14} style={{ color: "var(--mantine-color-blue-6)" }} />} 
                  onClick={() => handleOpenEditModal(item)}
                >
                  Edit Item
                </Menu.Item>
                <Menu.Item 
                  color="red" 
                  leftSection={<IconTrash size={14} />} 
                  onClick={() => handleDeleteItem(item._id)}
                >
                  Delete Item
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Stack gap={6} mt="md">
          <Group justify="space-between">
            <Text size="xs" fw={700} c="dimmed">Stock Health</Text>
            <Text size="xs" fw={700} c={barColor}>{Math.round(stockPercent)}%</Text>
          </Group>
          
          <Progress 
            value={stockPercent} 
            color={barColor} 
            size="xl" 
            radius="md" 
            transitionDuration={200}
          />
        </Stack>
        
        <Group mt="lg" justify="center" gap="xl">
          <ActionIcon 
            variant="filled" 
            color="gray" 
            size="xl" 
            radius="xl" 
            onClick={() => updateStock(item._id, -1)}
          >
            <IconMinus size={20} />
          </ActionIcon>

          <Text fw={800} size="xl" style={{ minWidth: "40px", textAlign: "center" }}>
            {item.stock}
          </Text>

          <ActionIcon 
            variant="filled" 
            color="orange" 
            size="xl" 
            radius="xl" 
            onClick={() => updateStock(item._id, 1)}
          >
            <IconPlus size={20} />
          </ActionIcon>
        </Group>
      </Paper>
    );
  };

  return (
    <Box style={{ position: "relative" }}>
      <LoadingOverlay visible={globalLoading} overlayProps={{ radius: "sm", blur: 1 }} loaderProps={{ color: "orange", type: "bars" }} />

      <Container size="sm" py="md">
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray">
              <IconArrowLeft size={22} />
            </ActionIcon>
            <Title order={4}>Inventory Management</Title>
          </Group>
          <Button size="xs" color="orange" radius="md" onClick={handleOpenCreateModal}>
            New Item
          </Button>
        </Group>

        {/* DUAL-PURPOSE MODAL DIALOG (CREATE / EDIT) */}
        <Modal 
          opened={opened} 
          onClose={close} 
          title={editingItemId ? "Modify Item Attributes" : "Add Item Entry"} 
          centered 
          radius="lg"
        >
          <Stack>
            <TextInput 
              label="Item Name" 
              placeholder="e.g. Fine Clay, Terracotta Pot" 
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
            <Select
              label="Item Classification"
              disabled={editingItemId !== null} // Lock type during edit to preserve data integrity
              data={[
                { value: "product", label: "Goods / Finished Product" },
                { value: "material", label: "Raw Material" }
              ]}
              value={itemForm.itemType}
              onChange={(val) => setItemForm({ ...itemForm, itemType: val || "product" })}
            />
            <Group grow>
              <NumberInput 
                label="Current Stock Level" 
                min={0}
                value={itemForm.stock}
                onChange={(val) => setItemForm({ ...itemForm, stock: Number(val) || 0 })}
              />
              <NumberInput 
                label="Maximum Stock Capacity" 
                min={1}
                value={itemForm.maxStock}
                onChange={(val) => setItemForm({ ...itemForm, maxStock: Number(val) || 50 })}
              />
            </Group>
            <Group grow>
              <TextInput 
                label="Measurement Unit" 
                placeholder="pcs, kg, liters"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
              />
              {itemForm.itemType === "product" && (
                <NumberInput 
                  label="Selling Price (₹)" 
                  min={0}
                  value={itemForm.price}
                  onChange={(val) => setItemForm({ ...itemForm, price: Number(val) || 0 })}
                />
              )}
            </Group>
            <Button fullWidth color="orange" mt="md" radius="md" onClick={handleSaveItem}>
              {editingItemId ? "Save Product Changes" : "Save to Database"}
            </Button>
          </Stack>
        </Modal>

        <Tabs value={activeTab} onChange={setActiveTab} color="orange" variant="pills" radius="xl">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="products" leftSection={<IconPackage size={16} />}>Goods</Tabs.Tab>
            <Tabs.Tab value="materials" leftSection={<IconArchive size={16} />}>Materials</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="products">
            {products.length > 0 ? products.map(p => <InventoryCard key={p._id} item={p} />) : <Text c="dimmed" ta="center" mt="xl">No goods registered</Text>}
          </Tabs.Panel>

          <Tabs.Panel value="materials">
            {materials.length > 0 ? materials.map(m => <InventoryCard key={m._id} item={m} />) : <Text c="dimmed" ta="center" mt="xl">No raw materials registered</Text>}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>
  );
}