'use client';

import React, { useState } from 'react';
import {
  Form,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Button,
  FormGrid,
  FormActions,
  toast,
} from '@innostes/ui';
import { FileCheck, Building2 } from 'lucide-react';

export default function PurchaseOrderHeaderDemo() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    setErrors({});

    // Simulate API delay and server-side validation
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitting(false);

    if (values.vendor === 'restricted') {
      setErrors({ vendor: 'Vendor account is currently under compliance audit.' });
      return;
    }

    toast.success('Purchase order created successfully', {
      description: `PO-2026-${Math.floor(1000 + Math.random() * 9000)} registered for Northwind Traders.`,
    });
  }

  return (
    <Form
      errors={errors}
      onFormSubmit={handleSubmit}
      className="not-prose w-full rounded-xl border border-border bg-card p-6 shadow-xs"
    >
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Create Purchase Order</h3>
          <p className="text-xs text-muted-foreground">Northwind Traders Pvt Ltd • Procurement Unit</p>
        </div>
      </div>

      <FormGrid columns={2} className="gap-4">
        <Field name="poNumber">
          <FieldLabel>PO identifier</FieldLabel>
          <Input defaultValue="PO-2026-0922" readOnly className="bg-muted font-mono" />
          <FieldDescription>Generated sequentially by the ERP kernel.</FieldDescription>
        </Field>

        <Field
          name="vendor"
          validate={(val) => (!val ? 'Select an approved vendor.' : null)}
        >
          <FieldLabel required>Supplier organisation</FieldLabel>
          <Select defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Select supplier..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hindustan-spares">Hindustan Industrial Spares</SelectItem>
              <SelectItem value="bharat-electricals">Bharat Electricals Ltd</SelectItem>
              <SelectItem value="karnataka-logistics">Karnataka Freight & Logistics</SelectItem>
              <SelectItem value="restricted">Apex Global Imports (Audit Flag)</SelectItem>
            </SelectContent>
          </Select>
          <FieldError match="customError" />
        </Field>

        <Field name="warehouse">
          <FieldLabel required>Destination depot</FieldLabel>
          <Select defaultValue="bengaluru-central">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bengaluru-central">Bengaluru Central Hub</SelectItem>
              <SelectItem value="whitefield-depot">Whitefield Distribution Center</SelectItem>
              <SelectItem value="peenya-industrial">Peenya Transit Depot</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field name="deliveryDate">
          <FieldLabel required>Required delivery date</FieldLabel>
          <Input type="date" required />
          <FieldError match="valueMissing">Delivery due date is mandatory.</FieldError>
        </Field>

        <div className="col-span-full">
          <Field name="procurementNotes">
            <FieldLabel>Special handling instructions</FieldLabel>
            <Textarea
              rows={3}
              placeholder="Specify pallet requirements, delivery bay gate, or GST invoice details..."
            />
            <FieldDescription>Optional delivery instructions for the receiving dock.</FieldDescription>
          </Field>
        </div>
      </FormGrid>

      <FormActions align="end" className="mt-6 border-t border-border pt-4">
        <Button variant="outline" type="button" onClick={() => setErrors({})}>
          Reset
        </Button>
        <Button variant="primary" type="submit" loading={submitting}>
          <FileCheck className="size-4 me-1.5" />
          Submit purchase order
        </Button>
      </FormActions>
    </Form>
  );
}
