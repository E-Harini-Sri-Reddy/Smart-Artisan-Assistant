import { useState } from "react";
import {
  Paper,
  Text,
  Title,
  Box,
  Anchor,
  TextInput,
  PasswordInput,
  Button,
  Divider,
  Modal,
  Group,
  Stack,
} from "@mantine/core";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messageModal, setMessageModal] = useState({
    opened: false,
    title: "",
    message: "",
    showRegister: false,
  });

  const showMessage = ({ title, message, showRegister = false }) => {
    setMessageModal({
      opened: true,
      title,
      message,
      showRegister,
    });
  };

  const closeMessage = () => {
    setMessageModal((prev) => ({ ...prev, opened: false }));
  };

  const persistSession = (data) => {
    localStorage.setItem("userInfo", JSON.stringify(data));
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const isMissingAccount = response.status === 404;
        showMessage({
          title: isMissingAccount ? "Account not found" : "Unable to sign in",
          message:
            data.message ||
            "We couldn't find an account with this email. Please register before signing in.",
          showRegister: isMissingAccount,
        });
        return;
      }
      persistSession(data);
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

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: credentialResponse.credential,
          mode: "login",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const isMissingAccount = response.status === 404;
        showMessage({
          title: isMissingAccount ? "Account not found" : "Unable to sign in",
          message:
            data.message ||
            "We couldn't find an account with this email. Please register before signing in.",
          showRegister: isMissingAccount,
        });
        return;
      }

      persistSession(data);
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
          <Group justify="flex-end" gap="sm">
            {messageModal.showRegister && (
              <Button
                variant="light"
                color="#9c6238"
                onClick={() => {
                  closeMessage();
                  navigate("/register");
                }}
              >
                Register
              </Button>
            )}
            <Button color="#9c6238" onClick={closeMessage}>
              OK
            </Button>
          </Group>
        </Stack>
      </Modal>

      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Login" className={classes.image} />
        </div>
        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Welcome Back!
            </Title>
            <Text c="dimmed" ta="center" mb="md">
              Sign in with email or Google
            </Text>

            <form onSubmit={handleEmailLogin}>
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
                placeholder="Your password"
                required
                mb="xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Text ta="right" size="sm" mb="md">
                <Anchor component={Link} to="/forgot-password" c="#4b3621" fw={500}>
                  Forgot password?
                </Anchor>
              </Text>
              <Button
                type="submit"
                fullWidth
                color="#9c6238"
                loading={loading}
                mb="md"
              >
                Login
              </Button>
            </form>

            <Divider label="or" labelPosition="center" my="md" />

            <Box style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() =>
                  showMessage({
                    title: "Google sign-in failed",
                    message:
                      "We couldn't complete Google sign-in. Please try again.",
                  })
                }
                useOneTap
                theme="filled_blue"
                shape="pill"
                width="300px"
              />
            </Box>

            <Text ta="center" mt="xl">
              Don&apos;t have an account?{" "}
              <Anchor
                component="button"
                fw={500}
                c="#4b3621"
                onClick={() => navigate("/register")}
              >
                Register here
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};
