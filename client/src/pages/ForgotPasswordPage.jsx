import { useState } from "react";
import {
  Paper,
  Text,
  Title,
  TextInput,
  Button,
  Anchor,
} from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setDevToken(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(
        data.message ||
          "If an account with that email exists, a password reset link has been sent.",
      );
      if (data.resetToken) {
        setDevToken(data.resetToken);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Forgot password" className={classes.image} />
        </div>
        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Forgot Password
            </Title>
            <Text c="dimmed" ta="center" mb="md">
              Enter your email and we&apos;ll send reset instructions
            </Text>

            <form onSubmit={handleSubmit}>
              <TextInput
                label="Email"
                type="email"
                required
                mb="md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" fullWidth color="#9c6238" loading={loading}>
                Send Reset Link
              </Button>
            </form>

            {message && (
              <Text size="sm" mt="md" c="dimmed" ta="center">
                {message}
              </Text>
            )}

            {devToken && (
              <Text size="sm" mt="sm" ta="center">
                <Anchor
                  component={Link}
                  to={`/reset-password/${devToken}`}
                  c="#4b3621"
                  fw={500}
                >
                  Continue to reset password (dev)
                </Anchor>
              </Text>
            )}

            <Text ta="center" mt="xl">
              <Anchor
                component="button"
                fw={500}
                c="#4b3621"
                onClick={() => navigate("/login")}
              >
                Back to login
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};
