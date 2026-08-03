"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
export default function CommunityAnalytics({ event = "community_view", category, topic }: { event?: string; category?: string; topic?: string }) {
  useEffect(() => { trackEvent(event, { community_category: category, community_topic: topic }); }, [event, category, topic]);
  return null;
}
