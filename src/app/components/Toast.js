import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const showToast = (message, type = 'success') => {
  toast(message, {
    type,
    position: 'top-center',
    autoClose: 3000,
    hideProgressBar: true,
    className: 'text-sm',
  });
};

const Toast = () => <ToastContainer />;

export default Toast;
