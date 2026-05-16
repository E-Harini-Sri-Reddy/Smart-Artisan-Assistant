import React, { useState } from "react";
import { 
  Container, Tabs, Text, Paper, ActionIcon, Group, Title, 
  Button, Stack, Progress, Badge, TextInput, NumberInput, Modal, Select 
} from "@mantine/core";
import { 
  IconArrowLeft, IconPlus, IconMinus, IconPackage, IconArchive, IconDeviceFloppy 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

export function InventoryPage() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState("products");

  // State for Inventory Data
  const [products, setProducts] = useState([
    { id: 1, name: "Clay Pot (L)", stock: 12, maxStock: 20, unit: "pcs", price: 500 },
    { id: 2, name: "Terracotta Vase", stock: 5, maxStock: 10, unit: "pcs", price: 850 },
  ]);

  const [materials, setMaterials] = useState([
    { id: 1, name: "Fine Clay", stock: 20, maxStock: 100, minStock: 30, unit: "kg" },
    { id: 2, name: "Organic Paint", stock: 8, maxStock: 10, minStock: 2, unit: "liters" },
  ]);

  const updateStock = (id, amount, isMaterial) => {
    const setter = isMaterial ? setMaterials : setProducts;
    setter((prev) => prev.map(item => {
      if (item.id === id) {
        return { ...item, stock: Math.max(0, item.stock + amount) };
      }
      return item;
    }));
  };

  const InventoryCard = ({ item, isMaterial }) => {
    const stockPercent = Math.min((item.stock / (item.maxStock || 50)) * 100, 100);

    // Color logic: <20 Red, 20-70 Yellow, >70 Green
    const getBarColor = (percent) => {
      if (percent < 20) return "red";
      if (percent <= 70) return "yellow";
      return "green";
    };

    const barColor = getBarColor(stockPercent);

    return (
      <Paper withBorder p="md" radius="lg" shadow="xs" mb="sm">
        <Group justify="space-between" mb="xs">
          <Stack gap={0}>
            <Text fw={700} size="md">{item.name}</Text>
            <Text size="xs" c="dimmed">
              {isMaterial ? `Unit: ${item.unit}` : `Price: ₹${item.price}`}
            </Text>
          </Stack>
          <Badge color={barColor} variant="light" size="lg" radius="sm">
            {item.stock} {item.unit}
          </Badge>
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
            onClick={() => updateStock(item.id, -1, isMaterial)}
          >
            <IconMinus size={20} />
          </ActionIcon>

          <Text fw={800} size="xl" style={{ minWidth: '40px', textAlign: 'center' }}>
            {item.stock}
          </Text>

          <ActionIcon 
            variant="filled" 
            color="orange" 
            size="xl" 
            radius="xl" 
            onClick={() => updateStock(item.id, 1, isMaterial)}
          >
            <IconPlus size={20} />
          </ActionIcon>
        </Group>
      </Paper>
    );
  };

  return (
    <Container size="sm" py="md">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray">
            <IconArrowLeft size={22} />
          </ActionIcon>
          <Title order={4}>Inventory</Title>
        </Group>
        <Button size="xs" color="orange" radius="md" onClick={open}>
          New Item
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="orange" variant="pills" radius="xl">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="products" leftSection={<IconPackage size={16} />}>Goods</Tabs.Tab>
          <Tabs.Tab value="materials" leftSection={<IconArchive size={16} />}>Materials</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="products">
          {products.map(p => <InventoryCard key={p.id} item={p} isMaterial={false} />)}
        </Tabs.Panel>

        <Tabs.Panel value="materials">
          {materials.map(m => <InventoryCard key={m.id} item={m} isMaterial={true} />)}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}