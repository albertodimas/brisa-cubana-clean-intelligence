import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="px-6 py-16 max-w-5xl mx-auto">
      <header className="flex flex-col gap-2 mb-12">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-12 w-full max-w-3xl" />
        <Skeleton className="h-6 w-full max-w-2xl mt-2" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </header>

      <section className="grid gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </Card>
        ))}
      </section>

      <section className="grid gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        ))}
      </section>
    </main>
  );
}
