import { useCallback, useEffect, useRef } from 'react';
import { uid } from '../lib/format';
import type { AppNotification, NotificationKind, NotificationPrefs } from '../types';
import { useLocalStorage } from './useLocalStorage';

const LIMIT = 50;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  city: true,
  fx: true,
  payment: true,
  gringoTax: true,
  device: false,
};

/** Distribui o Omit por cada tipo da união (o Omit comum juntaria os campos) */
type WithoutMeta<T> = T extends unknown ? Omit<T, 'id' | 'createdAt' | 'read'> : never;
export type NewNotification = WithoutMeta<AppNotification>;

/** Tipos que o turista pode desligar; as boas-vindas sempre aparecem */
const PREF_OF: Partial<Record<NotificationKind, keyof NotificationPrefs>> = {
  city: 'city',
  fx: 'fx',
  payment: 'payment',
  gringoTax: 'gringoTax',
};

export type DeviceSupport = 'unsupported' | NotificationPermission;

export const deviceSupport = (): DeviceSupport => ('Notification' in window ? Notification.permission : 'unsupported');

/**
 * Caixa de notificações do app, guardada no aparelho.
 * `describe` transforma o aviso em texto no idioma atual (para a notificação do sistema).
 */
export function useNotifications(describe: (n: AppNotification) => { title: string; body: string }) {
  const [items, setItems] = useLocalStorage<AppNotification[]>('isfair:notifications', [
    { id: uid(), kind: 'welcome', createdAt: Date.now(), read: false },
  ]);
  const [prefs, setPrefs] = useLocalStorage<NotificationPrefs>('isfair:notify-prefs', DEFAULT_NOTIFICATION_PREFS);

  // push é chamado de dentro de efeitos: lê preferências e textos atuais sem mudar de identidade
  const latest = useRef({ prefs, describe });
  useEffect(() => {
    latest.current = { prefs, describe };
  });

  const showOnDevice = useCallback((n: AppNotification) => {
    if (deviceSupport() !== 'granted') return;
    const { title, body } = latest.current.describe(n);
    try {
      new Notification(title, { body, icon: '/icon-192.png', tag: n.id });
    } catch {
      // Chrome no Android só mostra notificação via service worker (vem com o PWA)
    }
  }, []);

  const push = useCallback(
    (data: NewNotification) => {
      const pref = PREF_OF[data.kind];
      const current = latest.current.prefs;
      if (pref && !current[pref]) return;
      const notification = { ...data, id: uid(), createdAt: Date.now(), read: false } as AppNotification;
      setItems((prev) => [notification, ...prev].slice(0, LIMIT));
      // Com o app aberto e à vista, o aviso dentro do app basta
      if (current.device && document.visibilityState === 'hidden') showOnDevice(notification);
    },
    [setItems, showOnDevice],
  );

  /** Liga as notificações do sistema: pede permissão e confirma com um aviso de teste. */
  const enableDevice = useCallback(async (): Promise<DeviceSupport> => {
    if (!('Notification' in window)) return 'unsupported';
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    setPrefs((prev) => ({ ...prev, device: permission === 'granted' }));
    if (permission === 'granted') {
      showOnDevice({ id: uid(), kind: 'welcome', createdAt: Date.now(), read: true });
    }
    return permission;
  }, [setPrefs, showOnDevice]);

  return {
    items,
    unread: items.filter((n) => !n.read).length,
    push,
    markRead: (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    markAllRead: () => setItems((prev) => prev.map((n) => ({ ...n, read: true }))),
    remove: (id: string) => setItems((prev) => prev.filter((n) => n.id !== id)),
    clear: () => setItems([]),
    prefs,
    setPref: (key: keyof NotificationPrefs, value: boolean) => setPrefs((prev) => ({ ...prev, [key]: value })),
    enableDevice,
  };
}

export type NotificationsApi = ReturnType<typeof useNotifications>;
