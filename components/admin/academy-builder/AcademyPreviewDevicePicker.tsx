"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
  academyPreviewDevices,
  type AcademyPreviewDeviceId,
} from "@/lib/academy-preview-devices";

export default function AcademyPreviewDevicePicker({
  value,
  onChange,
}: {
  value: AcademyPreviewDeviceId;
  onChange: (device: AcademyPreviewDeviceId) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Preview device and orientation"
      className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-black/25 p-1"
    >
      {academyPreviewDevices.map((device) => {
        const Icon =
          device.icon === "monitor"
            ? Monitor
            : device.icon === "tablet"
              ? Tablet
              : Smartphone;
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onChange(device.id)}
            aria-label={`${device.label} preview, ${device.width} by ${device.height} pixels`}
            aria-pressed={value === device.id}
            title={`${device.label} · ${device.width} × ${device.height}`}
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-white ${value === device.id ? "bg-white text-[#18212B]" : "text-white/70 hover:bg-white/15 hover:text-white"}`}
          >
            <Icon
              size={19}
              className={device.id.endsWith("landscape") ? "rotate-90" : ""}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
