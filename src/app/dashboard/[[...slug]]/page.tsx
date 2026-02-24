import DashboardClient from "./DashboardClient";

export async function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ["users"] },
    { slug: ["passwords"] },
    { slug: ["habits"] },
    { slug: ["pomodoro"] },
    { slug: ["notes"] },
    { slug: ["currency"] },
    { slug: ["speedtest"] },
    { slug: ["hydration"] },
    { slug: ["settings"] },
    { slug: ["estudos"] },
    { slug: ["sono"] },
  ];
}

export default function Page() {
  return <DashboardClient />;
}
