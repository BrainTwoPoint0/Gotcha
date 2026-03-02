'use client';

import { SpotlightCard } from '@/app/components/ui/aceternity/spotlight';
import { CardContent } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <SpotlightCard spotlightColor="rgba(148, 163, 184, 0.08)">
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
      </CardContent>
    </SpotlightCard>
  );
}
