import type { TextInput } from 'react-native';
import type { LoginInput } from '@/features/auth/types';
import { LogIn } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAppForm } from '@/components/form/use-app-form';
import { Screen } from '@/components/shared/screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PasswordToggle } from '@/features/auth/components/password-toggle';
import { useSession } from '@/features/auth/session-store';
import { loginSchema } from '@/features/auth/types';
import { toApiError } from '@/lib/api/errors';
import { Env } from '@/lib/env';

const DEFAULT_VALUES: LoginInput = { username: '', password: '' };
/** dummyjson demo account — shown only outside production. */
const DEMO_CREDENTIALS: LoginInput = { username: 'emilys', password: 'emilyspass' };

export function LoginScreen() {
  const signIn = useSession(state => state.signIn);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await signIn(loginSchema.parse(value));
        // No navigation needed: the session flips and Stack.Protected shows the app.
      }
      catch (error) {
        const apiError = toApiError(error);
        // Wrong credentials come back as 400/401 — show the server's message inline, keep inputs.
        setFormError(apiError.isClientError ? 'Incorrect username or password.' : apiError.message);
      }
    },
  });

  return (
    <Screen variant="keyboard" edges={['top', 'bottom']} contentClassName="flex-grow justify-center gap-8 p-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-2xl bg-primary">
          <Icon as={LogIn} className="size-8 text-primary-foreground" />
        </View>
        <Text variant="h2" className="text-center">Welcome back</Text>
        <Text variant="muted" className="text-center">
          Sign in to continue to
          {Env.APP_NAME}
        </Text>
      </View>

      <View className="gap-4">
        <form.AppField name="username">
          {field => (
            <field.TextField
              label="Username"
              placeholder="Your username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
              testID="login-username"
            />
          )}
        </form.AppField>

        <form.AppField name="password">
          {field => (
            <field.TextField
              ref={passwordRef}
              label="Password"
              placeholder="Your password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void form.handleSubmit()}
              trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />}
              testID="login-password"
            />
          )}
        </form.AppField>

        {formError && (
          <Text className="text-center text-sm text-destructive" role="alert" accessibilityLiveRegion="assertive">
            {formError}
          </Text>
        )}

        <form.AppForm>
          <form.SubmitButton label="Sign in" size="lg" testID="login-submit" />
        </form.AppForm>
      </View>

      {Env.APP_ENV !== 'production' && (
        <Pressable
          onPress={() => {
            form.setFieldValue('username', DEMO_CREDENTIALS.username);
            form.setFieldValue('password', DEMO_CREDENTIALS.password);
          }}
          role="button"
          className="items-center rounded-lg border border-dashed border-border p-3 active:bg-accent"
        >
          <Text variant="muted" className="text-center">
            Demo account:
            {' '}
            <Text className="font-mono text-sm">emilys / emilyspass</Text>
            {' '}
            — tap to fill
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}
