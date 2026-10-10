import { useState, useEffect, useMemo } from "react";
import { IconDotsVertical, IconSearch, IconPlus } from "@tabler/icons-react";

import {
  ActionIcon,
  Badge,
  Button,
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
} from "@mantine/core";

import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";

import API from "../api/axios";
import classes from "./ProductionPage.module.css";

export const ProductionPage = () => {
  const [opened, setOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [productFilter, setProductFilter] = useState(null);

  const form = useForm({
    initialValues: {
      _id: null,
      productName: "",
      image: "",
      category: "",
      quantity: "",
      cost: "",
      date: null,
      notes: "",
    },

    validate: {
      productName: (value) => (value.trim().length > 0 ? null : "Required"),
      category: (value) => (value.trim().length > 0 ? null : "Required"),
      quantity: (value) => (value ? null : "Required"),
      cost: (value) =>
        value && !isNaN(Number(value)) ? null : "Invalid number",
      date: (value) => (value ? null : "Required"),
    },
  });

  const fetchData = async () => {
    try {
      const res = await API.get(`/production?t=${Date.now()}`);
      const unique = Array.from(
        new Map(res.data.map((item) => [item._id, item])).values(),
      );
      setData(unique);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const productOptions = useMemo(() => {
    const names = [
      ...new Set(data.map((d) => d.productName).filter(Boolean)),
    ].sort();
    return names.map((name) => ({ value: name, label: name }));
  }, [data]);

  const displayRows = useMemo(() => {
    let rows = [...data];

    if (viewMode === "by_product" && productFilter) {
      rows = rows.filter((r) => r.productName === productFilter);
    }

    if (viewMode === "summary") {
      const map = new Map();
      rows.forEach((r) => {
        const key = r.productName || "Unknown";
        const qty = Number(r.quantity) || 0;
        const cost = Number(r.cost) || 0;
        const existing = map.get(key) || {
          _id: `summary-${key}`,
          productName: key,
          category: r.category,
          quantity: 0,
          cost: 0,
          occurrences: 0,
          date: r.date,
          image: r.image,
          isSummary: true,
        };
        existing.quantity += qty;
        existing.cost += cost;
        existing.occurrences += 1;
        if (new Date(r.date) > new Date(existing.date || 0)) {
          existing.date = r.date;
          existing.category = r.category;
          existing.image = r.image || existing.image;
        }
        map.set(key, existing);
      });
      rows = Array.from(map.values());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((item) =>
        item.productName?.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [data, viewMode, productFilter, search]);

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
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await API.delete(`/production/${id}`);
      await fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete the record.");
      fetchData();
    }
  };

  const handleEdit = (item) => {
    if (item.isSummary) return;
    setEditMode(true);
    setOpened(true);
    form.setValues({
      ...item,
      date: item.date ? new Date(item.date) : null,
    });
  };

  const rows = displayRows.map((row) => (
    <Table.Tr key={row._id}>
      <Table.Td>
        <Group gap="sm">
          {row.image && <Image src={row.image} w={40} h={40} radius="md" />}
          <div>
            <Text fw={500}>{row.productName}</Text>
            {row.source === "assignment" && (
              <Badge size="xs" variant="light" color="orange">
                From assignment
              </Badge>
            )}
            {row.isSummary && (
              <Text size="xs" c="dimmed">
                {row.occurrences} occurrence
                {row.occurrences === 1 ? "" : "s"}
              </Text>
            )}
          </div>
        </Group>
      </Table.Td>
      <Table.Td>{row.category}</Table.Td>
      <Table.Td>
        {row.isSummary ? row.quantity : row.quantity}
      </Table.Td>
      <Table.Td>₹{row.cost}</Table.Td>
      <Table.Td>
        {row.date ? new Date(row.date).toLocaleDateString() : "-"}
      </Table.Td>
      <Table.Td>
        {!row.isSummary && (
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
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditMode(false);
          form.reset();
        }}
        title={editMode ? "Edit Production" : "Add Production"}
        radius="lg"
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <TextInput
            label="Product Name"
            withAsterisk
            {...form.getInputProps("productName")}
          />
          <TextInput
            label="Image URL"
            mt="sm"
            {...form.getInputProps("image")}
          />
          <TextInput
            label="Category"
            withAsterisk
            mt="sm"
            {...form.getInputProps("category")}
          />

          <Group grow mt="sm">
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
          </Group>

          <DateInput
            label="Date"
            withAsterisk
            mt="sm"
            {...form.getInputProps("date")}
          />

          <Textarea label="Notes" mt="sm" {...form.getInputProps("notes")} />

          <Button type="submit" fullWidth mt="xl" color="#4b3621">
            {editMode ? "Update Record" : "Save Record"}
          </Button>
        </form>
      </Modal>

      <div className={classes.page}>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={2}>Production Management</Title>
            <Text c="dimmed">
              Every production update is recorded here. Completed assignments
              appear automatically.
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={18} />}
            color="#4b3621"
            onClick={() => {
              setEditMode(false);
              form.reset();
              setOpened(true);
            }}
          >
            Add New Record
          </Button>
        </Group>

        <Paper withBorder radius="lg" p="md" mt="xl">
          <Group align="flex-end" grow>
            <Select
              label="View"
              data={[
                { value: "all", label: "Show all occurrences" },
                {
                  value: "by_product",
                  label: "Show all occurrences of one product",
                },
                {
                  value: "summary",
                  label: "Unique products summary",
                },
              ]}
              value={viewMode}
              onChange={(v) => {
                setViewMode(v || "all");
                if (v !== "by_product") setProductFilter(null);
              }}
            />
            {viewMode === "by_product" && (
              <Select
                label="Product"
                placeholder="Select product"
                data={productOptions}
                value={productFilter}
                onChange={setProductFilter}
                searchable
                clearable
              />
            )}
            <TextInput
              label="Search"
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Group>
        </Paper>

        <Paper withBorder radius="lg" mt="lg" style={{ overflow: "hidden" }}>
          <ScrollArea>
            <Table verticalSpacing="sm" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>
                    {viewMode === "summary" ? "Total qty" : "Quantity"}
                  </Table.Th>
                  <Table.Th>
                    {viewMode === "summary" ? "Total cost" : "Cost per unit"}
                  </Table.Th>
                  <Table.Th>
                    {viewMode === "summary" ? "Latest date" : "Date"}
                  </Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center" py="xl" c="dimmed">
                      No records found.
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
