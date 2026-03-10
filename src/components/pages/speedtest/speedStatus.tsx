interface SpeedStatusProps {
  status: string;
  error?: string;
}

export function SpeedStatus({ status, error }: SpeedStatusProps) {
  return (
    <div className="space-y-2">
      <p className="text-lg text-center">
        <span className="font-bold">Status:</span> {status}
      </p>
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
    </div>
  );
}
