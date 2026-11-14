import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import CinematicStory from "@/components/CinematicStory";
import StorySection from "@/components/sections/StorySection";
import SweetsSection from "@/components/sections/SweetsSection";
import ProductsSection from "@/components/sections/ProductsSection";
import TraditionSection from "@/components/sections/TraditionSection";
import SliceGame from "@/components/game/SliceGame";
import ContactSection from "@/components/sections/ContactSection";
import FinalSection from "@/components/FinalSection";

export default function Home() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <Navbar />
      <main>
        {/* The hero is the opening layer of the cinematic stage, so the
            hero → nature transition is one continuous, scroll-scrubbed shot. */}
        <CinematicStory />
        {/* …then the written sections the film has earned. */}
        <StorySection />
        <SweetsSection />
        <ProductsSection />
        <TraditionSection />
        {/* an interlude before the close: the brand's own slicing game */}
        <SliceGame />
        <ContactSection />
        <FinalSection />
      </main>
    </SmoothScroll>
  );
}
