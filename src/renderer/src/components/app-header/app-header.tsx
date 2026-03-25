import { APP_NAME } from "@shared/constants";
import { useEffect, useState } from "react";
import { AppIcon } from "../app-icon";
import type { AppHeaderProps } from "./app-header.types";

export function AppHeader({ collapsed, onToggleSidebar }: AppHeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  return (
    <header className="card border-base-300/60 bg-base-100/80 border shadow-lg backdrop-blur">
      <div className="card-body flex min-h-20 flex-row items-center justify-between p-4 md:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="btn btn-ghost btn-square border-base-300/60 bg-base-100/70 border"
            onClick={onToggleSidebar}
            type="button"
          >
            <AppIcon className="h-5 w-5" name="Menu" strokeWidth={1.8} />
          </button>

          <div className="min-w-0">
            <p className="text-base-content/55 text-[0.65rem] font-semibold tracking-[0.32em] uppercase">
              Factorio Mod Downloader
            </p>
            <h1 className="truncate text-xl font-black tracking-tight md:text-2xl">
              {APP_NAME}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right leading-tight">
            <p className="text-base-content/55 text-xs font-semibold uppercase">
              {formattedDate}
            </p>
            <p className="text-base-content text-sm font-medium md:text-base">
              {formattedTime}
            </p>
          </div>

          <button
            aria-label="Notifications"
            className="btn btn-ghost btn-square border-base-300/60 bg-base-100/70 border"
            type="button"
          >
            <AppIcon className="h-5 w-5" name="Bell" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
