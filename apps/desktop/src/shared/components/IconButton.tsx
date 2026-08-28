import { Button, cn } from '@bino/ui';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import type { ComponentProps } from 'react';

interface IconButtonProps {
  Label?: string | number;
  Icon?: IconSvgElement;
  size?: number;
  onClick?: () => void;
  stretch?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  variant?: ComponentProps<typeof Button>['variant'];
}

export const IconButton = ({
  Label,
  Icon,
  size,
  onClick,
  stretch = false,
  className,
  disabled,
  loading = false,
  ariaLabel,
  variant = 'outline',
}: IconButtonProps) => {
  return (
    <Button
      size={!Label ? 'icon' : undefined}
      variant={variant}
      className={cn('flex items-center', stretch && 'flex-1', className)}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {loading ? (
        // <Spinner data-icon="inline-start" />
        <span>loading</span>
      ) : (
        Icon && (
          <HugeiconsIcon
            icon={Icon}
            data-icon={Label ? 'inline-start' : undefined}
            aria-hidden="true"
            size={size}
          />
        )
      )}

      {Label && <span>{Label}</span>}
    </Button>
  );
};
