import { Routes, Route } from 'react-router';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Demo from '@/pages/Demo';
import Traders from '@/pages/Traders';
import HowItWorks from '@/pages/HowItWorks';
import Pricing from '@/pages/Pricing';
import Risk from '@/pages/Risk';
import Faq from '@/pages/Faq';
import Placeholder from '@/pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="demo" element={<Demo />} />
        <Route path="traders" element={<Traders />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="risk" element={<Risk />} />
        <Route path="faq" element={<Faq />} />
        <Route path="*" element={<Placeholder label="404" title="Off the tape." />} />
      </Route>
    </Routes>
  );
}
