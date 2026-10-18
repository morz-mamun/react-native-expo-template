import type { ButtonProps } from '@/components/ui/button';
import { useFormContext } from '@/components/form/form-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type SubmitButtonProps = Omit<ButtonProps, 'onPress' | 'loading' | 'children'> & { label: string };

/** Submits the surrounding form; shows loading while submitting. Use as `<form.SubmitButton label="Save" />`. */
export function FormSubmitButton({ label, ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={state => state.isSubmitting}>
      {isSubmitting => (
        <Button loading={isSubmitting} onPress={() => form.handleSubmit()} {...props}>
          <Text>{label}</Text>
        </Button>
      )}
    </form.Subscribe>
  );
}
