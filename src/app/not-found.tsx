import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 p-6">
      <h1 className="text-6xl font-bold text-amber-500">404</h1>
      <p className="text-neutral-300">
        Ops... Parece que a página que você está tentando acessar não foi
        encontrada.
      </p>

      <Button
        variant="secondary"
        className="bg-amber-500 text-black hover:bg-amber-500 cursor-pointer font-bold mt-8"
        asChild
      >
        <Link href="/">Voltar a página inicial</Link>
      </Button>
    </div>
  );
}
