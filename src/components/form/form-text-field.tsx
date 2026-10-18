import type { TextFieldProps } from '@/components/ui/text-field';
import { useFieldContext } from '@/components/form/form-context';
import { getFieldError } from '@/components/form/form-utils';
import { TextField } from '@/components/ui/text-field';

type FormTextFieldProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

/** `TextField` bound to the surrounding `form.AppField`. Use as `<field.TextField label="…" />`. */
export function FormTextField(props: FormTextFieldProps) {
  const field = useFieldContext<string>();

  return (
    <TextField
      value={field.state.value}
      onChangeText={(text) => {
        if (field.state.meta.errorMap.onServer)
          field.setMeta(prev => ({ ...prev, errorMap: { ...prev.errorMap, onServer: undefined } }));
        field.handleChange(text);
      }}
      onBlur={field.handleBlur}
      error={getFieldError(field)}
      {...props}
    />
  );
}
