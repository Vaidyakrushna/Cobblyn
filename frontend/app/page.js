import HeroSlider from '../src/components/HeroSlider';
import Marquee from '../src/components/Marquee';
import SignatureStyles from '../src/components/SignatureStyles';
import CustomizationSection from '../src/components/CustomizationSection';
import LuxeCollection from '../src/components/LuxeCollection';
import AccessoriesSection from '../src/components/AccessoriesSection';
import StudioSection from '../src/components/StudioSection';
import BespokeForm from '../src/components/BespokeForm';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Marquee />
      <SignatureStyles />
      <CustomizationSection />
      <LuxeCollection />
      <BespokeForm />
      <AccessoriesSection />
      <StudioSection />
    </>
  );
}