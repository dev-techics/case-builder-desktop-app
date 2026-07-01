import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

const PlansLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <ToastContainer
        position="top-center"
        hideProgressBar={true}
        className="text-sm"
        draggable
      />
    </>
  );
};

export default PlansLayout;
