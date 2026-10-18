import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorToken } from '@/lib/theme/use-color-token';

function Backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.5} />;
}

type BottomSheetProps = Omit<BottomSheetModalProps, 'children' | 'onDismiss'> & {
  children: React.ReactNode;
  /** Controlled visibility — same API as Dialog. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Themed bottom sheet (@gorhom/bottom-sheet modal): sizes to its content by default,
 * tap-backdrop/swipe-down to close, keyboard-aware, bottom safe area respected.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Button onPress={() => setOpen(true)}><Text>Options</Text></Button>
 * <BottomSheet open={open} onOpenChange={setOpen}><Text>Content</Text></BottomSheet>
 */
function BottomSheet({ children, open, onOpenChange, ...props }: BottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open)
      ref.current?.present();
    else
      ref.current?.dismiss();
  }, [open]);

  const insets = useSafeAreaInsets();
  const background = useColorToken('--color-card');
  const handle = useColorToken('--color-muted-foreground');

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={() => onOpenChange(false)}
      enableDynamicSizing
      backdropComponent={Backdrop}
      backgroundStyle={{ backgroundColor: background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: handle, width: 36 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      {...props}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 16 }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

export { BottomSheet };
export type { BottomSheetProps };
