import { useEffect, useState } from "react";

import {
  Avatar,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Switch,
  Text,
  TextInput,
  Title,
  PasswordInput,
  Stack,
  Table,
} from "@mantine/core";

import { Camera, Moon, Sun, Monitor } from "lucide-react";

import classes from "./SettingsPage.module.css";
import API from "../api/axios";
import { getStoredUser } from "../utils/authStorage";

export const SettingsPage = () => {
  const stored = getStoredUser();
  const isAdmin = stored?.membershipRole === "admin" || stored?.role === "organization";

  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [orgName, setOrgName] = useState(stored?.organizationName || "");
  const [profileName, setProfileName] = useState(stored?.name || "");
  const [profileEmail] = useState(stored?.email || "");
  const [profession, setProfession] = useState(stored?.profession || "Artisan");

  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [assignProductId, setAssignProductId] = useState(null);
  const [assignUserId, setAssignUserId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadOrgData = async () => {
    if (!isAdmin) return;
    try {
      const [orgRes, membersRes, productsRes, assignRes] = await Promise.all([
        API.get("/organizations/me"),
        API.get("/organizations/members"),
        API.get("/products"),
        API.get("/products/assignments/list"),
      ]);
      setOrgName(orgRes.data.name || "");
      setMembers(membersRes.data || []);
      setProducts(productsRes.data || []);
      setAssignments(assignRes.data || []);
      if (orgRes.data.settings) {
        setTheme(orgRes.data.settings.theme || "light");
        setNotifications(orgRes.data.settings.notifications !== false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  const handleRename = async () => {
    if (!orgName.trim()) {
      alert("Organization name is required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.put("/organizations/rename", { name: orgName.trim() });
      const updated = { ...stored, organizationName: data.name };
      localStorage.setItem("userInfo", JSON.stringify(updated));
      alert("Organization renamed");
    } catch (err) {
      alert(err.response?.data?.message || "Rename failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data } = await API.put("/users/profile", {
        name: profileName,
        profession,
      });
      localStorage.setItem("userInfo", JSON.stringify({ ...stored, ...data, token: stored.token }));
      alert("Profile updated");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleInvite = async () => {
    try {
      await API.post("/organizations/members", {
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: "user",
      });
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      await loadOrgData();
      alert("Member added");
    } catch (err) {
      alert(err.response?.data?.message || "Invite failed");
    }
  };

  const handleRemoveMember = async (id) => {
    try {
      await API.delete(`/organizations/members/${id}`);
      await loadOrgData();
    } catch (err) {
      alert(err.response?.data?.message || "Remove failed");
    }
  };

  const handleSuspendMember = async (id) => {
    try {
      await API.put(`/organizations/members/${id}`, { status: "suspended" });
      await loadOrgData();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      await API.post("/products", { name: newProductName.trim() });
      setNewProductName("");
      await loadOrgData();
    } catch (err) {
      alert(err.response?.data?.message || "Create failed");
    }
  };

  const handleAssignProduct = async () => {
    if (!assignProductId || !assignUserId) {
      alert("Select a product and a member");
      return;
    }
    try {
      await API.post("/products/assignments", {
        productId: assignProductId,
        userId: assignUserId,
      });
      await loadOrgData();
      alert("Product assigned");
    } catch (err) {
      alert(err.response?.data?.message || "Assignment failed");
    }
  };

  const orgUserOptions = members
    .filter((m) => m.status === "active" && m.role === "user" && m.user)
    .map((m) => ({
      value: m.user._id,
      label: `${m.user.name} (${m.user.email})`,
    }));

  const productOptions = products.map((p) => ({
    value: p._id,
    label: p.name,
  }));

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <Title order={2}>Settings</Title>
        <Text c="dimmed" mt={4}>
          Manage your account preferences and app settings.
        </Text>
      </div>

      {/* ORGANIZATION (Admin) */}
      {isAdmin && (
        <>
          <Text fw={700} className={classes.sectionTitle}>
            Organization
          </Text>
          <Paper withBorder radius="xl" p="xl" className={classes.card}>
            <Group align="flex-end" grow>
              <TextInput
                label="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Button color="#9c6238" w={180} loading={saving} onClick={handleRename}>
                Rename
              </Button>
            </Group>
          </Paper>

          <Text fw={700} className={classes.sectionTitle}>
            Members
          </Text>
          <Paper withBorder radius="xl" p="xl" className={classes.card}>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
              <TextInput
                label="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <TextInput
                label="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <PasswordInput
                label="Temporary Password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
              />
            </SimpleGrid>
            <Button color="#9c6238" mb="lg" onClick={handleInvite}>
              Add Organization User
            </Button>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.map((m) => (
                  <Table.Tr key={m._id}>
                    <Table.Td>{m.user?.name}</Table.Td>
                    <Table.Td>{m.user?.email}</Table.Td>
                    <Table.Td>{m.role}</Table.Td>
                    <Table.Td>{m.status}</Table.Td>
                    <Table.Td>
                      {m.role !== "admin" && m.status === "active" && (
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            onClick={() => handleSuspendMember(m._id)}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            onClick={() => handleRemoveMember(m._id)}
                          >
                            Remove
                          </Button>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <Text fw={700} className={classes.sectionTitle}>
            Products & Assignment
          </Text>
          <Paper withBorder radius="xl" p="xl" className={classes.card}>
            <Group align="flex-end" mb="lg">
              <TextInput
                label="New Product"
                placeholder="Product name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button color="#9c6238" onClick={handleCreateProduct}>
                Add Product
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
              <Select
                label="Product"
                data={productOptions}
                value={assignProductId}
                onChange={setAssignProductId}
                placeholder="Select product"
              />
              <Select
                label="Organization User"
                data={orgUserOptions}
                value={assignUserId}
                onChange={setAssignUserId}
                placeholder="Select member"
              />
            </SimpleGrid>
            <Button color="#9c6238" mb="lg" onClick={handleAssignProduct}>
              Assign Product
            </Button>

            <Stack gap="xs">
              {assignments.map((a) => (
                <Text key={a._id} size="sm">
                  {a.product?.name} → {a.user?.name} ({a.user?.email})
                </Text>
              ))}
              {assignments.length === 0 && (
                <Text size="sm" c="dimmed">
                  No product assignments yet.
                </Text>
              )}
            </Stack>
          </Paper>
        </>
      )}

      {/* PROFILE SETTINGS */}
      <Text fw={700} className={classes.sectionTitle}>
        Profile Settings
      </Text>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <div className={classes.profileLayout}>
          <div className={classes.avatarSection}>
            <div className={classes.avatarWrapper}>
              <Avatar size={90} radius="xl" color="#9c6238">
                {(profileName || "U")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <div className={classes.cameraIcon}>
                <Camera size={14} />
              </div>
            </div>
          </div>

          <div className={classes.formSection}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Full Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <TextInput label="Email Address" value={profileEmail} disabled />
            </SimpleGrid>

            <Select
              mt="lg"
              label="Profession"
              value={profession}
              onChange={setProfession}
              data={[
                "Artisan",
                "Pottery Artisan",
                "Home Decor Artist",
                "Figurine Designer",
                "Craft Seller",
              ]}
            />

            <Button mt="xl" color="#9c6238" w={180} onClick={handleUpdateProfile}>
              Update Profile
            </Button>
          </div>
        </div>
      </Paper>

      {/* PREFERENCES */}
      <Text fw={700} className={classes.sectionTitle}>
        Preferences
      </Text>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Language</Text>
            <Text size="sm" c="dimmed">
              Choose your preferred language
            </Text>
          </div>
          <Select
            w={180}
            defaultValue="English"
            data={["English", "Hindi", "Tamil", "Telugu"]}
          />
        </div>

        <Divider my="lg" />

        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Currency</Text>
            <Text size="sm" c="dimmed">
              Choose your default currency
            </Text>
          </div>
          <Select
            w={180}
            defaultValue="INR (₹)"
            data={["INR (₹)", "USD ($)", "EUR (€)"]}
          />
        </div>

        <Divider my="lg" />

        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Theme</Text>
            <Text size="sm" c="dimmed">
              Choose your preferred theme
            </Text>
          </div>
          <Group>
            <Card
              withBorder
              radius="lg"
              p="sm"
              className={
                theme === "light" ? classes.activeTheme : classes.themeCard
              }
              onClick={() => setTheme("light")}
            >
              <Sun size={18} />
              <Text size="sm">Light</Text>
            </Card>
            <Card
              withBorder
              radius="lg"
              p="sm"
              className={
                theme === "dark" ? classes.activeTheme : classes.themeCard
              }
              onClick={() => setTheme("dark")}
            >
              <Moon size={18} />
              <Text size="sm">Dark</Text>
            </Card>
            <Card
              withBorder
              radius="lg"
              p="sm"
              className={
                theme === "system" ? classes.activeTheme : classes.themeCard
              }
              onClick={() => setTheme("system")}
            >
              <Monitor size={18} />
              <Text size="sm">System</Text>
            </Card>
          </Group>
        </div>

        <Divider my="lg" />

        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Notifications</Text>
            <Text size="sm" c="dimmed">
              Manage your notification preferences
            </Text>
          </div>
          <Switch
            checked={notifications}
            onChange={(event) => setNotifications(event.currentTarget.checked)}
            color="#9c6238"
            size="md"
          />
        </div>
      </Paper>

      {/* DATA & BACKUP */}
      <Text fw={700} className={classes.sectionTitle}>
        Data & Backup
      </Text>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Export Data</Text>
            <Text size="sm" c="dimmed">
              Download all your data
            </Text>
          </div>
          <Button variant="light" color="#9c6238">
            Export
          </Button>
        </div>

        <Divider my="lg" />

        <div className={classes.preferenceRow}>
          <div>
            <Text fw={600}>Clear Cache</Text>
            <Text size="sm" c="dimmed">
              Clear temporary app data
            </Text>
          </div>
          <Button variant="light" color="red">
            Clear
          </Button>
        </div>
      </Paper>
    </div>
  );
};
