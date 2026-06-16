import HeroSlider from '../src/components/HeroSlider';
import Marquee from '../src/components/Marquee';
import SignatureStyles from '../src/components/SignatureStyles';
import LuxeCollection from '../src/components/LuxeCollection';
import Categories from '../src/components/Categories';
import StudioSection from '../src/components/StudioSection';
import BespokeForm from '../src/components/BespokeForm';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Marquee />
      <SignatureStyles />
      <Categories />
      <LuxeCollection />
      <BespokeForm />
      <StudioSection />
    </>
  );
}