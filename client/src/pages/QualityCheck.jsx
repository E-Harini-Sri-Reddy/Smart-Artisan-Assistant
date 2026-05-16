import React, { useState, useRef } from "react";
import { 
  Container, Title, Text, Button, Paper, Stack, Group, 
  ActionIcon, Image, Loader, Badge, RingProgress, List, ThemeIcon
} from "@mantine/core";
import { 
  IconCamera, IconArrowLeft, IconScan, IconCircleCheck, IconBulb, IconAlertCircle 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied");
    }
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setImage(canvasRef.current.toDataURL("image/jpeg"));
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  };

  const runQualityCheck = () => {
    setLoading(true);
    // Mocking n8n AI response
    setTimeout(() => {
      setResult({
        score: 75,
        status: "Good",
        color: "blue",
        suggestions: [
          "Smooth out the edges on the base for better stability.",
          "Apply a second coat of glaze to fix the uneven shine.",
          "Ensure the symmetrical alignment of the handles."
        ]
      });
      setLoading(false);
    }, 2500);
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
        <Paper withBorder p="xl" radius="lg" ta="center" onClick={startCamera} style={{ borderStyle: 'dashed', cursor: 'pointer' }}>
          <Stack align="center">
            <IconScan size={50} color="orange" />
            <Text fw={700}>Scan Product for Feedback</Text>
            <Text size="xs" c="dimmed">AI will rate your finish and suggest improvements</Text>
          </Stack>
        </Paper>
      )}

      {cameraActive && (
        <Stack>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '16px' }} />
          <Button color="orange" size="lg" radius="xl" onClick={capturePhoto} leftSection={<IconCamera size={20} />}>
            Capture for Analysis
          </Button>
          <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </Stack>
      )}

      {image && !loading && !result && (
        <Stack>
          <Image src={image} radius="md" />
          <Button color="orange" size="md" onClick={runQualityCheck}>Run AI Audit</Button>
          <Button variant="subtle" color="gray" onClick={() => {setImage(null); startCamera();}}>Retake</Button>
        </Stack>
      )}

      {loading && (
        <Paper p="xl" ta="center">
          <Loader color="orange" size="lg" />
          <Text mt="md" fw={600}>Analyzing textures and symmetry...</Text>
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
                sections={[{ value: result.score, color: result.color }]}
                label={
                  <Text ta="center" fw={900} size="xl">
                    {result.score/10}
                  </Text>
                }
              />
              <Stack gap={0}>
                <Text fw={700} size="lg">Quality Score</Text>
                <Badge color={result.color} variant="light">{result.status} Quality</Badge>
              </Stack>
            </Group>
          </Paper>

          <Paper withBorder p="lg" radius="lg" bg="var(--mantine-color-gray-0)">
            <Group mb="md">
              <IconBulb color="orange" />
              <Text fw={700}>Improvement Tips</Text>
            </Group>
            <List
              spacing="sm"
              size="sm"
              center
              icon={
                <ThemeIcon color="orange" size={20} radius="xl">
                  <IconCircleCheck size={12} />
                </ThemeIcon>
              }
            >
              {result.suggestions.map((tip, i) => (
                <List.Item key={i}>{tip}</List.Item>
              ))}
            </List>
          </Paper>
          
          <Button fullWidth variant="light" color="orange" onClick={() => {setResult(null); setImage(null);}}>
            Scan New Item
          </Button>
        </Stack>
      )}
    </Container>
  );
}