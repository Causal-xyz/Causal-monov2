import { APP_NAME } from "@causal/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground text-lg">
        Futarchy-based prediction market
      </p>
    </main>
  );
}
