export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

/** 공개 헤더 메뉴 — 순서: In Store → Music → Think → Magazine */
export const navLinks: NavItem[] = [
  {
    label: "In Store",
    children: [
      { label: "Shop All", href: "/sale" },
      {
        label: "Merch",
        children: [
          { label: "Tops", href: "/sale?category=merch&sub=tops" },
          { label: "Bottoms", href: "/sale?category=merch&sub=bottoms" },
          { label: "Accessory", href: "/sale?category=merch&sub=accessory" },
        ],
      },
      { label: "CD", href: "/sale?category=cd" },
      { label: "Ticket", href: "/sale?category=ticket" },
    ],
  },
  { label: "Music", href: "/artists" },
  { label: "Think", href: "/think" },
  {
    label: "Magazine",
    children: [
      { label: "Culture", href: "/magazine/culture" },
      { label: "News", href: "/magazine/news" },
    ],
  },
];

/** Footer In Store 링크 */
export const footerStoreLinks = [
  { label: "Shop All", href: "/sale" },
  { label: "Merch · Tops", href: "/sale?category=merch&sub=tops" },
  { label: "Merch · Bottoms", href: "/sale?category=merch&sub=bottoms" },
  { label: "Merch · Accessory", href: "/sale?category=merch&sub=accessory" },
  { label: "CD", href: "/sale?category=cd" },
  { label: "Ticket", href: "/sale?category=ticket" },
];

export const footerMusicLinks = [{ label: "Artists", href: "/artists" }];

export const footerMagazineLinks = [
  { label: "Culture", href: "/magazine/culture" },
  { label: "News", href: "/magazine/news" },
];
