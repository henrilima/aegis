import { Spinner } from "./ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center gap-2">
      <Spinner className="size-16" />
      <p>Carregando...</p>
    </div>
  );
}
