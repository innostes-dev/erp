import { Button, EmptyState, IconTile } from '@innostes/ui';
import { Compass } from 'lucide-react';
import { Link } from '../context/NavigationContext';
import { paths } from '../navigation/routes';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        icon={
          <IconTile tone="neutral" size="lg">
            <Compass />
          </IconTile>
        }
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved. Check the address, or use search (Ctrl K) to find it."
        actions={
          <Button nativeButton={false} render={<Link href={paths.home} />}>
            Go to Home
          </Button>
        }
      />
    </div>
  );
}
