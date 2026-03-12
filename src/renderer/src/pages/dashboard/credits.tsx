import { AppMeta } from "@shared/types/app-meta";

interface CreditsProps {
  appMeta: AppMeta | null | undefined;
}

export function Credits({ appMeta }: CreditsProps) {
  return (
    <div className="card border border-dashed xl:col-span-3">
      <div className="card-body flex flex-col items-start justify-between gap-2 p-2 md:flex-row">
        <div className="text-base-content/70 text-xs">
          <p>
            Original ps1 script by{" "}
            <span className="text-base-content font-semibold">
              Undefined8331, Zsoltzsozso828, & Photemy
            </span>
          </p>
          <p className="mt-1">
            Electron rewrite by{" "}
            <span className="text-base-content font-semibold">
              Zoard3945 (Auser)
            </span>
          </p>
        </div>
        <div className="text-base-content/70 text-xs">
          <p>
            If you want to contribute, report a bug, or just say hi, message me
            on Discord: <span className="font-bold">zoard3945</span>
          </p>
          <p>
            Or join the discussion on our{" "}
            <a
              href="https://discord.gg/io-community-623884757268299786"
              className="text-primary font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord Server
            </a>
          </p>
        </div>

        <div className="text-base-content/50 text-xs tracking-tight md:text-right">
          <p>{appMeta?.version ? `v${appMeta.version}` : "dev build"}</p>
        </div>
      </div>
    </div>
  );
}
