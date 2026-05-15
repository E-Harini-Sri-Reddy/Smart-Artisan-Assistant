import React, { useEffect, useState } from "react";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconPackage,
  IconCurrencyRupee,
  IconChartBar,
  IconHammer,
} from "@tabler/icons-react";

import {
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  Select,
} from "@mantine/core";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import API from "../api/axios";
import classes from "./HomePage.module.css";

const COLORS = ["#4b3621", "#8b5e3c", "#c4a484", "#e6d3c3"];

export const HomePage = () => {
  const [filter, setFilter] = useState("This Month");
  const [summary, setSummary] = useState(null);

  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get("/production/dashboard/summary");
      setSummary(data);
      setWeeklyData(data.weeklyData || []);
      setMonthlyData(data.monthlyData || []);
      setYearlyData(data.yearlyData || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  const chartData =
    filter === "This Week"
      ? weeklyData
      : filter === "This Month"
        ? monthlyData
        : yearlyData;

  const statsData = [
    {
      title: "Total Production Items",
      value: summary?.totalItems || 0,
      diff: 12,
      icon: IconPackage,
    },
    {
      title: "Total Costs",
      value: `₹${summary?.totalCost || 0}`,
      diff: 18,
      icon: IconCurrencyRupee,
    },
    {
      title: "Total Revenue",
      value: `₹${summary?.totalRevenue || 0}`,
      diff: 10,
      icon: IconCurrencyRupee,
    },
    {
      title: "Net Profit",
      value: `₹${summary?.actualProfit || 0}`,
      diff: summary?.actualProfit >= 0 ? 5 : -5,
      icon: IconChartBar,
    },
  ];

  const stats = statsData.map((stat) => {
    const DiffIcon = stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight;
    const StatIcon = stat.icon;

    return (
      <Paper
        withBorder
        p="md"
        radius="lg"
        key={stat.title}
        className={classes.card}
      >
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text c="dimmed" tt="uppercase" fw={700} fz="10px">
              {stat.title}
            </Text>
            <Text fw={700} fz="22px" mt={3}>
              {stat.value}
            </Text>
          </div>
          <ThemeIcon
            size={40}
            radius="xl"
            variant="light"
            color={stat.diff > 0 ? "teal" : "red"}
            style={{ flexShrink: 0 }}
          >
            <StatIcon size={22} stroke={1.8} />
          </ThemeIcon>
        </Group>

        <Group mt="sm" gap={6}>
          <DiffIcon size={16} color={stat.diff > 0 ? "teal" : "red"} />
          <Text c={stat.diff > 0 ? "teal" : "red"} fw={700} size="sm">
            {stat.diff}%
          </Text>
          <Text c="dimmed" size="sm">
            from last month
          </Text>
        </Group>
      </Paper>
    );
  });

  return (
    <div className={classes.page}>
      <Title order={2} mb="lg">
        Dashboard Overview
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {stats}
      </SimpleGrid>

      <div className={classes.chartsContainer}>
        {/* REVENUE LINE CHART */}
        <Paper withBorder radius="lg" p="lg" className={classes.chartCard}>
          <Group justify="space-between" mb="lg">
            <Title order={4}>Revenue Trend</Title>
            <Select
              value={filter}
              onChange={(val) => setFilter(val)}
              data={["This Week", "This Month", "This Year"]}
              w={140}
            />
          </Group>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#4b3621"
                strokeWidth={3}
                dot={{ r: 4, fill: "#4b3621" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* PIE CHART */}
        <Paper withBorder radius="lg" p="lg" className={classes.chartCard}>
          <Title order={4} mb="lg">
            Category Distribution
          </Title>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={summary?.pieData || []}
                  dataKey="value"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                >
                  {(summary?.pieData || []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <Text fw={700} size="24px">
                {summary?.totalItems || 0}
              </Text>
              <Text c="dimmed" size="xs">
                Items
              </Text>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};
