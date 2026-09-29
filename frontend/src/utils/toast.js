import { toast } from 'vue3-toastify';

/**
 * Servicio global de Notificaciones Flotantes (Toasts)
 * Muestra alertas animadas que se deslizan desde la esquina superior derecha.
 */
export const showToast = {
  success(message, options = {}) {
    return toast.success(message, {
      autoClose: 3500,
      position: 'top-right',
      transition: 'slide',
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      ...options
    });
  },
  error(message, options = {}) {
    return toast.error(message, {
      autoClose: 4500,
      position: 'top-right',
      transition: 'slide',
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      ...options
    });
  },
  warning(message, options = {}) {
    return toast.warning(message, {
      autoClose: 4000,
      position: 'top-right',
      transition: 'slide',
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      ...options
    });
  },
  info(message, options = {}) {
    return toast.info(message, {
      autoClose: 3500,
      position: 'top-right',
      transition: 'slide',
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      ...options
    });
  }
};

export default showToast;
