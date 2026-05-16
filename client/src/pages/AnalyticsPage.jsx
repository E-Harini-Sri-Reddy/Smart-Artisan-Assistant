import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Title, Text, Paper, Stack, Group, 
  ActionIcon, SimpleGrid, ThemeIcon, Progress, SegmentedControl, Box, LoadingOverlay
} from "@mantine/core";
import { 
  IconArrowLeft, IconTrendingUp, IconCash, IconPackage, IconCalendarStats, IconChartBar 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/reports";

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("monthly");
  const [loading, setLoading] = useState(false);
  
  // Data State representing the metrics calculated by MongoDB Aggregations
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    soldCount: 0,
    growth: "+0%",
    progress: 0,
    topProducts: []
  });

  // Extract logged-in artisan context
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const artisanId = userInfo?.user?._id || userInfo?.id || "anonymous_artisan";

  // Fetch performance report from server
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/insights`, {
        params: { artisanId, timeframe }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error connecting to insights server:", error);
    } finally {
      setLoading(false);
    }
  }, [artisanId, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Color generator utility for progress bar variants
  const getProductColor = (index) => {
    const colors = ["orange", "cyan", "grape", "teal", "indigo"];
    return colors[index % colors.length];
  };

  return (
    <Box style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 1 }} loaderProps={{ color: "orange", type: "bars" }} />

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
              <Text size="xl" fw={900}>₹{analytics.revenue.toLocaleString("en-IN")}</Text>
            </Paper>

            <Paper withBorder p="md" radius="lg" shadow="xs">
              <Group justify="space-between" mb="xs">
                <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                  <IconPackage size={20} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="green">{analytics.growth}</Text>
              </Group>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Sold</Text>
              <Text size="xl" fw={900}>{analytics.soldCount} units</Text>
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
                <Text size="sm" fw={700} c="orange">{analytics.progress}%</Text>
              </Group>
              <Progress 
                value={analytics.progress} 
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
              {analytics.topProducts.length > 0 ? (
                analytics.topProducts.map((product, i) => {
                  // Normalize scale threshold against highest selling metric context
                  const highestSales = analytics.topProducts[0]?.sales || 1;
                  const itemPercentage = (product.sales / highestSales) * 100;

                  return (
                    <Stack key={i} gap={4}>
                      <Group justify="space-between">
                        <Text size="sm" fw={600}>{product.name}</Text>
                        <Text size="xs" fw={700} c="dimmed">{product.sales} units</Text>
                      </Group>
                      <Progress 
                        value={itemPercentage} 
                        color={getProductColor(i)} 
                        size="md" 
                        radius="md" 
                      />
                    </Stack>
                  );
                })
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">No product sales found for this interval.</Text>
              )}
            </Stack>
          </Paper>

          {/* AI INSIGHT */}
          <Paper p="md" radius="lg" bg="orange.0" style={{ border: '1px dashed orange' }}>
            <Text size="sm" c="orange.9" fw={600}>
              💡 {timeframe === 'yearly' 
                  ? "Annual trend shows high demand in Q4. Plan your raw material stock by September." 
                  : analytics.revenue > 5000 
                    ? "Your artisan metrics are solid this cycle! Maintain production pace."
                    : "Sales are gathering traction. Consider featuring items on your main storefront."}
            </Text>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}