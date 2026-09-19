import { useEffect, useState } from 'react';
import { Bell, ShieldCheck } from 'lucide-react';

const getPermission = () => (
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
);

const NotificationOptInModal = () => {
  const [permission, setPermission] = useState(getPermission);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPermission(getPermission());
  }, []);

  if (permission === 'granted') return null;

  const handleEnable = async () => {
    if (typeof Notification === 'undefined') {
      setError('Push notifications are not supported by this browser.');
      return;
    }

    setRequesting(true);
    setError('');
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'denied') {
        setError('Notifications are blocked. Enable them in your browser settings to continue.');
      }
    } catch {
      setError('We could not request notification permission. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-opt-in-title"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <Bell className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="mt-6 text-center">
          <h2 id="notification-opt-in-title" className="text-2xl font-black text-slate-900">
            Enable ProTech notifications
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            ProTech requires browser notifications to deliver rent reminders, payment updates, and important lease notices on time.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-left">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-xs leading-5 text-slate-600">
            You can manage notification permissions later from your browser settings.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleEnable}
          disabled={requesting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {requesting ? 'Requesting permission...' : 'Enable Notifications'}
          {!requesting && <Bell className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};

export default NotificationOptInModal;
