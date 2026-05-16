import React, { useState, useRef } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  Group,
  ActionIcon,
  Image,
  Loader,
  Badge,
  RingProgress,
  List,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCamera,
  IconArrowLeft,
  IconScan,
  IconCircleCheck,
  IconBulb,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const N8N_QC_WEBHOOK_URL =
  "https://grouped-creatable-facial.ngrok-free.dev/webhook/b646e309-ae45-4460-a93e-cff13f6388bc";

export function QualityCheck() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setImage(canvasRef.current.toDataURL("image/jpeg"));

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const runQualityCheck = async () => {
    if (!image) return alert("Please capture an image first!");

    setLoading(true);
    try {
      const imageBlob = dataURItoBlob(image);
      const formData = new FormData();
      formData.append("image", imageBlob, "artisan-product-qc.jpg");

      const response = await axios.post(N8N_QC_WEBHOOK_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const responseData = response.data;
      console.log("Raw Response from n8n:", responseData); 

      let textAnalysis = "";
      let numericalScoreVal = 5; 

      // FIXED PARSING ENGINE
      if (Array.isArray(responseData) && responseData.length > 0) {
        responseData.forEach((item) => {
          if (!item) return;

          // Dynamically check for either 'text' or 'output' keys
          const rawValue = item.text || item.output;
          if (!rawValue) return;

          const currentStr = String(rawValue).trim();

          // Check if the current value is a clean number
          if (!isNaN(currentStr) && currentStr !== "") {
            numericalScoreVal = parseInt(currentStr, 10);
          } else {
            textAnalysis = currentStr;
          }
        });
      } else if (responseData) {
        // Flat object fallback support
        textAnalysis = responseData.text || responseData.output || "";
        const fallbackScore = responseData.output || responseData.text;
        if (fallbackScore && !isNaN(String(fallbackScore).trim())) {
          numericalScoreVal = parseInt(String(fallbackScore).trim(), 10);
        }
      }

      if (!textAnalysis) {
        throw new Error(
          "Could not parse textual output from n8n response structure.",
        );
      }

      // Safeguard score between 1 and 10
      if (isNaN(numericalScoreVal)) numericalScoreVal = 5;
      const percentageRingValue = Math.min(
        Math.max(numericalScoreVal * 10, 0),
        100,
      );

      // Determine colors dynamically based on real parsed score
      let statusText = "Excellent Quality";
      let statusColor = "green";
      if (numericalScoreVal <= 4) {
        statusText = "Fair Finish";
        statusColor = "orange";
      } else if (numericalScoreVal <= 7) {
        statusText = "Good Quality";
        statusColor = "blue";
      }

      // Clean up layout presentation text lines
      const dynamicTips = textAnalysis
        .split("\n")
        .map((line) => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
        .filter((line) => line.length > 0);

      setResult({
        percentageValue: percentageRingValue,
        displayScore: numericalScoreVal,
        status: statusText,
        color: statusColor,
        suggestions: dynamicTips.length > 0 ? dynamicTips : [textAnalysis],
      });
    } catch (error) {
      console.error("Quality Check Processing Error Stack:", error);
      alert("Error parsing dynamic data. Check browser console.");

      setResult({
        percentageValue: 70,
        displayScore: 7,
        status: "Good Quality",
        color: "blue",
        suggestions: [
          "Fallback Mode: Check your browser developer tools console to see why the response failed to parse natively.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Group mb="xl">
        <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray">
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Title order={3}>AI Quality Check</Title>
      </Group>

      {!image && !cameraActive && (
        <Paper
          withBorder
          p="xl"
          radius="lg"
          ta="center"
          onClick={startCamera}
          style={{ borderStyle: "dashed", cursor: "pointer" }}
        >
          <Stack align="center">
            <IconScan size={50} color="orange" />
            <Text fw={700}>Scan Product for Feedback</Text>
            <Text size="xs" c="dimmed">
              AI will rate your finish and suggest improvements
            </Text>
          </Stack>
        </Paper>
      )}

      {cameraActive && (
        <Stack>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", borderRadius: "16px" }}
          />
          <Button
            color="orange"
            size="lg"
            radius="xl"
            onClick={capturePhoto}
            leftSection={<IconCamera size={20} />}
          >
            Capture for Analysis
          </Button>
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ display: "none" }}
          />
        </Stack>
      )}

      {image && !loading && !result && (
        <Stack>
          <Image src={image} radius="md" />
          <Button color="orange" size="md" onClick={runQualityCheck}>
            Run AI Audit
          </Button>
          <Button
            variant="subtle"
            color="gray"
            onClick={() => {
              setImage(null);
              startCamera();
            }}
          >
            Retake
          </Button>
        </Stack>
      )}

      {loading && (
        <Paper p="xl" ta="center">
          <Loader color="orange" size="lg" />
          <Text mt="md" fw={600}>
            Analyzing textures and symmetry...
          </Text>
        </Paper>
      )}

      {result && (
        <Stack>
          <Paper withBorder p="lg" radius="lg" shadow="sm">
            <Group justify="center">
              <RingProgress
                size={120}
                roundCaps
                thickness={12}
                sections={[
                  { value: result.percentageValue, color: result.color },
                ]}
                label={
                  <Text ta="center" fw={900} size="xl">
                    {result.displayScore}
                  </Text>
                }
              />
              <Stack gap={0}>
                <Text fw={700} size="lg">
                  Quality Score
                </Text>
                <Badge color={result.color} variant="light">
                  {result.status}
                </Badge>
              </Stack>
            </Group>
          </Paper>

          <Paper withBorder p="lg" radius="lg" bg="var(--mantine-color-gray-0)">
            <Group mb="md">
              <IconBulb color="orange" />
              <Text fw={700}>AI Observations & Tips</Text>
            </Group>
            <List
              spacing="sm"
              size="sm"
              center
              icon={
                <ThemeIcon color={result.color} size={20} radius="xl">
                  <IconCircleCheck size={12} />
                </ThemeIcon>
              }
            >
              {result.suggestions.map((tip, i) => (
                <List.Item key={i}>{tip}</List.Item>
              ))}
            </List>
          </Paper>

          <Button
            fullWidth
            variant="light"
            color="orange"
            onClick={() => {
              setResult(null);
              setImage(null);
            }}
          >
            Scan New Item
          </Button>
        </Stack>
      )}
    </Container>
  );
}