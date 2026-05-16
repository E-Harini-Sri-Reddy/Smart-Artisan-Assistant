import React, { useState, useEffect } from "react";
import { 
  Container, TextInput, Button, Title, Paper, Group, 
  ActionIcon, Stack, Text, Divider, Alert 
} from "@mantine/core";
import { 
  IconArrowLeft, IconBrandWhatsapp, IconDeviceFloppy, IconInfoCircle 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ArtisanSettings() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    if (userInfo?.phoneNumber) {
      setPhone(userInfo.phoneNumber.replace("+91", ""));
    }
  }, []);

  const handleSave = async () => {
    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit number");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      // Update this URL to match your backend route
      await axios.put(
        "http://localhost:5000/api/users/profile", 
        { phoneNumber: fullPhone },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      const updatedUser = { ...userInfo, phoneNumber: fullPhone };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      alert("WhatsApp Linked!");
    } catch (error) {
      console.error(error);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Group mb="xl">
        <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray" size="lg">
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Title order={3}>Settings</Title>
      </Group>

      <Stack gap="md">
        <Alert icon={<IconInfoCircle size={16} />} title="WhatsApp Automation" color="orange">
          Text your updates to our bot. Use the 10-digit number you'll text from.
        </Alert>

        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Stack gap="md">
            <Group gap="xs">
              <IconBrandWhatsapp color="#25D366" />
              <Text fw={600}>WhatsApp Connection</Text>
            </Group>

            <TextInput
              label="Phone Number"
              placeholder="9876543210"
              leftSection={<Text size="sm" fw={700} c="dimmed">+91</Text>}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              size="md"
              radius="md"
            />

            <Button 
              fullWidth 
              color="orange" 
              size="lg" 
              mt="md" 
              radius="md"
              loading={loading}
              leftSection={<IconDeviceFloppy size={20} />}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}