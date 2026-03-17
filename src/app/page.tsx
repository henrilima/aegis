"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginComponent from "@/components/forms/Login";
import Loading from "@/components/Loading";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redireciona para o dashboard se o usuário já estiver autenticado
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 p-6 md:flex-row md:gap-16 md:p-0">
      <Image
        src="/images/version-control.png"
        alt="Version Control"
        width={460}
        height={460}
        className="max-lg:hidden"
        priority
      />
      <div className="max-w-lg w-lg text-center md:text-left">
        <LoginComponent />
      </div>
    </div>
  );
}
