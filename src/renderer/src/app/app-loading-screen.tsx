interface AppLoadingScreenProps {
  progress: number;
  stage: string;
}

export function AppLoadingScreen({ progress, stage }: AppLoadingScreenProps) {
  return (
    <div className="bg-base-200 flex min-h-screen items-center justify-center px-6">
      <div className="border-base-300 bg-base-100 w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-base-content/60 text-sm">Starting up</p>
            <h1 className="text-2xl font-black">Yarrtorio</h1>
          </div>
          <span className="loading loading-spinner loading-md" />
        </div>

        <progress
          className="progress progress-primary w-full"
          value={progress}
          max="100"
        />

        <div className="text-base-content/70 mt-3 flex items-center justify-between text-sm">
          <span>{stage}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
