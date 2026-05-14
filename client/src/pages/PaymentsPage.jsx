import React, { useEffect, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Table,
  Text,
  Title,
  Menu,
  Modal,
  TextInput,
  Select,
  Textarea,
  Loader,
  Center,
  ActionIcon,
} from "@mantine/core";

import { DateInput } from "@mantine/dates";

import { useForm } from "@mantine/form";

import "@mantine/dates/styles.css";

import {
  IndianRupee,
  Wallet,
  CreditCard,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import API from "../api/axios";

import classes from "./PaymentsPage.module.css";

export const PaymentsPage = () => {
  const [filter, setFilter] = useState("All");

  const [opened, setOpened] = useState(false);

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [editOpened, setEditOpened] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [editCustomer, setEditCustomer] = useState("");

  const [editProduct, setEditProduct] = useState("");

  const [editAmount, setEditAmount] = useState("");

  const [editStatus, setEditStatus] = useState("");

  const [editDate, setEditDate] = useState(null);

  const [editNotes, setEditNotes] = useState("");

  /* FETCH PAYMENTS */

  const fetchPayments = async () => {
    try {
      const { data } = await API.get("/payments");

      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  /* FORM */

  const form = useForm({
    initialValues: {
      customer: "",
      product: "",
      amount: "",
      status: "",
      date: null,
      notes: "",
    },

    validate: {
      customer: (v) => (v.trim().length ? null : "Customer name is required"),

      product: (v) => (v.trim().length ? null : "Product is required"),

      amount: (v) =>
        v && !isNaN(Number(v)) ? null : "Valid amount is required",

      status: (v) => (v ? null : "Payment status is required"),

      date: (v) => (v ? null : "Payment date is required"),
    },
  });

  /* SAVE PAYMENT */

  const handleSave = async () => {
    const result = form.validate();

    if (result.hasErrors) return;

    try {
      await API.post("/payments", {
        customer: form.values.customer,

        product: form.values.product,

        amount: Number(form.values.amount),

        status: form.values.status,

        paymentDate: form.values.date,

        notes: form.values.notes,
      });

      await fetchPayments();

      setOpened(false);

      form.reset();
    } catch (error) {
      console.error(error);

      alert("Failed to save payment");
    }
  };

  /* DELETE PAYMENT */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this payment?");

    if (!confirmDelete) return;

    try {
      await API.delete(`/payments/${id}`);

      fetchPayments();
    } catch (error) {
      console.error(error);

      alert("Delete failed");
    }
  };

  /* EDIT PAYMENT */

  const handleEditSave = async () => {
    try {
      await API.put(`/payments/${selectedPayment._id}`, {
        customer: editCustomer,
        product: editProduct,
        amount: Number(editAmount),
        status: editStatus,
        paymentDate: editDate,
        notes: editNotes,
      });

      fetchPayments();

      setEditOpened(false);
    } catch (error) {
      console.error(error);

      alert("Update failed");
    }
  };

  /* FILTER */

  const filteredTransactions =
    filter === "All"
      ? transactions
      : transactions.filter((item) => item.status === filter);

  /* STATS */

  const totalRevenue = transactions.reduce(
    (acc, item) => (item.status === "Completed" ? acc + item.amount : acc),
    0,
  );

  const pendingPayments = transactions.reduce(
    (acc, item) => (item.status === "Pending" ? acc + item.amount : acc),
    0,
  );

  const completedPayments = transactions.filter(
    (item) => item.status === "Completed",
  ).length;

  const successRate =
    transactions.length > 0
      ? Math.round((completedPayments / transactions.length) * 100)
      : 0;

  /* TABLE ROWS */

  const rows = filteredTransactions.map((item) => (
    <Table.Tr key={item._id}>
      <Table.Td>{item.customer}</Table.Td>

      <Table.Td>{item.product}</Table.Td>

      <Table.Td fw={600}>₹{item.amount}</Table.Td>

      <Table.Td>
        <Badge
          variant="light"
          color={
            item.status === "Completed"
              ? "green"
              : item.status === "Pending"
                ? "yellow"
                : "red"
          }
        >
          {item.status}
        </Badge>
      </Table.Td>

      <Table.Td>{new Date(item.paymentDate).toLocaleDateString()}</Table.Td>

      <Table.Td>
        <Menu shadow="md" width={180}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <MoreVertical size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<Pencil size={16} />}
              onClick={() => {
                setSelectedPayment(item);

                setEditCustomer(item.customer);

                setEditProduct(item.product);

                setEditAmount(item.amount);

                setEditStatus(item.status);

                setEditDate(new Date(item.paymentDate));

                setEditNotes(item.notes || "");

                setEditOpened(true);
              }}
            >
              Edit
            </Menu.Item>

            <Menu.Item
              color="red"
              leftSection={<Trash2 size={16} />}
              onClick={() => handleDelete(item._id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  if (loading) {
    return (
      <Center h="70vh">
        <Loader color="#9c6238" size="lg" />
      </Center>
    );
  }

  return (
    <div className={classes.page}>
      {/* HEADER */}

      <div className={classes.header}>
        <div>
          <Title order={2}>Payments</Title>

          <Text c="dimmed" mt={4}>
            Track and manage your payments.
          </Text>
        </div>

        <Button onClick={() => setOpened(true)} color="#9c6238">
          + Add Payment
        </Button>
      </div>

      {/* STATS */}

      <SimpleGrid
        cols={{
          base: 1,
          sm: 2,
          lg: 4,
        }}
        spacing="lg"
        mt="xl"
      >
        <Paper withBorder radius="lg" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Revenue
              </Text>

              <Title order={3} mt={6}>
                ₹{totalRevenue}
              </Title>
            </div>

            <div className={classes.iconWrapper}>
              <IndianRupee size={28} />
            </div>
          </Group>
        </Paper>

        <Paper withBorder radius="lg" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Pending Payments
              </Text>

              <Title order={3} mt={6}>
                ₹{pendingPayments}
              </Title>
            </div>

            <div className={classes.iconWrapper}>
              <Wallet size={28} />
            </div>
          </Group>
        </Paper>

        <Paper withBorder radius="lg" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Success Rate
              </Text>

              <Title order={3} mt={6}>
                {successRate}%
              </Title>
            </div>

            <div className={classes.iconWrapper}>
              <CreditCard size={28} />
            </div>
          </Group>

          <Progress value={successRate} color="#9c6238" mt="lg" />
        </Paper>

        <Paper withBorder radius="lg" p="lg" className={classes.statCard}>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Total Transactions
              </Text>

              <Title order={3} mt={6}>
                {transactions.length}
              </Title>
            </div>

            <div className={classes.iconWrapper}>
              <TrendingUp size={28} />
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* TABLE */}

      <Card withBorder radius="xl" p="lg" mt="xl">
        <Group mb="xl">
          {["All", "Completed", "Pending", "Failed"].map((type) => (
            <Button
              key={type}
              variant={filter === type ? "filled" : "light"}
              color={
                type === "Completed"
                  ? "green"
                  : type === "Pending"
                    ? "yellow"
                    : type === "Failed"
                      ? "red"
                      : "#9c6238"
              }
              onClick={() => setFilter(type)}
            >
              {type}
            </Button>
          ))}
        </Group>

        <Table verticalSpacing="lg" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>

              <Table.Th>Product</Table.Th>

              <Table.Th>Amount</Table.Th>

              <Table.Th>Status</Table.Th>

              <Table.Th>Payment Date</Table.Th>

              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Card>

      {/* ADD PAYMENT MODAL */}

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);

          form.reset();
        }}
        title="Add Payment"
        centered
        size="lg"
        radius="xl"
      >
        <Text c="dimmed" mb="xl" size="sm">
          Enter payment transaction details.
        </Text>

        <Group grow mb="lg">
          <TextInput
            label="Customer Name"
            withAsterisk
            placeholder="Enter customer name"
            {...form.getInputProps("customer")}
          />

          <TextInput
            label="Product"
            withAsterisk
            placeholder="Enter product name"
            {...form.getInputProps("product")}
          />
        </Group>

        <Group grow mb="lg">
          <TextInput
            label="Amount (₹)"
            withAsterisk
            placeholder="Enter amount"
            {...form.getInputProps("amount")}
          />

          <Select
            label="Payment Status"
            placeholder="Select status"
            withAsterisk
            data={["Completed", "Pending", "Failed"]}
            {...form.getInputProps("status")}
          />
        </Group>

        <DateInput
          label="Payment Date"
          placeholder="Select payment date"
          withAsterisk
          mb="lg"
          {...form.getInputProps("date")}
        />

        <Textarea
          label="Notes"
          placeholder="Additional payment notes..."
          minRows={4}
          {...form.getInputProps("notes")}
        />

        <Group justify="flex-end" mt="xl">
          <Button
            variant="light"
            color="gray"
            onClick={() => {
              setOpened(false);

              form.reset();
            }}
          >
            Cancel
          </Button>

          <Button color="#9c6238" onClick={handleSave}>
            Save Payment
          </Button>
        </Group>
      </Modal>

      {/* EDIT PAYMENT MODAL */}

      <Modal
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        title="Edit Payment"
        centered
        size="lg"
        radius="xl"
      >
        <Group grow mb="lg">
          <TextInput
            label="Customer Name"
            value={editCustomer}
            onChange={(event) => setEditCustomer(event.target.value)}
          />

          <TextInput
            label="Product"
            value={editProduct}
            onChange={(event) => setEditProduct(event.target.value)}
          />
        </Group>

        <Group grow mb="lg">
          <TextInput
            label="Amount (₹)"
            value={editAmount}
            onChange={(event) => setEditAmount(event.target.value)}
          />

          <Select
            label="Payment Status"
            data={["Completed", "Pending", "Failed"]}
            value={editStatus}
            onChange={setEditStatus}
          />
        </Group>

        <DateInput
          label="Payment Date"
          value={editDate}
          onChange={setEditDate}
          mb="lg"
        />

        <Textarea
          label="Notes"
          placeholder="Update notes"
          minRows={4}
          value={editNotes}
          onChange={(event) => setEditNotes(event.target.value)}
        />

        <Group justify="flex-end" mt="xl">
          <Button variant="light" onClick={() => setEditOpened(false)}>
            Cancel
          </Button>

          <Button color="#9c6238" onClick={handleEditSave}>
            Save Changes
          </Button>
        </Group>
      </Modal>
    </div>
  );
};
