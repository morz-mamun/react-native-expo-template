import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

describe('button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}><Text>Save</Text></Button>);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses and announces busy while loading', async () => {
    const onPress = jest.fn();
    await render(<Button loading onPress={onPress}><Text>Save</Text></Button>);

    const button = screen.getByRole('button');
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    // Label stays mounted (invisible) so the button keeps its width.
    expect(screen.getByText('Save')).toBeOnTheScreen();
  });

  it('ignores presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button disabled onPress={onPress}><Text>Save</Text></Button>);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
