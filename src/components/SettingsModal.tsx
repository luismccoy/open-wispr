import React from "react";
import SidebarModal, { SidebarItem } from "./ui/SidebarModal";
import SimpleSettings from "./SimpleSettings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
}: SettingsModalProps) {
  // Simplified - single settings page
  const sidebarItems: SidebarItem<"settings">[] = [
    { id: "settings", label: "Settings", icon: () => <span>⚙️</span> },
  ];

  return (
    <SidebarModal<"settings">
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      sidebarItems={sidebarItems}
      activeSection="settings"
      onSectionChange={() => {}}
    >
      <SimpleSettings onClose={() => onOpenChange(false)} />
    </SidebarModal>
  );
}
