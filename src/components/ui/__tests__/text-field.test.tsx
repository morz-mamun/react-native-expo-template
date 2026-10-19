import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from '@/components/ui/text-field';

describe('textField', () => {
  it('shows the helper text when there is no error', async () => {
    await render(<TextField label="Email" helperText="We never share it." />);

    expect(screen.getByText('Email')).toBeOnTheScreen();
    expect(screen.getByText('We never share it.')).toBeOnTheScreen();
  });

  it('replaces the helper with the error and announces it', async () => {
    await render(<TextField label="Email" helperText="We never share it." error="Enter a valid email" />);

    expect(screen.queryByText('We never share it.')).not.toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('forwards typing to onChangeText', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Email" placeholder="you@example.com" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.co');

    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
  });
});
