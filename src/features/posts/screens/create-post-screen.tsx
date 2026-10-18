import type { CreatePostInput } from '@/features/posts/types';
import { Stack, useRouter } from 'expo-router';

import { applyServerFieldErrors } from '@/components/form/form-utils';
import { useAppForm } from '@/components/form/use-app-form';
import { Screen } from '@/components/shared/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCreatePost } from '@/features/posts/api';
import { createPostSchema } from '@/features/posts/types';

const DEFAULT_VALUES: CreatePostInput = { title: '', body: '' };

export function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: createPostSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createPost.mutateAsync(createPostSchema.parse(value));
        router.back();
      }
      catch (error) {
        // Server validation errors land on their fields; anything else is toasted globally.
        applyServerFieldErrors(formApi, error);
      }
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Button variant="ghost" size="sm" haptic={false} onPress={() => router.back()}>
              <Text>Cancel</Text>
            </Button>
          ),
        }}
      />
      <Screen variant="keyboard" contentClassName="gap-5 p-4">
        <form.AppField name="title">
          {field => (
            <field.TextField label="Title" placeholder="What's it about?" autoFocus returnKeyType="next" maxLength={120} />
          )}
        </form.AppField>
        <form.AppField name="body">
          {field => (
            <field.TextField
              label="Post"
              placeholder="Share something…"
              multiline
              textAlignVertical="top"
              className="h-40 py-3"
              helperText="At least 10 characters."
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Publish" size="lg" />
        </form.AppForm>
      </Screen>
    </>
  );
}
