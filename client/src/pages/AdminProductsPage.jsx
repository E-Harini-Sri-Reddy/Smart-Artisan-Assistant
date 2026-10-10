import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Group,
  Image,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import API from "../api/axios";
import { PhotoCaptureInput } from "../components/PhotoCaptureInput";
import classes from "./SettingsPage.module.css";

const UNIT_CATEGORIES = [
  {
    value: "count",
    label: "Count & Packaging Units",
    description: "Used for individual, distinct items",
    units: [
      { value: "pcs", label: "pieces/pcs" },
      { value: "set", label: "set" },
      { value: "pair", label: "pair" },
      { value: "pack", label: "pack/pk" },
      { value: "dozen", label: "dozen/dz" },
      { value: "box", label: "box" },
    ],
  },
  {
    value: "weight",
    label: "Weight & Mass Units",
    description:
      "Used for loose material, artisanal foods, powders, and skincare",
    units: [
      { value: "g", label: "g" },
      { value: "kg", label: "kg" },
    ],
  },
  {
    value: "liquid",
    label: "Liquid & Volume Units",
    description: "Used for liquids, oils, perfumes, and sprays",
    units: [
      { value: "ml", label: "ml" },
      { value: "l", label: "l" },
    ],
  },
  {
    value: "length",
    label: "Length & Area Units",
    description:
      "Used for textiles, fabric yards, ribbons, rugs, or custom artwork",
    units: [
      { value: "m", label: "m" },
      { value: "sq ft", label: "sq ft" },
      { value: "sq m", label: "sq m" },
    ],
  },
];

const categoryOptions = UNIT_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
  description: c.description,
}));

const findCategoryForUnit = (unit) => {
  const match = UNIT_CATEGORIES.find((c) =>
    c.units.some((u) => u.value === unit),
  );
  return match?.value || "count";
};

const emptyForm = () => ({
  name: "",
  description: "",
  price: 0,
  unitCategory: "count",
  unit: "pcs",
  imageFile: null,
});

export const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedCategory = useMemo(
    () => UNIT_CATEGORIES.find((c) => c.value === form.unitCategory),
    [form.unitCategory],
  );

  const unitOptions = selectedCategory?.units || [];

  const load = useCallback(async () => {
    try {
      const { data } = await API.get("/products");
      const byName = new Map();
      (data || []).forEach((p) => {
        const key = (p.name || "").trim().toLowerCase();
        if (!key) return;
        const existing = byName.get(key);
        if (
          !existing ||
          new Date(p.updatedAt || p.createdAt) >
            new Date(existing.updatedAt || existing.createdAt)
        ) {
          byName.set(key, p);
        }
      });
      setProducts(
        Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setExistingImage("");
  };

  const startEdit = (product) => {
    const category =
      product.unitCategory || findCategoryForUnit(product.unit) || "count";
    const categoryDef =
      UNIT_CATEGORIES.find((c) => c.value === category) || UNIT_CATEGORIES[0];
    const unitValue = categoryDef.units.some((u) => u.value === product.unit)
      ? product.unit
      : categoryDef.units[0].value;

    setEditingId(product._id);
    setExistingImage(product.image || "");
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? 0,
      unitCategory: categoryDef.value,
      unit: unitValue,
      imageFile: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (value) => {
    const next = UNIT_CATEGORIES.find((c) => c.value === value);
    setForm((f) => ({
      ...f,
      unitCategory: value,
      unit: next?.units[0]?.value || "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!form.unitCategory) {
      alert("Unit category is required");
      return;
    }
    if (!form.unit) {
      alert("Unit is required");
      return;
    }

    const duplicate = products.some(
      (p) =>
        p.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
        p._id !== editingId,
    );
    if (duplicate) {
      alert("This product already exists in your catalog.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description);
      formData.append("price", String(Number(form.price) || 0));
      formData.append("unit", form.unit);
      formData.append("unitCategory", form.unitCategory);
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      if (editingId) {
        await API.put(`/products/${editingId}`, formData);
      } else {
        await API.post("/products", formData);
      }
      resetForm();
      await load();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          (editingId ? "Could not update product" : "Could not create product"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product from the catalog?")) return;
    try {
      await API.delete(`/products/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <Title order={2}>Products</Title>
        <Text c="dimmed" mt={4}>
          Unique product catalog for your organization. Production history is
          tracked separately.
        </Text>
      </div>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Group justify="space-between" mb="md">
          <Text fw={700}>{editingId ? "Edit product" : "Add product"}</Text>
          {editingId && (
            <Button variant="subtle" color="gray" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </Group>

        <Group align="flex-end" grow mb="md">
          <TextInput
            label="Product name"
            withAsterisk
            placeholder="e.g. Oak Dining Table"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <NumberInput
            label="Price"
            min={0}
            value={form.price}
            onChange={(v) =>
              setForm((f) => ({ ...f, price: Number(v) || 0 }))
            }
          />
        </Group>

        <Group align="flex-start" grow mb="md">
          <Select
            label="Unit category"
            withAsterisk
            data={categoryOptions}
            value={form.unitCategory}
            onChange={handleCategoryChange}
            renderOption={({ option }) => (
              <Stack gap={2}>
                <Text size="sm">{option.label}</Text>
                <Text size="xs" c="dimmed">
                  {option.description}
                </Text>
              </Stack>
            )}
            required
          />
          <Select
            label="Unit"
            withAsterisk
            data={unitOptions}
            value={form.unit}
            onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
            placeholder="Select unit"
            disabled={!form.unitCategory}
            required
          />
        </Group>

        {selectedCategory && (
          <Text size="xs" c="dimmed" mb="md" mt={-8}>
            {selectedCategory.description}
          </Text>
        )}

        <TextInput
          label="Description"
          mb="md"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />

        {editingId && existingImage && !form.imageFile && (
          <Group mb="sm" gap="sm">
            <Image
              src={existingImage}
              alt="Current product"
              w={72}
              h={72}
              radius="md"
              fit="cover"
            />
            <Text size="sm" c="dimmed">
              Current image — upload a new one to replace it
            </Text>
          </Group>
        )}

        <PhotoCaptureInput
          label={editingId ? "Replace product image" : "Product image"}
          description="Upload a photo or take one with your camera"
          multiple={false}
          value={form.imageFile}
          onChange={(file) => setForm((f) => ({ ...f, imageFile: file }))}
          accept="image/*"
        />

        <Button mt="md" color="#9c6238" loading={loading} onClick={handleSubmit}>
          {editingId ? "Save changes" : "Add to catalog"}
        </Button>
      </Paper>

      <Text fw={700} className={classes.sectionTitle}>
        Catalog ({products.length} unique)
      </Text>
      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Image</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {products.map((p) => (
              <Table.Tr key={p._id}>
                <Table.Td>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      w={48}
                      h={48}
                      radius="sm"
                      fit="cover"
                    />
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td>{p.unit}</Table.Td>
                <Table.Td>₹{p.price ?? 0}</Table.Td>
                <Table.Td>{p.description || "—"}</Table.Td>
                <Table.Td>
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="light"
                      color="#9c6238"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {products.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="md">
                    No products yet. Add your first unique product above.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
};
