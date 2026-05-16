import React, { useState } from "react";
import { Paper, Text, TextInput, Title, SegmentedControl, Box, Anchor } from "@mantine/core";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("artisan");
  const [organizationName, setOrganizationName] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    if (role === "organization" && !organizationName.trim()) {
      alert("Please enter your Organization Name before continuing with Google.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: credentialResponse.credential,
          role,
          organizationName: role === "organization" ? organizationName : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data));
        // Use window.location to force a state refresh across the app
        window.location.href = "/"; 
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      alert("Server error during Google Authentication");
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Register" className={classes.image} />
        </div>

        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>Join Assistant</Title>
            
            <Text size="sm" fw={500} mb={5}>I want to register as:</Text>
            <SegmentedControl
              fullWidth
              mb="xl"
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
                mb="md"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            )}

            <Box mt="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert("Google Login Failed")}
                text="signup_with"
                theme="filled_blue"
                shape="pill"
                size="large"
                width="300px"
              />
              
              <Text size="xs" c="dimmed">
                One-click secure registration via Google
              </Text>
            </Box>

            <Text ta="center" mt="xl">
              Already have an account?{" "}
              <Anchor component="button" fw={500} c="#4b3621" onClick={() => navigate("/login")}>
                Login here
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};