import DashboardClient from "./DashboardClient";

export async function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ["dictionary"] },
    { slug: ["users"] },
    { slug: ["passwords"] },
    { slug: ["habits"] },
    { slug: ["pomodoro"] },
    { slug: ["notes"] },
    { slug: ["currency"] },
    { slug: ["speedtest"] },
    { slug: ["hydration"] },
    { slug: ["settings"] },
    { slug: ["studies"] },
    { slug: ["sleep"] },
    { slug: ["calendar"] },
    { slug: ["statistics"] },
    { slug: ["reading"] },
    { slug: ["tasks"] },
    { slug: ["alarms"] },
    { slug: ["movies"] },
    { slug: ["flashcards"] },
    { slug: ["achievements"] },
  ];
}

export default function Page() {
  return <DashboardClient />;
}
