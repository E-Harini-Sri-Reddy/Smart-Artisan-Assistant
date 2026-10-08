import { useState } from "react";
import {
  Paper,
  Text,
  Title,
  PasswordInput,
  Button,
  Anchor,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Reset failed");
        return;
      }
      localStorage.setItem("userInfo", JSON.stringify(data));
      window.location.href = "/";
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Reset password" className={classes.image} />
        </div>
        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Reset Password
            </Title>
            <Text c="dimmed" ta="center" mb="md">
              Choose a new password for your account
            </Text>

            <form onSubmit={handleSubmit}>
              <PasswordInput
                label="New Password"
                required
                mb="md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordInput
                label="Confirm Password"
                required
                mb="md"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button type="submit" fullWidth color="#9c6238" loading={loading}>
                Reset Password
              </Button>
            </form>

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
