import { Button, cn } from '@bino/ui';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import type { LucideIcon } from 'lucide-react';
import { memo, type ComponentProps, type ReactNode } from 'react';

interface IconButtonProps {
  Label?: string | number;
  children?: ReactNode;
  /**
   * Accepts a Hugeicons icon, an imported lucide icon component, or a lucide
   * icon name (for data-driven/dynamic cases, e.g. an icon picker).
   */
  Icon?: IconSvgElement | LucideIcon | IconName;
  size?: number;
  onClick?: () => void;
  stretch?: boolean;
  rounded?: boolean
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  title?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}

export const IconButton = memo(function IconButton({
  Label,
  children,
  Icon,
  size,
  onClick,
  stretch = false,
  rounded = false,
  className,
  disabled,
  loading = false,
  ariaLabel,
  title,
  variant = 'outline',
}: IconButtonProps) {
  const content = children ?? Label;

  return (
    <Button
      size={!content ? 'icon' : undefined}
      variant={variant}
      className={cn('flex items-center', stretch && 'flex-1', rounded && 'rounded-full', className)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title}
    >
      {loading ? (
        // <Spinner data-icon="inline-start" />
        <span>loading</span>
      ) : (
        <>
          {Icon && (typeof Icon === 'string' ? (
            <DynamicIcon
              name={Icon}
              data-icon={content ? 'inline-start' : undefined}
              aria-hidden="true"
              size={size}
            />
          ) : Array.isArray(Icon) ? (
            <HugeiconsIcon
              icon={Icon}
              data-icon={content ? 'inline-start' : undefined}
              aria-hidden="true"
              size={size}
            />
          ) : (
            (() => {
              const LucideIconComponent = Icon as LucideIcon;
              return (
                <LucideIconComponent
                  data-icon={content ? 'inline-start' : undefined}
                  aria-hidden="true"
                  size={size}
                />
              );
            })()
          ))}
        </>
      )}
      {content && <span>{content}</span>}
    </Button>
  );
});