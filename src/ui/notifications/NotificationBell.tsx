import { Notifications } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useNotificationPanelStore } from '../../stores/useNotificationPanelStore';
import { useBrand } from '../../config/BrandProvider';
import { IconButton } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';

export interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Opens the in-app notification drawer; shows unread badge.
 */
export function NotificationBell({ className, size = 'md' }: NotificationBellProps) {
  const setOpen = useNotificationPanelStore((s) => s.setOpen);
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const unread = useNotificationStore((s) => s.items.filter((i) => !i.read).length);

  return (
    <>
      <IconButton
        size={size}
        className={cn('bg-surface-sunken hover:bg-surface-hover relative', className)}
        label={rtl ? 'الإشعارات' : 'Notifications'}
        onClick={() => setOpen(true)}
      >
        <Badge
          color="error"
          overlap="circular"
          variant={unread > 0 ? 'standard' : 'dot'}
          badgeContent={unread > 0 ? (unread > 99 ? '99+' : unread) : 0}
          invisible={unread === 0}
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 800,
              fontSize: '0.65rem',
              minWidth: 18,
              height: 18,
            },
          }}
        >
          <Notifications sx={{ fontSize: size === 'sm' ? 20 : 22 }} />
        </Badge>
      </IconButton>
    </>
  );
}
