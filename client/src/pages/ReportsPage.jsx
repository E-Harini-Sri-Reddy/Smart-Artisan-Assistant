import React, { useState } from "react";

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

import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";

import classes from "./ReportsPage.module.css";

const topProducts = [
  {
    name: "Clay Water Pot",
    value: "₹18,600",
    progress: 85,
  },

  {
    name: "Flower Vase",
    value: "₹14,800",
    progress: 70,
  },

  {
    name: "Decorative Plate",
    value: "₹12,500",
    progress: 60,
  },

  {
    name: "DIY Planter",
    value: "₹10,200",
    progress: 45,
  },

  {
    name: "Others",
    value: "₹6,350",
    progress: 30,
  },
];

const weeklyData = [
  { label: "May 1-7", value: 45 },
  { label: "May 8-14", value: 65 },
  { label: "May 15-21", value: 80 },
  { label: "May 22-31", value: 95 },
];

const monthlyData = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 55 },
  { label: "Mar", value: 70 },
  { label: "Apr", value: 85 },
  { label: "May", value: 95 },
];

const yearlyData = [
  { label: "2023", value: 30 },
  { label: "2024", value: 50 },
  { label: "2025", value: 75 },
  { label: "2026", value: 100 },
];

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("Monthly");

  const chartData =
    reportType === "Weekly"
      ? weeklyData
      : reportType === "Monthly"
        ? monthlyData
        : yearlyData;

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

        <DatePickerInput
          type="range"
          placeholder="Pick dates range"
          valueFormat="MMM DD, YYYY"
          leftSection={<CalendarDays size={18} />}
          className={classes.datePicker}
        />
      </div>

      {/* FILTER */}

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
        {/* TOTAL EARNINGS */}

        <Paper withBorder radius="xl" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Earnings
              </Text>

              <Title order={2} mt={8}>
                ₹72,450
              </Title>
            </div>

            <div className={classes.iconBox}>
              <IndianRupee size={24} />
            </div>
          </Group>
        </Paper>

        {/* TOTAL PRODUCTION */}

        <Paper withBorder radius="xl" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Production
              </Text>

              <Title order={2} mt={8}>
                312 items
              </Title>
            </div>

            <div className={classes.iconBox}>
              <Package size={24} />
            </div>
          </Group>
        </Paper>

        {/* TOTAL EXPENSES */}

        <Paper withBorder radius="xl" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Expenses
              </Text>

              <Title order={2} mt={8}>
                ₹24,300
              </Title>
            </div>

            <div className={classes.iconBox}>
              <ReceiptText size={24} />
            </div>
          </Group>
        </Paper>

        {/* NET PROFIT */}

        <Paper withBorder radius="xl" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Net Profit
              </Text>

              <Title order={2} mt={8} c="green">
                ₹48,150
              </Title>
            </div>

            <div className={classes.greenIconBox}>
              <TrendingUp size={24} />
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* CHARTS */}

      <div className={classes.chartGrid}>
        {/* EARNINGS TREND */}

        <Card withBorder radius="xl" p="lg" className={classes.chartCard}>
          <Title order={4}>Earnings Trend</Title>

          <div className={classes.chartContainer}>
            {chartData.map((item) => (
              <div key={item.label} className={classes.barWrapper}>
                <div
                  className={classes.bar}
                  style={{
                    height: `${item.value}%`,
                  }}
                />

                <Text size="xs" mt={8}>
                  {item.label}
                </Text>
              </div>
            ))}
          </div>

          <Group justify="center" mt="lg">
            <div className={classes.legendBox} />

            <Text size="sm">Earnings (₹)</Text>
          </Group>
        </Card>

        {/* TOP PRODUCTS */}

        <Card withBorder radius="xl" p="lg" className={classes.chartCard}>
          <Title order={4}>Top Products</Title>

          <div className={classes.productList}>
            {topProducts.map((product, index) => (
              <div key={product.name} className={classes.productItem}>
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Text fw={600}>{index + 1}.</Text>

                    <Text>{product.name}</Text>
                  </Group>

                  <Text fw={600}>{product.value}</Text>
                </Group>

                <Progress
                  value={product.progress}
                  color="#9c6238"
                  size="sm"
                  radius="xl"
                  mt={10}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
