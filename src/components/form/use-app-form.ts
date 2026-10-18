import { createFormHook } from '@tanstack/react-form';

import { fieldContext, formContext } from '@/components/form/form-context';
import { FormSubmitButton } from '@/components/form/form-submit-button';
import { FormTextField } from '@/components/form/form-text-field';

/**
 * The app's form hook (TanStack Form + Zod via Standard Schema).
 *
 * @example
 * const form = useAppForm({
 *   defaultValues: { title: '' },
 *   validators: { onChange: schema },
 *   onSubmit: async ({ value }) => { … },
 * });
 * <form.AppField name="title">{field => <field.TextField label="Title" />}</form.AppField>
 * <form.AppForm><form.SubmitButton label="Save" /></form.AppForm>
 *
 * Add more bound inputs (Switch, Select, DatePicker…) to `fieldComponents`.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField: FormTextField },
  formComponents: { SubmitButton: FormSubmitButton },
});
