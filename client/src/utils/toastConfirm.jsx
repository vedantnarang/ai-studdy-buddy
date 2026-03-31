import toast from 'react-hot-toast';

export const toastConfirm = (message) => {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-xl mt-0.5">
              warning
            </span>
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-snug flex-1">
              {message}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-xl transition-colors shadow-sm"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Keep open until user interaction
        position: 'top-center',
        style: {
          padding: '16px',
          borderRadius: '16px',
        },
      }
    );
  });
};
