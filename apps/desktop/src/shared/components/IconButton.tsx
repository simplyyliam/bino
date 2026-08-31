import { Button, cn } from '@bino/ui';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { memo, type ComponentProps } from 'react';

interface IconButtonProps {
  Label?: string | number;
  Icon?: IconSvgElement;
  /** Lucide icon name — use this instead of `Icon` for lucide/dynamic icons. */
  iconName?: IconName;
  size?: number;
  onClick?: () => void;
  stretch?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  title?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}

export const IconButton = memo(function IconButton({
  Label,
  Icon,
  iconName,
  size,
  onClick,
  stretch = false,
  className,
  disabled,
  loading = false,
  ariaLabel,
  title,
  variant = 'outline',
}: IconButtonProps) {
  return (
    <Button
      size={!Label ? 'icon' : undefined}
      variant={variant}
      className={cn('flex items-center', stretch && 'flex-1', className)}
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
          {Icon && (
            <HugeiconsIcon
              icon={Icon}
              data-icon={Label ? 'inline-start' : undefined}
              aria-hidden="true"
              size={size}
            />
          )}
          {iconName && (
            <DynamicIcon
              name={iconName}
              data-icon={Label ? 'inline-start' : undefined}
              aria-hidden="true"
              size={size}
            />
          )}
        </>
      )}
      {Label && <span>{Label}</span>}
    </Button>
  );
});
