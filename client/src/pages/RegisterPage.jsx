import { useState } from "react";
import {
  Paper,
  Text,
  TextInput,
  PasswordInput,
  Title,
  SegmentedControl,
  Box,
  Anchor,
  Button,
  Divider,
  Modal,
  Group,
  Stack,
} from "@mantine/core";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("artisan");
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageModal, setMessageModal] = useState({
    opened: false,
    title: "",
    message: "",
  });

  const showMessage = ({ title, message }) => {
    setMessageModal({ opened: true, title, message });
  };

  const closeMessage = () => {
    setMessageModal((prev) => ({ ...prev, opened: false }));
  };

  const persistAndGo = (data) => {
    localStorage.setItem("userInfo", JSON.stringify(data));
    window.location.href = "/";
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (role === "organization" && !organizationName.trim()) {
      showMessage({
        title: "Organization name required",
        message: "Please enter your organization name to continue.",
      });
      return;
    }
    if (password.length < 8) {
      showMessage({
        title: "Password too short",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          organizationName:
            role === "organization" ? organizationName : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showMessage({
          title: "Registration failed",
          message: data.message || "Registration failed. Please try again.",
        });
        return;
      }
      persistAndGo(data);
    } catch {
      showMessage({
        title: "Connection issue",
        message:
          "Unable to reach the server right now. Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (role === "organization" && !organizationName.trim()) {
      showMessage({
        title: "Organization name required",
        message:
          "Please enter your organization name before continuing with Google.",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: credentialResponse.credential,
          role,
          organizationName:
            role === "organization" ? organizationName : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        persistAndGo(data);
      } else {
        showMessage({
          title: "Registration failed",
          message: data.message || "Registration failed. Please try again.",
        });
      }
    } catch {
      showMessage({
        title: "Connection issue",
        message:
          "Unable to complete Google registration right now. Please try again.",
      });
    }
  };

  return (
    <div className={classes.page}>
      <Modal
        opened={messageModal.opened}
        onClose={closeMessage}
        title={messageModal.title}
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed">
            {messageModal.message}
          </Text>
          <Group justify="flex-end">
            <Button color="#9c6238" onClick={closeMessage}>
              OK
            </Button>
          </Group>
        </Stack>
      </Modal>

      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Register" className={classes.image} />
        </div>

        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Join Assistant
            </Title>

            <Text size="sm" fw={500} mb={5}>
              I want to register as:
            </Text>
            <SegmentedControl
              fullWidth
              mb="md"
              color="#4b3621"
              value={role}
              onChange={setRole}
              data={[
                { label: "Artisan", value: "artisan" },
                { label: "Organization", value: "organization" },
              ]}
            />

            {role === "organization" && (
              <TextInput
                label="Organization Name"
                placeholder="e.g. Royal Weavers Guild"
                mb="sm"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            )}

            <form onSubmit={handleEmailRegister}>
              <TextInput
                label="Full Name"
                placeholder="Your name"
                required
                mb="sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                mb="sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                required
                mb="md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                color="#9c6238"
                loading={loading}
              >
                Create Account
              </Button>
            </form>

            <Divider label="or" labelPosition="center" my="md" />

            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  showMessage({
                    title: "Google sign-up failed",
                    message:
                      "We couldn't complete Google registration. Please try again.",
                  })
                }
                text="signup_with"
                theme="filled_blue"
                shape="pill"
                size="large"
                width="300px"
              />

              <Text size="xs" c="dimmed">
                Or register securely via Google
              </Text>
            </Box>

            <Text ta="center" mt="xl">
              Already have an account?{" "}
              <Anchor
                component="button"
                fw={500}
                c="#4b3621"
                onClick={() => navigate("/login")}
              >
                Login here
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};
