import { createFormHookContexts } from '@tanstack/react-form';

/** Contexts that let bound field components read their field/form without props. */
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
