'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  PageHeader,
} from '@innostes/ui';
import { Download, Plus } from 'lucide-react';

export default function PageHeaderDemo() {
  return (
    <PageHeader
      className="w-full"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Sales</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Orders</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      title="Orders"
      description="Track, fulfil and refund customer orders."
      actions={
        <>
          <Button variant="outline" startIcon={<Download />}>
            Export
          </Button>
          <Button startIcon={<Plus />}>New order</Button>
        </>
      }
    />
  );
}
