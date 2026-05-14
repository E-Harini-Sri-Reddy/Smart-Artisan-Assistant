import React, { useState } from "react";

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
} from "@mantine/core";

import { Camera, Moon, Sun, Monitor } from "lucide-react";

import classes from "./SettingsPage.module.css";

export const SettingsPage = () => {
  const [theme, setTheme] = useState("light");

  const [notifications, setNotifications] = useState(true);

  return (
    <div className={classes.page}>
      {/* HEADER */}

      <div className={classes.header}>
        <Title order={2}>Settings</Title>

        <Text c="dimmed" mt={4}>
          Manage your account preferences and app settings.
        </Text>
      </div>

      {/* PROFILE SETTINGS */}

      <Text fw={700} className={classes.sectionTitle}>
        Profile Settings
      </Text>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <div className={classes.profileLayout}>
          {/* LEFT AVATAR */}

          <div className={classes.avatarSection}>
            <div className={classes.avatarWrapper}>
              <Avatar size={90} radius="xl" color="#9c6238">
                HR
              </Avatar>

              <div className={classes.cameraIcon}>
                <Camera size={14} />
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}

          <div className={classes.formSection}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Full Name"
                defaultValue="Eadunur Harini Sri Reddy"
              />

              <TextInput
                label="Email Address"
                defaultValue="harinisri@example.com"
              />
            </SimpleGrid>

            <Select
              mt="lg"
              label="Profession"
              defaultValue="Pottery Artisan"
              data={[
                "Pottery Artisan",
                "Home Decor Artist",
                "Figurine Designer",
                "Craft Seller",
              ]}
            />

            <Button mt="xl" color="#9c6238" w={180}>
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
        {/* LANGUAGE */}

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

        {/* CURRENCY */}

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

        {/* THEME */}

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

        {/* NOTIFICATIONS */}

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
        {/* EXPORT */}

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

        {/* CLEAR CACHE */}

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
