import * as LucideIcons from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

export type AppIconName = keyof typeof LucideIcons;

interface AppIconProps extends Omit<LucideProps, "ref"> {
  name: AppIconName;
}

export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = LucideIcons[name] as LucideIcon | undefined;

  if (!Icon) {
    return null;
  }

  return <Icon aria-hidden="true" {...props} />;
}
