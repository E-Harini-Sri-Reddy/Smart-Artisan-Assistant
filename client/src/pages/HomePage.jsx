import React, { useState } from "react";

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconPackage,
  IconCurrencyRupee,
  IconChartBar,
  IconUsers,
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

import classes from "./HomePage.module.css";

const statsData = [
  {
    title: "Today's Production",
    value: "128 Items",
    diff: 12,
    icon: IconPackage,
  },

  {
    title: "Monthly Earnings",
    value: "₹12,450",
    diff: 18,
    icon: IconCurrencyRupee,
  },

  {
    title: "Profit",
    value: "₹4,240",
    diff: -5,
    icon: IconChartBar,
  },

  {
    title: "New Customers",
    value: "54",
    diff: 21,
    icon: IconUsers,
  },

  {
    title: "Materials Used",
    value: "842 kg",
    diff: 9,
    icon: IconHammer,
  },
];

const weeklyData = [
  { name: "Mon", earnings: 400 },
  { name: "Tue", earnings: 700 },
  { name: "Wed", earnings: 500 },
  { name: "Thu", earnings: 900 },
  { name: "Fri", earnings: 1100 },
  { name: "Sat", earnings: 800 },
  { name: "Sun", earnings: 1200 },
];

const monthlyData = [
  { name: "1", earnings: 200 },
  { name: "2", earnings: 350 },
  { name: "3", earnings: 500 },
  { name: "4", earnings: 420 },
  { name: "5", earnings: 610 },
  { name: "6", earnings: 720 },
  { name: "7", earnings: 830 },
  { name: "8", earnings: 650 },
  { name: "9", earnings: 710 },
  { name: "10", earnings: 800 },
  { name: "11", earnings: 920 },
  { name: "12", earnings: 780 },
  { name: "13", earnings: 990 },
  { name: "14", earnings: 1100 },
  { name: "15", earnings: 950 },
  { name: "16", earnings: 870 },
  { name: "17", earnings: 1020 },
  { name: "18", earnings: 1150 },
  { name: "19", earnings: 980 },
  { name: "20", earnings: 1050 },
  { name: "21", earnings: 1200 },
  { name: "22", earnings: 1350 },
  { name: "23", earnings: 1180 },
  { name: "24", earnings: 1250 },
  { name: "25", earnings: 1400 },
  { name: "26", earnings: 1320 },
  { name: "27", earnings: 1500 },
  { name: "28", earnings: 1450 },
  { name: "29", earnings: 1380 },
  { name: "30", earnings: 1550 },
];

const yearlyData = [
  { name: "Jan", earnings: 4000 },
  { name: "Feb", earnings: 5200 },
  { name: "Mar", earnings: 6100 },
  { name: "Apr", earnings: 5800 },
  { name: "May", earnings: 7200 },
  { name: "Jun", earnings: 8300 },
  { name: "Jul", earnings: 9100 },
  { name: "Aug", earnings: 8700 },
  { name: "Sep", earnings: 9500 },
  { name: "Oct", earnings: 10200 },
  { name: "Nov", earnings: 11100 },
  { name: "Dec", earnings: 12400 },
];

const pieData = [
  { name: "Pottery", value: 240 },
  { name: "Home Decor", value: 100 },
  { name: "Figurines", value: 120 },
  { name: "Others", value: 60 },
];

const COLORS = ["#4b3621", "#8b5e3c", "#c4a484", "#e6d3c3"];

export const HomePage = () => {
  const [filter, setFilter] = useState("This Week");
  const earningsData =
    filter === "This Week"
      ? weeklyData
      : filter === "This Month"
        ? monthlyData
        : yearlyData;

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
        <Group justify="space-between">
          <div>
            <Text
              c="dimmed"
              tt="uppercase"
              fw={700}
              fz="10px"
              className={classes.label}
            >
              {stat.title}
            </Text>

            <Text fw={700} fz="24px" mt={3}>
              {stat.value}
            </Text>
          </div>

          <ThemeIcon
            size={44}
            radius="xl"
            variant="light"
            color={stat.diff > 0 ? "teal" : "red"}
          >
            <StatIcon size={24} stroke={1.8} />
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
        Hello, {JSON.parse(localStorage.getItem("userInfo"))?.name || "User"} 👋
      </Title>

      {/* STATS */}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
        {stats}
      </SimpleGrid>

      {/* CHARTS */}

      <div className={classes.chartsContainer}>
        {/* LINE CHART */}

        <Paper withBorder radius="lg" p="lg" className={classes.chartCard}>
          <Group justify="space-between" mb="lg">
            <Title order={4}>Earnings Overview</Title>

            <Select
              value={filter}
              onChange={setFilter}
              data={["This Week", "This Month", "This Year"]}
              w={140}
            />
          </Group>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#4b3621"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* PIE CHART */}

        <Paper withBorder radius="lg" p="lg" className={classes.chartCard}>
          <Title order={4} mb="lg">
            Production by Category
          </Title>

          <div className={classes.pieWrapper}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={85}
                  outerRadius={120}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className={classes.centerText}>
              <Text fw={700} size="28px">
                600
              </Text>

              <Text c="dimmed" size="sm">
                Total Items
              </Text>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};
