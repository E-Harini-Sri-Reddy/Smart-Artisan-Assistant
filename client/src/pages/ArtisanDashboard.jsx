import React from "react";
import { 
  Container, 
  SimpleGrid, 
  UnstyledButton, 
  Text, 
  Paper, 
  ThemeIcon, 
  Stack, 
  Group, 
  Button 
} from "@mantine/core";
import { 
  IconLogout, 
  IconCashBanknote, 
  IconScan, 
  IconPackage, 
  IconStars, 
  IconChartBar, 
  IconSettings 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export function ArtisanDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.reload(); 
  };

  // CLEANED LIST: Removed Customers and Messages
  const actions = [
    { label: "Money Flow", icon: <IconCashBanknote size="2rem" />, path: "/money-flow", color: "green" },
    { label: "Price Analyser", icon: <IconScan size="2rem" />, path: "/price-analyser", color: "blue" },
    { label: "Inventory", icon: <IconPackage size="2rem" />, path: "/inventory", color: "orange" },
    { label: "Quality Check", icon: <IconStars size="2rem" />, path: "/quality-check", color: "yellow" },
    { label: "Analytics", icon: <IconChartBar size="2rem" />, path: "/analytics", color: "teal" },
    { label: "Settings", icon: <IconSettings size="2rem" />, path: "/settings", color: "gray" },
  ];

  return (
    <Container size="xs" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Text size="xl" fw={800} variant="gradient" gradient={{ from: 'orange', to: 'brown' }}>
            Smart Artisan
          </Text>
          <Text size="xs" c="dimmed" fw={500}>Workspace</Text>
        </Stack>
        <Button 
          variant="subtle" 
          color="gray" 
          onClick={handleLogout} 
          leftSection={<IconLogout size={16} />}
        >
          Logout
        </Button>
      </Group>

      {/* 2 columns x 3 rows = 6 items */}
      <SimpleGrid cols={2} spacing="md">
        {actions.map((item, index) => (
          <Paper
            key={index}
            withBorder
            radius="lg"
            p="xl"
            component={UnstyledButton}
            onClick={() => navigate(item.path)}
            style={{
              height: '150px', // Restored slightly more height for better click targets
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
            }}
            styles={{
              root: {
                '&:active': { transform: 'scale(0.95)' },
                '&:hover': { 
                  backgroundColor: 'var(--mantine-color-gray-0)', 
                  borderColor: 'var(--mantine-color-orange-filled)' 
                }
              }
            }}
          >
            <Stack align="center" gap="sm">
              <ThemeIcon variant="light" size={54} radius="md" color={item.color}>
                {item.icon}
              </ThemeIcon>
              <Text size="xs" fw={700} ta="center" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.label}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  );
}