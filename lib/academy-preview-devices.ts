export const academyPreviewDevices = [
  {
    id: "desktop",
    label: "Desktop or laptop",
    width: 1280,
    height: 800,
    icon: "monitor",
  },
  {
    id: "tablet-portrait",
    label: "Tablet portrait",
    width: 768,
    height: 1024,
    icon: "tablet",
  },
  {
    id: "tablet-landscape",
    label: "Tablet landscape",
    width: 1024,
    height: 768,
    icon: "tablet",
  },
  {
    id: "phone-portrait",
    label: "Phone portrait",
    width: 390,
    height: 844,
    icon: "phone",
  },
  {
    id: "phone-landscape",
    label: "Phone landscape",
    width: 844,
    height: 390,
    icon: "phone",
  },
] as const;

export type AcademyPreviewDeviceId =
  (typeof academyPreviewDevices)[number]["id"];
