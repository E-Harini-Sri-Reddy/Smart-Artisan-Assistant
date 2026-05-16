import React, { useState, useRef } from "react";
import { 
  Container, Title, Text, Button, Paper, Stack, Group, 
  ActionIcon, Image, Loader, Badge, RingProgress, List, ThemeIcon
} from "@mantine/core";
import { 
  IconCamera, IconArrowLeft, IconScan, IconCircleCheck, IconBulb 
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const N8N_QC_WEBHOOK_URL = "https://grouped-creatable-facial.ngrok-free.dev/webhook-test/b646e309-ae45-4460-a93e-cff13f6388bc";

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
      alert("Camera access denied.");
    }
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setImage(canvasRef.current.toDataURL("image/jpeg"));
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
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
      console.log("Raw Response from n8n:", responseData); // Check your inspect console to see this!

      let textAnalysis = "";
      let numericalScoreVal = 5; // Default middle ground baseline if parsing fails

      if (Array.isArray(responseData) && responseData.length > 0) {
        // Strategy: Find the longest text string—that's always our analysis paragraph!
        let longestText = "";
        let detectedScore = "";

        responseData.forEach((item) => {
          if (item && item.output) {
            const currentStr = item.output.trim();
            if (currentStr.length > longestText.length) {
              // If we find a longer text, the previous longest text might have been a mistargeted score
              if (longestText && !isNaN(longestText)) detectedScore = longestText;
              longestText = currentStr;
            } else if (!isNaN(currentStr)) {
              detectedScore = currentStr;
            }
          }
        });

        textAnalysis = longestText;
        
        // If we found a dynamic digit score, parse it. Otherwise, look for any small number left behind.
        if (detectedScore) {
          numericalScoreVal = parseInt(detectedScore, 10);
        } else {
          // Alternative loop fallback to look for the element that ISN'T the long paragraph
          const scoreItem = responseData.find(item => item && item.output && item.output.trim() !== textAnalysis);
          if (scoreItem) {
            numericalScoreVal = parseInt(scoreItem.output.trim(), 10) || 5;
          }
        }
      } else if (responseData && responseData.output) {
        textAnalysis = responseData.output;
      }

      if (!textAnalysis) {
        throw new Error("Could not parse textual output from n8n response array.");
      }

      // Safeguard score between 1 and 10
      if (isNaN(numericalScoreVal)) numericalScoreVal = 5;
      const percentageRingValue = Math.min(Math.max(numericalScoreVal * 10, 0), 100);

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
        .map(line => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
        .filter(line => line.length > 0);

      setResult({
        percentageValue: percentageRingValue,
        displayScore: numericalScoreVal, 
        status: statusText,
        color: statusColor,
        suggestions: dynamicTips.length > 0 ? dynamicTips : [textAnalysis]
      });

    } catch (error) {
      console.error("Quality Check Processing Error Stack:", error);
      alert("Error parsing dynamic data. Check browser console.");
      
      // Changed fallback to 7 to easily tell if you are hitting the error catch block
      setResult({
        percentageValue: 70,
        displayScore: 7,
        status: "Good Quality",
        color: "blue",
        suggestions: [
          "Fallback Mode: Check your browser developer tools console to see why the response failed to parse natively."
        ]
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
                sections={[{ value: result.percentageValue, color: result.color }]}
                label={
                  <Text ta="center" fw={900} size="xl">
                    {result.displayScore}
                  </Text>
                }
              />
              <Stack gap={0}>
                <Text fw={700} size="lg">Quality Score</Text>
                <Badge color={result.color} variant="light">{result.status}</Badge>
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
          
          <Button fullWidth variant="light" color="orange" onClick={() => {setResult(null); setImage(null);}}>
            Scan New Item
          </Button>
        </Stack>
      )}
    </Container>
  );
}