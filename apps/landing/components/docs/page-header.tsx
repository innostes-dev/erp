import { InstallCommand } from './install-command';
import { StatusBadge, type Status } from './status-badge';

export function PageHeader({
  title,
  description,
  status,
  summary,
  install,
}: {
  title: string;
  description?: string;
  status?: Status;
  summary?: string;
  install?: string;
}) {
  const hasAside = status || summary || install;
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-4xl font-bold tracking-tight text-fd-foreground md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-lg text-fd-muted-foreground">{description}</p>
        )}
      </div>
      {hasAside && (
        <div className="flex w-full shrink-0 flex-col items-start gap-3 md:w-72 md:items-end">
          {status && <StatusBadge status={status} />}
          {summary && (
            <p className="text-sm text-fd-muted-foreground md:text-right">
              {summary}
            </p>
          )}
          {install && <InstallCommand command={install} className="w-full" />}
        </div>
      )}
    </header>
  );
}
