interface AppLoadingScreenProps {
  progress: number;
  stage: string;
}

export function AppLoadingScreen({ progress, stage }: AppLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-base-content/60">Starting up</p>
            <h1 className="text-2xl font-black">Yarrtorio</h1>
          </div>
          <span className="loading loading-spinner loading-md" />
        </div>

        <progress
          className="progress progress-primary w-full"
          value={progress}
          max="100"
        />

        <div className="mt-3 flex items-center justify-between text-sm text-base-content/70">
          <span>{stage}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
