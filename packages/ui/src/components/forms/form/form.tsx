'use client';

import { forwardRef } from 'react';
import { Form as BaseForm } from '@base-ui/react/form';
import { mergeClassName } from '../../../lib/merge-class-name';

export type FormProps = BaseForm.Props;

/**
 * A native `<form>` that works with `Field` validation. Pass server-side errors through
 * `errors` (keyed by field `name`) and they show in the matching `FieldError`.
 * Use `onFormSubmit` to receive the values as an object.
 *
 * @example
 * <Form errors={serverErrors} onFormSubmit={(values) => save(values)}>
 *   <Field name="username">
 *     <FieldLabel>Username</FieldLabel>
 *     <Input required />
 *     <FieldError />
 *   </Field>
 *   <Button type="submit">Save</Button>
 * </Form>
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  { className, ...props },
  ref,
) {
  return (
    <BaseForm
      ref={ref}
      data-slot="form"
      className={mergeClassName('flex flex-col gap-5', className)}
      {...props}
    />
  );
});
