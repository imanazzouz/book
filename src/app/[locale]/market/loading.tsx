import { Container } from '@/components/ui/container';
import { CardGridSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function MarketLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <div className="mt-9 grid gap-8 lg:grid-cols-[17rem_1fr]">
        <Skeleton className="h-96 w-full" />
        <div>
          <Skeleton className="h-16 w-full" />
          <div className="mt-6">
            <CardGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </Container>
  );
}
