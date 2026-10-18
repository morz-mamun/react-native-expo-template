# Forms

Forms use **TanStack Form v1** with **Zod** schemas (via Standard Schema), composed with `createFormHook`. Screens never wire `value`, `onChange`, `onBlur` or error props by hand. Bound field components do that.

| File | Role |
| --- | --- |
| [`src/components/form/use-app-form.ts`](../src/components/form/use-app-form.ts) | `useAppForm` / `withForm`: the app's form hook with registered field and form components |
| [`src/components/form/form-text-field.tsx`](../src/components/form/form-text-field.tsx) | `field.TextField`: `TextField` bound to the current field |
| [`src/components/form/form-submit-button.tsx`](../src/components/form/form-submit-button.tsx) | `form.SubmitButton`: submits, with a loading state |
| [`src/components/form/form-utils.ts`](../src/components/form/form-utils.ts) | `getFieldError`, `applyServerFieldErrors` |

## A complete form

From [`create-post-screen.tsx`](../src/features/posts/screens/create-post-screen.tsx):

```tsx
const createPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  body: z.string().trim().min(10, 'Write at least 10 characters'),
});

export function CreatePostScreen() {
  const createPost = useCreatePost();

  const form = useAppForm({
    defaultValues: { title: '', body: '' },
    validators: { onChange: createPostSchema }, // client-side rules = the Zod schema
    onSubmit: async ({ value, formApi }) => {
      try {
        await createPost.mutateAsync(createPostSchema.parse(value)); // parse → trimmed values
        router.back();
      }
      catch (error) {
        applyServerFieldErrors(formApi, error); // "title already exists" → under the title field
      }
    },
  });

  return (
    <Screen variant="keyboard">
      <form.AppField name="title">
        {field => <field.TextField label="Title" autoFocus />}
      </form.AppField>
      <form.AppField name="body">
        {field => <field.TextField label="Post" multiline className="h-40 py-3" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label="Publish" />
      </form.AppForm>
    </Screen>
  );
}
```

- **Field names are type-checked** against `defaultValues`, so `name="titel"` is a compile error.
- **Errors appear after the user touches a field or tries to submit.** A fresh form isn't covered in red.
- **The submit button** shows a spinner while `onSubmit` runs and ignores double taps.
- **`<Screen variant="keyboard">`** keeps the focused field above the keyboard.

## Server-side validation errors

When the API rejects input (400/422), `ApiError.fieldErrors` holds `{ field: ['message'] }`. `applyServerFieldErrors(formApi, error)` puts each message under its field and returns `true` if any matched. A server error clears as soon as the user edits that field. Errors that don't belong to a field are shown by the global mutation toast (`meta.errorMessage`).

## Validation timing

| Option | When it runs | Good for |
| --- | --- | --- |
| `validators: { onChange: schema }` | Every change (shown after touch) | Most forms (default) |
| `validators: { onBlur: schema }` | When leaving a field | Long forms, expensive rules |
| `validators: { onSubmit: schema }` | Only on submit | Very short forms |
| Field-level `validators={{ onChangeAsync, onChangeAsyncDebounceMs: 400 }}` | Async, debounced | "Username available?" checks |

## Adding a new bound input

1. Create `src/components/form/form-<input>.tsx`. Read the field with `useFieldContext<T>()` and use `getFieldError(field)` for the error. `form-text-field.tsx` is the template.
2. Register it in `fieldComponents` in `use-app-form.ts`.
3. Use it as `<form.AppField name="x">{field => <field.YourInput />}</form.AppField>`.

Typical additions are Switch, Select/Picker, DatePicker and OTP input.

## Splitting large forms

Use `withForm` to move sections of a big form into their own components while keeping full type safety. See the [TanStack Form composition guide](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition).
