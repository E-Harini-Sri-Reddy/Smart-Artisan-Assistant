import React, { useState } from "react";
import { 
  Container, Title, Text, Paper, Stack, Group, 
  ActionIcon, SimpleGrid, ThemeIcon, Progress, SegmentedControl, Transition
} from "@mantine/core";
import { 
  IconArrowLeft, IconTrendingUp, IconCash, IconPackage, IconCalendarStats, IconChartBar 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("monthly");

  // Dynamic Data based on Timeframe
  const dataMap = {
    weekly: {
      revenue: "₹8,400",
      sold: "14",
      growth: "+5%",
      progress: 30,
      topProducts: [
        { name: "Clay Pot (L)", sales: 8, color: "orange" },
        { name: "Terracotta Vase", sales: 4, color: "cyan" },
      ]
    },
    monthly: {
      revenue: "₹42,500",
      sold: "84",
      growth: "+15%",
      progress: 65,
      topProducts: [
        { name: "Clay Pot (L)", sales: 45, color: "orange" },
        { name: "Terracotta Vase", sales: 22, color: "cyan" },
        { name: "Painted Diya", sales: 17, color: "grape" },
      ]
    },
    yearly: {
      revenue: "₹5,12,000",
      sold: "920",
      growth: "+22%",
      progress: 85,
      topProducts: [
        { name: "Clay Pot (L)", sales: 410, color: "orange" },
        { name: "Terracotta Vase", sales: 310, color: "cyan" },
        { name: "Painted Diya", sales: 200, color: "grape" },
      ]
    }
  };

  const currentData = dataMap[timeframe];

  return (
    <Container size="xs" py="md">
      {/* HEADER */}
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray">
            <IconArrowLeft size={24} />
          </ActionIcon>
          <Title order={4}>Business Insights</Title>
        </Group>
        <ThemeIcon variant="light" color="orange" radius="xl">
            <IconChartBar size={18} />
        </ThemeIcon>
      </Group>

      {/* TIMEFRAME SELECTOR */}
      <SegmentedControl
        fullWidth
        radius="xl"
        size="sm"
        color="orange"
        value={timeframe}
        onChange={setTimeframe}
        data={[
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly', value: 'yearly' },
        ]}
        mb="xl"
      />

      <Stack gap="md">
        {/* REVENUE & SALES OVERVIEW */}
        <SimpleGrid cols={2}>
          <Paper withBorder p="md" radius="lg" shadow="xs">
            <Group justify="space-between" mb="xs">
              <ThemeIcon color="green" variant="light" size="lg" radius="md">
                <IconCash size={20} />
              </ThemeIcon>
              <IconTrendingUp size={16} color="green" />
            </Group>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Revenue</Text>
            <Text size="xl" fw={900}>{currentData.revenue}</Text>
          </Paper>

          <Paper withBorder p="md" radius="lg" shadow="xs">
            <Group justify="space-between" mb="xs">
              <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                <IconPackage size={20} />
              </ThemeIcon>
              <Text size="xs" fw={700} c="green">{currentData.growth}</Text>
            </Group>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Sold</Text>
            <Text size="xl" fw={900}>{currentData.sold}</Text>
          </Paper>
        </SimpleGrid>

        {/* PERFORMANCE CARD */}
        <Paper withBorder p="lg" radius="lg" shadow="sm">
          <Group mb="md">
            <IconCalendarStats color="orange" size={20} />
            <Text fw={700}>Sales Target Progress</Text>
          </Group>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Target Completion</Text>
              <Text size="sm" fw={700} c="orange">{currentData.progress}%</Text>
            </Group>
            <Progress 
                value={currentData.progress} 
                color="orange" 
                size="xl" 
                radius="xl" 
                striped 
                animated 
            />
          </Stack>
        </Paper>

        {/* TOP PRODUCTS */}
        <Paper withBorder p="lg" radius="lg" shadow="sm">
          <Title order={5} mb="md">Top Products ({timeframe})</Title>
          <Stack gap="xl">
            {currentData.topProducts.map((product, i) => (
              <Stack key={i} gap={4}>
                <Group justify="space-between">
                  <Text size="sm" fw={600}>{product.name}</Text>
                  <Text size="xs" fw={700} c="dimmed">{product.sales} units</Text>
                </Group>
                <Progress 
                  value={(product.sales / (timeframe === 'yearly' ? 500 : 50)) * 100} 
                  color={product.color} 
                  size="md" 
                  radius="md" 
                />
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* AI INSIGHT */}
        <Paper p="md" radius="lg" bg="orange.0" style={{ border: '1px dashed orange' }}>
          <Text size="sm" c="orange.9" fw={600}>
            💡 {timeframe === 'yearly' 
                ? "Annual trend shows high demand in Q4. Plan your raw material stock by September." 
                : "Your conversion rate is up by 5% this week! Keep it up."}
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
}