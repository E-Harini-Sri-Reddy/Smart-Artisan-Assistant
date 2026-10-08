import { useState } from "react";

import {
  Button,
  Paper,
  PasswordInput,
  Switch,
  Text,
  Title,
} from "@mantine/core";

import { Lock, Shield, Trash2 } from "lucide-react";

import classes from "./SecurityPage.module.css";
import API from "../api/axios";

export const SecurityPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      alert("Password must be atleast 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <Title order={2}>Security</Title>
        <Text c="dimmed" mt={4}>
          Manage your password and account activity
        </Text>
      </div>

      <Paper withBorder radius="xl" p="xl" className={classes.card}>
        <Title order={4} mb="lg">
          Change Password
        </Title>

        <PasswordInput
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <PasswordInput
          mt="lg"
          label="New Password"
          placeholder="Enter new password"
          description="Password must be atleast 8 characters long"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <PasswordInput
          mt="lg"
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button
          mt="xl"
          color="#9c6238"
          leftSection={<Lock size={18} />}
          loading={loading}
          onClick={handleChangePassword}
        >
          Update Password
        </Button>
      </Paper>

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
