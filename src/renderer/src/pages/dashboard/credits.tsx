import { AppMeta } from "@shared/types/app-meta";

interface CreditsProps {
  appMeta: AppMeta | null | undefined;
}

export function Credits({ appMeta }: CreditsProps) {
  return (
    <div className="card border border-dashed xl:col-span-3">
      <div className="card-body flex flex-col items-start justify-between gap-2 p-2 md:flex-row">
        <div className="text-xs text-base-content/70">
          <p>
            Original ps1 script by{" "}
            <span className="font-semibold text-base-content">
              Undefined8331, Zsoltzsozso828, & Photemy
            </span>
          </p>
          <p className="mt-1">
            Electron rewrite by{" "}
            <span className="font-semibold text-base-content">
              Zoard3945 (Auser)
            </span>
          </p>
        </div>
        <div className="text-xs text-base-content/70">
          <p>
            If you want to contribute, report a bug, or just say hi, message me
            on Discord: <span className="font-bold">zoard3945</span>
          </p>
          <p>
            Or join the discussion on our{" "}
            <a
              href="https://discord.gg/io-community-623884757268299786"
              className="font-semibold text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord Server
            </a>
          </p>
        </div>

        <div className="text-xs tracking-tight text-base-content/50 md:text-right">
          <p>{appMeta?.version ? `v${appMeta.version}` : "dev build"}</p>
        </div>
      </div>
    </div>
  );
}
