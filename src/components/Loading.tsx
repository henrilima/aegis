import { Spinner } from "./ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2">
      <Spinner className="size-16" />
      <p>Carregando...</p>
    </div>
  );
}
