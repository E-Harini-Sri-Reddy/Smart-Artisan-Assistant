import { useEffect, useRef, useState } from "react";
import {
  Button,
  FileInput,
  Group,
  Modal,
  Stack,
  Text,
  Image,
  SimpleGrid,
} from "@mantine/core";
import { IconCamera, IconUpload } from "@tabler/icons-react";

/**
 * Upload from files and/or capture from device camera.
 * `value` is File | File[] | null depending on `multiple`.
 */
export function PhotoCaptureInput({
  label = "Photos",
  description,
  value,
  onChange,
  multiple = true,
  required = false,
  accept = "image/*",
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const files = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value]
      : [];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    const start = async () => {
      setCameraError("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(
          "Camera access was denied or is unavailable on this device.",
        );
      }
    };
    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen]);

  const emit = (nextFiles) => {
    if (multiple) onChange(nextFiles);
    else onChange(nextFiles[0] || null);
  };

  const handleFileChange = (selected) => {
    if (multiple) {
      const list = Array.isArray(selected) ? selected : selected ? [selected] : [];
      emit([...(files || []), ...list]);
    } else {
      onChange(selected || null);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return;
    const file = new File([blob], `camera-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    if (multiple) emit([...(files || []), file]);
    else onChange(file);
    setCameraOpen(false);
  };

  const removeAt = (index) => {
    const next = files.filter((_, i) => i !== index);
    emit(next);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {label}
        {required ? " *" : ""}
      </Text>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
      <Group grow align="flex-end">
        <FileInput
          placeholder="Choose file"
          accept={accept}
          multiple={multiple}
          leftSection={<IconUpload size={16} />}
          onChange={handleFileChange}
          clearable
        />
        <Button
          variant="light"
          color="#9c6238"
          leftSection={<IconCamera size={16} />}
          onClick={() => setCameraOpen(true)}
        >
          Take photo
        </Button>
      </Group>

      {files.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" mt="xs">
          {files.map((file, index) => (
            <Stack key={`${file.name}-${index}`} gap={4}>
              <Image
                src={URL.createObjectURL(file)}
                h={80}
                radius="md"
                fit="cover"
                alt={file.name}
              />
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => removeAt(index)}
              >
                Remove
              </Button>
            </Stack>
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Take a photo"
        centered
        radius="lg"
        size="lg"
      >
        <Stack>
          {cameraError ? (
            <Text c="red" size="sm">
              {cameraError}
            </Text>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                borderRadius: 12,
                background: "#111",
                minHeight: 240,
              }}
            />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCameraOpen(false)}>
              Cancel
            </Button>
            <Button
              color="#9c6238"
              leftSection={<IconCamera size={16} />}
              onClick={capturePhoto}
              disabled={Boolean(cameraError)}
            >
              Capture
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
