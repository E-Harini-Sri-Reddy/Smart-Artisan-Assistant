import React, { useEffect, useState } from "react";

import {
  Card,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";

import {
  CalendarDays,
  IndianRupee,
  Package,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import API from "../api/axios";
import classes from "./ReportsPage.module.css";

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("Monthly");
  const [data, setData] = useState(null);

  // hover state for tooltip
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  // chart switching logic
  const chartData =
    reportType === "Weekly"
      ? data?.weeklyData || []
      : reportType === "Monthly"
        ? data?.monthlyData || []
        : data?.yearlyData || [];

  const topProducts = data?.topProducts || [];

  // ✅ FIX: proper scaling reference
  const maxValue = Math.max(...chartData.map((d) => d.value || 0), 1);

  return (
    <div className={classes.page}>
      {/* HEADER */}
      <div className={classes.header}>
        <div>
          <Title order={2}>Reports</Title>
          <Text c="dimmed" mt={4}>
            View insights and grow your business.
          </Text>
        </div>
      </div>

      {/* SEGMENT CONTROL */}
      <SegmentedControl
        mt="xl"
        radius="md"
        color="#9c6238"
        value={reportType}
        onChange={setReportType}
        data={["Weekly", "Monthly", "Yearly"]}
      />

      {/* STATS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mt="xl">
        <Paper withBorder radius="xl" p="lg">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Earnings
              </Text>
              <Title order={2}>₹{data?.totalEarnings || 0}</Title>
            </div>
            <IndianRupee size={22} />
          </Group>
        </Paper>

        <Paper withBorder radius="xl" p="lg">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Production
              </Text>
              <Title order={2}>{data?.totalProduction || 0}</Title>
            </div>
            <Package size={22} />
          </Group>
        </Paper>

        <Paper withBorder radius="xl" p="lg">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Expenses
              </Text>
              <Title order={2}>₹{data?.totalExpenses || 0}</Title>
            </div>
            <ReceiptText size={22} />
          </Group>
        </Paper>

        <Paper withBorder radius="xl" p="lg">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Net Profit
              </Text>
              <Title order={2} c="green">
                ₹{data?.netProfit || 0}
              </Title>
            </div>
            <TrendingUp size={22} />
          </Group>
        </Paper>
      </SimpleGrid>

      {/* CHART + PRODUCTS SIDE BY SIDE */}
      <div className={classes.chartGrid}>
        {/* EARNINGS CHART */}
        <Card withBorder radius="xl" p="lg" className={classes.chartCard}>
          <Title order={4}>Earnings Trend</Title>

          <div className={classes.chartContainer}>
            {chartData.map((item) => (
              <div
                key={item.label}
                className={classes.barWrapper}
                onMouseEnter={() => setHoveredBar(item)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ position: "relative" }}
              >
                {/* Tooltip */}
                {hoveredBar?.label === item.label && (
                  <div className={classes.tooltip}>₹{item.value}</div>
                )}

                {/* BAR */}
                <div
                  className={classes.bar}
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                  }}
                />

                <Text size="xs" mt={6}>
                  {item.label}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        {/* TOP PRODUCTS */}
        <Card withBorder radius="xl" p="lg" className={classes.chartCard}>
          <Title order={4}>Top Products</Title>

          <div className={classes.productList}>
            {topProducts.map((p, i) => (
              <div key={p.name} className={classes.productItem}>
                <Group justify="space-between">
                  <Text>
                    {i + 1}. {p.name}
                  </Text>
                  <Text fw={600}>{p.value}</Text>
                </Group>

                <Progress
                  value={p.progress}
                  color="#9c6238"
                  mt={10}
                  radius="xl"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
