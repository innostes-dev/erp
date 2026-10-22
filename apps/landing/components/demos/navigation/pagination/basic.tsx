'use client';

import { useState } from 'react';
import { Pagination } from '@innostes/ui';

export default function PaginationDemo() {
  const [page, setPage] = useState(6);

  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination page={page} pageCount={20} onPageChange={setPage} />
      <p className="text-sm text-muted-foreground">Page {page} of 20</p>
    </div>
  );
}
