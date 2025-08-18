import React, { useEffect } from 'react';
import FeaturedEvents from '../components/Home/FeaturedEvents';
import PopularNow from '../components/Home/PopularNow';
import UpcomingRacing from '../components/Home/UpcomingRacing';
import UpcomingSport from '../components/Home/UpcomingSport';
import { trackPageView } from '../utils/analytics';
const HomePage: React.FC = () => {
  useEffect(() => {
    // Track page view when component mounts
    trackPageView('Home');
  }, []);
  return <div className="bg-[#13294B] min-h-screen text-white p-4">
      <FeaturedEvents />
      <PopularNow />
      <UpcomingRacing />
      <UpcomingSport />
    </div>;
};
export default HomePage;