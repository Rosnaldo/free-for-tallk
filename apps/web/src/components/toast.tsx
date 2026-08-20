import { toast as sonnerToast } from 'sonner';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react"

export const mytoast = Object.assign(
  (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    return sonnerToast(message, {
        ...options,
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
    });
  },
  {
    success: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
      sonnerToast.success('Sucesso!', {
        ...options,
        icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
        description: message,
        classNames: {
            title: '!text-green-600',
        },
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
      }),
    error: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
      sonnerToast.error('Erro:', {
        ...options,
        icon: <AlertCircleIcon className="w-5 h-5 text-red-600" />,
        description: message,
        classNames: {
            title: '!text-red-600',
        },
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
      }),
    warn: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
      sonnerToast.warning('Atenção:', {
        ...options,
        icon: <AlertTriangleIcon className="w-5 h-5 text-amber-400" />,
        description: message,
        classNames: {
            title: '!text-amber-400',
        },
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
      }),
    info: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
      sonnerToast.info(message, {
        ...options,
        cancel: {
            label: 'Cancelar',
            onClick: () => {},
        },
      }),
    loading: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
      sonnerToast.loading(message, {
        ...options,
      }),
    // copy other methods you need
    dismiss: sonnerToast.dismiss,
  }
);
