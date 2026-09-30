/**
 * Blueprint Chat Widget Wrapper
 * 
 * IMPORTANT: This widget ONLY shows when:
 * 1. CMS setting "blueprint_chat_enabled" = "true" 
 * 2. Backend has BLUEPACK_API_KEY configured
 * 
 * Without both conditions, this returns null (renders nothing)
 */

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// The actual BlueprintChatWidget component - dynamically loaded
const BlueprintChatWidget = dynamic(
  () => import("./BlueprintChatWidget").then((mod) => mod.BlueprintChatWidget),
  {
    ssr: false,
    loading: () => null,
  }
);

interface BlueprintChatWrapperProps {
  enabled?: boolean;
  accentColor?: string;
  defaultOpen?: boolean;
}

/**
 * BlueprintChatWrapper
 * 
 * Returns null if:
 * - CMS setting is false
 * - BluePack API is not configured
 * - API status check fails
 * 
 * Returns BlueprintChatWidget only when both conditions are met
 */
export function BlueprintChatWrapper({
  enabled: cmsEnabled = false,
  accentColor = "#67e8f9",
  defaultOpen = false,
}: BlueprintChatWrapperProps) {
  // Start with null (not rendering anything)
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // If CMS setting is false, never show
    if (!cmsEnabled) {
      console.log("[BlueprintChat] CMS disabled, not showing widget");
      setShouldRender(false);
      return;
    }

    // Check if BluePack API is configured
    const checkAPI = async () => {
      try {
        const response = await fetch("/api/ai/status");
        const data = await response.json();
        
        const apiEnabled = data?.data?.enabled === true;
        
        console.log("[BlueprintChat] CMS enabled:", cmsEnabled, "| API enabled:", apiEnabled);
        
        // Only show if BOTH are true
        setShouldRender(cmsEnabled && apiEnabled);
      } catch (error) {
        console.log("[BlueprintChat] API not available, not showing widget");
        setShouldRender(false);
      }
    };

    checkAPI();
  }, [cmsEnabled]);

  // Return null = renders nothing, widget won't appear
  if (!shouldRender) {
    return null;
  }

  // Only render the actual widget when conditions are met
  return (
    <BlueprintChatWidget
      enabled={true}
      accentColor={accentColor}
      defaultOpen={defaultOpen}
    />
  );
}

export default BlueprintChatWrapper;
