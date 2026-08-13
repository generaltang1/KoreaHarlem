export type Category = "music" | "visual" | "performance" | "literature";

export interface Work {
  id: string;
  title: string;
  artist: string;
  category: Category;
  price?: string;
  salePrice?: string;
  image: string;
  featured?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

export const featuredWorks: Work[] = [
  {
    id: "1",
    title: "Midnight in Harlem",
    artist: "Kim Min-jun",
    category: "music",
    price: "₩45,000",
    image: "from-violet-900 via-purple-800 to-indigo-950",
    featured: true,
  },
  {
    id: "2",
    title: "Seoul Echoes",
    artist: "Park So-yeon",
    category: "visual",
    price: "₩120,000",
    image: "from-amber-900 via-orange-800 to-red-950",
    featured: true,
  },
  {
    id: "3",
    title: "Crossing Bridges",
    artist: "Lee Jae-ho",
    category: "performance",
    price: "₩65,000",
    salePrice: "₩45,000",
    image: "from-teal-900 via-cyan-800 to-blue-950",
    featured: true,
  },
  {
    id: "4",
    title: "Letters from Busan",
    artist: "Choi Hana",
    category: "literature",
    price: "₩28,000",
    image: "from-stone-700 via-stone-600 to-stone-800",
    featured: true,
  },
  {
    id: "5",
    title: "Neon Dreams",
    artist: "Yoon Tae-woo",
    category: "visual",
    price: "₩95,000",
    image: "from-pink-900 via-rose-800 to-fuchsia-950",
    featured: true,
  },
  {
    id: "6",
    title: "Jazz & Hanok",
    artist: "Han Soo-jin",
    category: "music",
    price: "₩38,000",
    image: "from-emerald-900 via-green-800 to-teal-950",
    featured: true,
  },
];

export const popularWorks: Work[] = featuredWorks.slice(0, 4);

export const collections: Collection[] = [
  {
    id: "music",
    title: "음악",
    subtitle: "MUSIC",
    href: "/artists",
    image: "from-violet-950 to-black",
  },
  {
    id: "visual",
    title: "시각 예술",
    subtitle: "VISUAL ARTS",
    href: "/works?category=visual",
    image: "from-amber-950 to-black",
  },
  {
    id: "performance",
    title: "공연",
    subtitle: "PERFORMANCE",
    href: "/works?category=performance",
    image: "from-teal-950 to-black",
  },
  {
    id: "literature",
    title: "문학",
    subtitle: "LITERATURE",
    href: "/works?category=literature",
    image: "from-stone-800 to-black",
  },
];

export const galleryWorks: Work[] = [
  {
    id: "g1",
    title: "Urban Canvas",
    artist: "Kim Min-jun",
    category: "visual",
    image: "from-slate-800 to-zinc-900",
  },
  {
    id: "g2",
    title: "Live at Apollo",
    artist: "Han Soo-jin",
    category: "music",
    image: "from-red-950 to-black",
  },
  {
    id: "g3",
    title: "Movement Study",
    artist: "Lee Jae-ho",
    category: "performance",
    image: "from-blue-950 to-black",
  },
  {
    id: "g4",
    title: "Poetry Night",
    artist: "Choi Hana",
    category: "literature",
    image: "from-amber-950 to-black",
  },
  {
    id: "g5",
    title: "Color Field",
    artist: "Park So-yeon",
    category: "visual",
    image: "from-purple-950 to-black",
  },
  {
    id: "g6",
    title: "Street Symphony",
    artist: "Yoon Tae-woo",
    category: "music",
    image: "from-emerald-950 to-black",
  },
  {
    id: "g7",
    title: "Harlem Nights",
    artist: "Kim Min-jun",
    category: "performance",
    image: "from-orange-950 to-black",
  },
  {
    id: "g8",
    title: "Ink & Rhythm",
    artist: "Choi Hana",
    category: "literature",
    image: "from-neutral-800 to-black",
  },
];

export const categoryLabels: Record<Category, string> = {
  music: "음악",
  visual: "시각 예술",
  performance: "공연",
  literature: "문학",
};
