import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const pillars = [
  {
    title: "STORE",
    body: "굿즈 · CD · 파티 티켓",
    href: "/sale",
  },
  {
    title: "코리아할렘 셀렉츠",
    body: "아티스트 앨범 아카이브 · DJ SET",
    href: "/music",
  },
  {
    title: "Kulture · 떠돌이말",
    body: "음악 패션 미술 타투 · 해시태그 게시판",
    href: "/magazine/culture",
  },
  {
    title: "THINK",
    body: "누구나 쓰는 생각 게시판",
    href: "/think",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="relative min-h-[70vh] overflow-hidden bg-[#0a0a0a] text-neutral-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 15%, rgba(30,41,59,0.45), transparent 70%), radial-gradient(ellipse 40% 30% at 80% 60%, rgba(25,20,35,0.4), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-[1120px] px-4 py-16 sm:px-8 sm:py-20">
          <p className="text-[11px] font-medium tracking-wide text-[#FEE500]">소개</p>
          <h1 className="mt-6 max-w-4xl font-black uppercase leading-none tracking-tight text-[#f4f1ea] text-[clamp(2.4rem,7vw,4.5rem)]">
            Recording Korean Culture
            <br />
            And.. Its Phenomena:
            <br />
            Our Lives
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-relaxed text-neutral-200 sm:text-lg">
            대한민국 서울 마포구 / 용산구 이태원 중심 언더그라운드 서브컬처 &amp; 피지컬
            마스터 사운드 아카이브 플랫폼 koreaharlem.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="rounded-xl border border-[#262626] bg-[#151515] p-6 transition-colors hover:border-neutral-500"
              >
                <p className="text-lg font-black tracking-wide">{p.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{p.body}</p>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-[#262626] bg-[#151515] p-7">
            <h2 className="text-lg font-bold">우리 이야기</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              koreaharlem은 한국의 클럽·파티·스트리트 문화와 그 주변의 삶을 기록하고
              유통하는 플랫폼입니다. 음악·굿즈·티켓·매거진·커뮤니티를 한곳에서 이어,
              현장의 에너지가 온라인에서도 이어지도록 만듭니다.
            </p>
          </section>

          <section className="mt-4 rounded-xl border border-[#262626] bg-[#151515] p-7">
            <p className="text-[11px] font-medium text-[#FEE500]">팀</p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              대표 장재혁 · koreaharlem 운영팀. 파티·셀렉츠·스토어·아카이브를 함께
              만들어가고 있습니다. 제보·협업 문의는{" "}
              <a href="mailto:koreaharlem@gmail.com" className="text-[#FEE500] underline">
                koreaharlem@gmail.com
              </a>
              으로 보내 주세요.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
