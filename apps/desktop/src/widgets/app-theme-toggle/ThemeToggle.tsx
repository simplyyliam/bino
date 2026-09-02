
import { IconButton } from '@/shared/components';
import { useTheme, type Theme } from '@/theme/theme-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@bino/ui/components/ui/dropdown-menu';
import {
  LaptopIcon,
  Moon02Icon,
  Sun03Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

const themes: Array<{ label: string; value: Theme; icon: IconSvgElement }> = [
  { label: 'Light', value: 'light', icon: Sun03Icon },
  { label: 'Dark', value: 'dark', icon: Moon02Icon },
  { label: 'System', value: 'system', icon: LaptopIcon },
];

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            Icon={resolvedTheme === 'dark' ? Moon02Icon : Sun03Icon}
            ariaLabel="Change color theme"
            rounded
            variant={compact ? 'ghost' : 'outline'}
            className={compact ? 'size-8 border border-sidebar-border' : undefined}
          />
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          {themes.map(({ label, value, icon }) => (
            <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
              <HugeiconsIcon icon={icon} aria-hidden="true" />
              <span>{label}</span>
              {theme === value && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  className="ms-auto"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
