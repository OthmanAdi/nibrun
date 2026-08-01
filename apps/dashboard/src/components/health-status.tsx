import { useQuery } from '@tanstack/react-query';
import { healthQueryOptions } from '#queries/health.ts';

export function HealthStatus() {
  const { data, isError } = useQuery(healthQueryOptions);

  let dotColor = 'bg-gray-400';
  let label = 'checking…';
  if (isError) {
    dotColor = 'bg-red-500';
    label = 'unreachable';
  } else if (data) {
    dotColor = 'bg-green-500';
    label = `${data.status} · up ${Math.round(data.uptime)}s`;
  }

  return (
    <span className="flex items-center gap-2 text-gray-500 text-sm">
      <span className={`size-2 rounded-full ${dotColor}`} />
      API {label}
    </span>
  );
}
