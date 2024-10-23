import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export const showToast = (message, type = 'success') => {
  const icon = type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />;
  
  toast(message, {
    icon,
    type,
    position: 'top-center',
    autoClose: 2000,
    hideProgressBar: true,
  });
};

const Toast = () => <ToastContainer />;

export default Toast;
