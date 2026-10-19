/**
 * Minimal Reanimated mock for Jest: animations complete instantly, animated components are
 * plain React Native components, layout-animation builders are chainable no-ops.
 * Covers what this app uses; add exports here when you use more of Reanimated.
 */
import { FlatList, Image, ScrollView, Text, View } from 'react-native';

type AnyFn = (...args: any[]) => any;

/** `FadeIn.duration(200).delay(50).reduceMotion(…)` — every method returns the builder. */
function animationBuilder(): any {
  const builder: any = new Proxy(() => builder, {
    get: (_target, prop) => (prop === 'build' ? () => () => ({ initialValues: {}, animations: {} }) : () => builder),
  });
  return builder;
}

function makeSharedValue<T>(initial: T) {
  const sv = {
    value: initial,
    get: () => sv.value,
    set: (next: T | ((prev: T) => T)) => {
      sv.value = typeof next === 'function' ? (next as (prev: T) => T)(sv.value) : next;
    },
    modify: (fn: (prev: T) => T) => void (sv.value = fn(sv.value)),
    addListener: () => {},
    removeListener: () => {},
  };
  return sv;
}

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent: <C,>(component: C) => component,
};

export default Animated;
export const createAnimatedComponent = Animated.createAnimatedComponent;

// Hooks
export const useSharedValue = makeSharedValue;
export const useAnimatedStyle = (fn: AnyFn) => fn();
export const useAnimatedProps = (fn: AnyFn) => fn();
export const useDerivedValue = (fn: AnyFn) => makeSharedValue(fn());
export const useAnimatedRef = () => ({ current: null });
export const useAnimatedScrollHandler = () => () => {};
export function useAnimatedReaction() {}
export const useReducedMotion = () => false;
export const useEvent = () => () => {};

// Animations resolve to their target immediately
export function withTiming(toValue: unknown, _config?: unknown, callback?: AnyFn) {
  callback?.(true);
  return toValue;
}
export const withSpring = withTiming;
export const withDecay = (config: { velocity?: number }) => config.velocity ?? 0;
export const withDelay = (_delay: number, animation: unknown) => animation;
export const withRepeat = (animation: unknown) => animation;
export const withSequence = (...animations: unknown[]) => animations.at(-1);
export function cancelAnimation() {}

// Utilities
export const runOnJS = (fn: AnyFn) => fn;
export const runOnUI = (fn: AnyFn) => fn;
export const measure = () => null;
export function scrollTo() {}
export function interpolate(value: number, input: number[], output: number[]) {
  const [i0 = 0, i1 = 1] = input;
  const [o0 = 0, o1 = 1] = output;
  return o0 + ((value - i0) / (i1 - i0 || 1)) * (o1 - o0);
}
export const interpolateColor = (_value: number, _input: number[], output: unknown[]) => output[0];
export const Easing = new Proxy({}, { get: () => () => (t: number) => t });
export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' } as const;
export const ReduceMotion = { System: 'system', Always: 'always', Never: 'never' } as const;

// Layout animations
export const FadeIn = animationBuilder();
export const FadeOut = animationBuilder();
export const FadeInUp = animationBuilder();
export const FadeOutUp = animationBuilder();
export const FadeInDown = animationBuilder();
export const FadeOutDown = animationBuilder();
export const ZoomIn = animationBuilder();
export const ZoomOut = animationBuilder();
export const SlideInDown = animationBuilder();
export const SlideOutDown = animationBuilder();
export const LinearTransition = animationBuilder();
export const Layout = animationBuilder();
