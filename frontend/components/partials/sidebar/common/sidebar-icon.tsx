"use client";

import React from "react";
import { Icon } from "@iconify/react";

/**
 * Renders a sidebar icon that supports both:
 * - React component icons (SVG components from @/components/svg)
 * - Iconify string icons (e.g. "heroicons:currency-dollar")
 * - undefined/null (renders nothing)
 */
const SidebarIcon = ({
  icon,
  className,
}: {
  icon: React.ComponentType<{ className?: string }> | string | undefined | null;
  className?: string;
}) => {
  // Guard: icon is undefined or null
  if (!icon) {
    return null;
  }

  // Iconify string icon
  if (typeof icon === "string") {
    return <Icon icon={icon} className={className} />;
  }

  // React component icon (SVG component)
  const IconComponent = icon;
  return <IconComponent className={className} />;
};

export default SidebarIcon;
