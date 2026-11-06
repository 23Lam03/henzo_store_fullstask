import { Outlet } from 'react-router-dom';
import { Header } from '../../header/Header';
import { Footer } from '../../footer/Footer';
import { BackToTop } from '../../common/BackToTop';
import { usePageTitle } from '../../../hooks';
import './MainLayout.css';

export const MainLayout = () => {
  usePageTitle();
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout__content">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};
