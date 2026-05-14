import React, { useState } from "react";

import {
  Button,
  Divider,
  Paper,
  PasswordInput,
  Switch,
  Text,
  Title,
} from "@mantine/core";

import { Lock, Shield, Trash2 } from "lucide-react";

import classes from "./SecurityPage.module.css";

export const SecurityPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  return (
    <div className={classes.page}>
      {/* HEADER */}

      <div className={classes.header}>
        <Title order={2}>Security</Title>

        <Text c="dimmed" mt={4}>
          Manage your password and account activity
        </Text>
      </div>

      {/* CHANGE PASSWORD */}

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Title order={4} mb="lg">
          Change Password
        </Title>

        <PasswordInput
          label="Current Password"
          placeholder="Enter current password"
        />

        <PasswordInput
          mt="lg"
          label="New Password"
          placeholder="Enter new password"
          description="Password must be atleast 8 characters long"
        />

        <PasswordInput
          mt="lg"
          label="Confirm New Password"
          placeholder="Confirm new password"
        />

        <Button mt="xl" color="#9c6238" leftSection={<Lock size={18} />}>
          Update Password
        </Button>
      </Paper>

      {/* TWO FACTOR AUTH */}

      <Paper withBorder radius="xl" p="xl" mt="xl" className={classes.card}>
        <div className={classes.preferenceRow}>
          <div>
            <div className={classes.sectionHeader}>
              <Shield size={22} />

              <Title order={4}>Two Factor Authentication</Title>
            </div>

            <Text size="sm" c="dimmed" mt={6} className={classes.description}>
              Add an extra layer of security to your account. You will need a
              verification code in addition to your password to login.
            </Text>
          </div>

          <Switch
            checked={twoFactorEnabled}
            onChange={(event) =>
              setTwoFactorEnabled(event.currentTarget.checked)
            }
            color="#9c6238"
            size="lg"
          />
        </div>
      </Paper>

      {/* LOGIN ACTIVITY */}

      <Paper withBorder radius="xl" p="xl" mt="xl" className={classes.card}>
        <div className={classes.preferenceRow}>
          <div>
            <Title order={4}>Login Activity</Title>

            <Text size="sm" c="dimmed" mt={6}>
              View and manage your active sessions
            </Text>
          </div>

          <Button variant="light" color="#9c6238">
            View Sessions
          </Button>
        </div>
      </Paper>

      {/* DELETE ACCOUNT */}

      <Paper withBorder radius="xl" p="xl" mt="xl" className={classes.card}>
        <div className={classes.preferenceRow}>
          <div>
            <Title order={4} c="red">
              Delete Account
            </Title>

            <Text size="sm" c="dimmed" mt={6}>
              Permanently delete your account and all data
            </Text>
          </div>

          <Button color="red" leftSection={<Trash2 size={18} />}>
            Delete Account
          </Button>
        </div>
      </Paper>
    </div>
  );
};
