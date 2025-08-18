import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BetSlip from '../Betting/BetSlip';
interface LayoutProps {
  children: ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  return <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
        <BetSlip />
      </div>
    </div>;
};
export default Layout;