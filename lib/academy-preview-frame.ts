import { academyPreviewDevices, type AcademyPreviewDeviceId } from "./academy-preview-devices.ts";

export function academyPreviewFrame(deviceId: AcademyPreviewDeviceId, availableWidth: number, availableHeight: number) {
  const device = academyPreviewDevices.find((item) => item.id === deviceId)!;
  const tablet = device.icon === "tablet";
  const inset = tablet ? 48 : device.icon === "phone" ? 12 : 0;
  const width = device.width + inset * 2;
  const height = device.height + inset * 2;
  return { device, inset, width, height, radius: tablet ? 56 : device.icon === "phone" ? 36 : 8,
    scale: Math.min(1, Math.max(1, availableWidth - 32) / width, Math.max(1, availableHeight - 64) / height) };
}
