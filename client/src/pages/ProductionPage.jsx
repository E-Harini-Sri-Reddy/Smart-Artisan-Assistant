import React, { useState, useEffect } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconSearch,
  IconSelector,
  IconPlus,
} from "@tabler/icons-react";

import {
  ActionIcon,
  Button,
  Center,
  Group,
  Image,
  Menu,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";

import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";

import API from "../api/axios";
import classes from "./ProductionPage.module.css";

function Th({ children, reversed, sorted, onSort }) {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;

  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={600} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export const ProductionPage = () => {
  const [opened, setOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // FORM
  const form = useForm({
    initialValues: {
      _id: null,
      productName: "",
      image: "",
      category: "",
      quantity: "",
      unit: "",
      materials: "",
      cost: "",
      date: null,
      notes: "",
    },

    validate: {
      productName: (value) =>
        value.trim().length > 0 ? null : "Product Name is required",

      category: (value) =>
        value.trim().length > 0 ? null : "Category is required",

      quantity: (value) =>
        value.trim().length > 0 ? null : "Quantity is required",

      cost: (value) =>
        value && !isNaN(Number(value)) ? null : "Valid cost is required",

      date: (value) => (value ? null : "Date is required"),
    },
  });

  // FETCH
  const fetchData = async () => {
    try {
      const res = await API.get("/production");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // SAVE (CREATE / UPDATE)
  const handleSave = async (values) => {
    try {
      if (editMode) {
        await API.put(`/production/${values._id}`, values);
      } else {
        await API.post("/production", values);
      }

      setOpened(false);
      setEditMode(false);
      form.reset();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      await API.delete(`/production/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT
  const handleEdit = (item) => {
    setEditMode(true);
    setOpened(true);

    form.setValues({
      _id: item._id,
      productName: item.productName,
      image: item.image,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      materials: item.materials,
      cost: item.cost,
      date: item.date ? new Date(item.date) : null,
      notes: item.notes,
    });
  };

  const filteredData = data.filter((item) =>
    item.productName?.toLowerCase().includes(search.toLowerCase()),
  );

  const rows = filteredData.map((row) => (
    <Table.Tr key={row._id}>
      <Table.Td>
        <Group gap="sm">
          {row.image && <Image src={row.image} w={52} h={52} radius="md" />}
          <Text fw={500}>{row.productName}</Text>
        </Group>
      </Table.Td>

      <Table.Td>{row.category}</Table.Td>
      <Table.Td>{row.quantity}</Table.Td>
      <Table.Td>₹{row.cost}</Table.Td>
      <Table.Td>
        {row.date ? new Date(row.date).toLocaleDateString() : "-"}
      </Table.Td>

      <Table.Td>
        <Menu shadow="md" width={150}>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDotsVertical size={18} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item onClick={() => handleEdit(row)}>Edit</Menu.Item>

            <Menu.Item color="red" onClick={() => handleDelete(row._id)}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      {/* MODAL (ONLY ADD IMAGE INPUT) */}
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditMode(false);
          form.reset();
        }}
        title={editMode ? "Edit Entry" : "Add Entry"}
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <TextInput
            label="Product Name"
            withAsterisk
            {...form.getInputProps("productName")}
          />

          {/* NEW IMAGE URL INPUT */}
          <TextInput
            label="Image URL"
            placeholder="Paste image link"
            {...form.getInputProps("image")}
          />

          <TextInput
            label="Category"
            withAsterisk
            {...form.getInputProps("category")}
          />

          <TextInput
            label="Quantity"
            withAsterisk
            {...form.getInputProps("quantity")}
          />

          <TextInput
            label="Cost"
            withAsterisk
            {...form.getInputProps("cost")}
          />

          <DateInput
            label="Date"
            withAsterisk
            {...form.getInputProps("date")}
          />

          <Textarea label="Notes" {...form.getInputProps("notes")} />

          <Group justify="flex-end" mt="md">
            <Button type="submit" color="#4b3621">
              {editMode ? "Update" : "Save"}
            </Button>
          </Group>
        </form>
      </Modal>

      {/* PAGE (UNCHANGED STRUCTURE) */}
      <div className={classes.page}>
        <div className={classes.header}>
          <div>
            <Title order={2}>Production Entries</Title>
            <Text c="dimmed" mt={4}>
              Add, view and manage your production records.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={18} />}
            color="#4b3621"
            onClick={() => setOpened(true)}
          >
            Add New Entry
          </Button>
        </div>

        <Paper withBorder radius="lg" p="md" mt="xl">
          <Group justify="space-between">
            <TextInput
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={320}
            />
          </Group>
        </Paper>

        <Paper withBorder radius="lg" p="md" mt="lg">
          <ScrollArea>
            <Table horizontalSpacing="lg" verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Quantity</Table.Th>
                  <Table.Th>Cost per unit</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center">No data</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </div>
    </>
  );
};
