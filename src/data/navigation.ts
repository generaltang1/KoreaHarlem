export interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
}

/** 공개 헤더 메뉴 — 시안 라벨(STORE/MUSIC/…) · 기존 기능 경로 유지 */
export const navLinks: NavItem[] = [
  {
    label: "STORE",
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
      { label: "CD & VINYL", href: "/sale?category=cd" },
      { label: "Ticket", href: "/sale?category=ticket" },
    ],
  },
  {
    label: "MUSIC",
    children: [
      { label: "Music Home", href: "/music" },
      { label: "Artists", href: "/artists" },
    ],
  },
  { label: "THINK", href: "/think" },
  {
    label: "MAGAZINE",
    children: [
      { label: "떠돌이말", href: "/magazine" },
      { label: "전체 기사", href: "/magazine/all" },
    ],
  },
  {
    label: "HELP",
    children: [
      { label: "고객센터", href: "/contact" },
      { label: "이용안내", href: "/guide" },
      { label: "주문조회", href: "/order-inquiry" },
      { label: "About", href: "/about" },
    ],
  },
];

/** Footer In Store 링크 */
export const footerStoreLinks = [
  { label: "Shop All", href: "/sale" },
  { label: "Merch · Tops", href: "/sale?category=merch&sub=tops" },
  { label: "Merch · Bottoms", href: "/sale?category=merch&sub=bottoms" },
  { label: "Merch · Accessory", href: "/sale?category=merch&sub=accessory" },
  { label: "CD & VINYL", href: "/sale?category=cd" },
  { label: "Ticket", href: "/sale?category=ticket" },
];

export const footerMusicLinks = [
  { label: "Music", href: "/music" },
  { label: "Artists", href: "/artists" },
];

export const footerMagazineLinks = [
  { label: "떠돌이말", href: "/magazine" },
  { label: "전체 기사", href: "/magazine/all" },
];
