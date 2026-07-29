import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { FeaturedWorks } from "@/components/home/FeaturedWorks";
import { PopularSection } from "@/components/home/PopularSection";
import { Collections } from "@/components/home/Collections";
import { CommunityFavorites } from "@/components/home/CommunityFavorites";
import { ArtistGallery } from "@/components/home/ArtistGallery";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedWorks />
        <PopularSection />
        <Collections />
        <CommunityFavorites />
        <ArtistGallery />
      </main>
      <Footer />
    </>
  );
}
