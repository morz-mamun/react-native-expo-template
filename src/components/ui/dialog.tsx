import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

import { Icon } from '@/components/ui/icon';
import { MAX_FONT_SCALE } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Centered modal dialog (RNR, native-only animations). Rendered through the root PortalHost.
 *
 * @example
 * <Dialog>
 *   <DialogTrigger asChild><Button><Text>Open</Text></Button></DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader><DialogTitle>Title</DialogTitle><DialogDescription>…</DialogDescription></DialogHeader>
 *     <DialogFooter><DialogClose asChild><Button><Text>OK</Text></Button></DialogClose></DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * For a destructive confirmation, prefer `Alert.alert` (fully native) or this Dialog with a
 * `destructive` Button.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// iOS: render above native modals/sheets too.
const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function DialogOverlay({ className, children, ...props }: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, 'asChild'> & { children?: React.ReactNode }) {
  return (
    <FullWindowOverlay>
      <DialogPrimitive.Overlay className={cn('absolute inset-0 z-50 items-center justify-center p-4', className)} {...props}>
        <Animated.View
          entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.System)}
          className="absolute inset-0 bg-black/50"
        />
        {/* Tapping the dimmed backdrop closes the dialog (Overlay handles the press). */}
        {children}
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

function DialogContent({ className, portalHost, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { portalHost?: string }) {
  return (
    <DialogPortal hostName={portalHost}>
      <DialogOverlay>
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(220).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
          className="w-full max-w-md"
        >
          <DialogPrimitive.Content
            className={cn('z-50 w-full gap-4 rounded-2xl border border-border bg-popover p-6', className)}
            {...props}
          >
            {children}
            <DialogPrimitive.Close
              className="absolute right-3 top-3 size-11 items-center justify-center rounded-full active:bg-accent"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <Icon as={X} className="size-5 text-muted-foreground" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </Animated.View>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-2 pr-8', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex-col-reverse gap-2', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-sans text-lg font-semibold text-popover-foreground', className)}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('font-sans text-sm text-muted-foreground', className)}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...props}
    />
  );
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
