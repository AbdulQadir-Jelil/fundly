/**
 * Fundly UI kit — barrel export.
 *
 * Screens import from `@/components/ui` so the internal file layout can
 * change without touching call sites.
 */

export { Button, ButtonLink, buttonClasses } from "@/components/ui/Button";
export type {
  ButtonProps,
  ButtonLinkProps,
  ButtonVariant,
  ButtonSize,
} from "@/components/ui/Button";

export { IconButton, IconLink } from "@/components/ui/IconButton";
export type {
  IconButtonProps,
  IconLinkProps,
  IconButtonSize,
  IconButtonVariant,
} from "@/components/ui/IconButton";

export { Field, Input, Select, Textarea, controlClasses } from "@/components/ui/Input";
export type {
  FieldProps,
  InputProps,
  SelectProps,
  SelectOption,
  TextareaProps,
} from "@/components/ui/Input";

export { AmountInput } from "@/components/ui/AmountInput";
export type { AmountInputProps } from "@/components/ui/AmountInput";

export { RadioGroup, Checkbox, Toggle } from "@/components/ui/Controls";
export type {
  RadioGroupProps,
  RadioOption,
  CheckboxProps,
  ToggleProps,
} from "@/components/ui/Controls";

export {
  Card,
  Badge,
  Avatar,
  ProgressBar,
  progressToneForPercent,
  Skeleton,
  SkeletonText,
  EmptyState,
} from "@/components/ui/Card";
export type {
  CardProps,
  BadgeProps,
  BadgeTone,
  AvatarProps,
  ProgressBarProps,
  EmptyStateProps,
} from "@/components/ui/Card";

export { Modal, ConfirmDialog } from "@/components/ui/Modal";
export type { ModalProps, ModalSize, ConfirmDialogProps } from "@/components/ui/Modal";

export { ToastProvider, useToast } from "@/components/ui/Toast";
export type { Toast, ToastTone } from "@/components/ui/Toast";

export { Segmented, FilterChip } from "@/components/ui/Segmented";
export type {
  SegmentedProps,
  SegmentedOption,
  FilterChipProps,
} from "@/components/ui/Segmented";