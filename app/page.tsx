"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProblemSlider from "../components/landing/ProblemSlider";
import {
  BookOpen,
  ShieldCheck,
  Activity,
  Users,
  Settings,
  Cloud,
  BarChart,
  FileText,
  MonitorPlay,
  ChevronRight,
  Lock,
  Target,
  CheckCircle,
  Star,
  CheckSquare,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  MessageCircle,
  AlertCircle,
  Menu,
  X,
  ArrowRight,
  Database,
  GraduationCap,
  UserCog,
  ArrowUpRight,
  BookAudio
} from "lucide-react";
import { getAllTenants } from "@/services/data/tenantService";
import { Tenant } from "@/types";

export default function LandingPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Tenant[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
  const [activeWhyQurMa, setActiveWhyQurMa] = useState<number | null>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onLoginClick = () => {
    router.push("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeTesti, setActiveTesti] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: "Ibu Dewi",
      role: "Wali Santri",
      text: "Sangat membantu cara kami mengelola fitur yang lengkap dan atur jadwal, memantau sinkronisasi dengan lebih hemat waktu, tetapi juga berjalan dengan lancar. Bagi sekolah yang ingin meningkatkan sistemnya!",
      image: null,
    },
    {
      name: "Ustadz Uwa Mauludin",
      role: "Pimpinan Pesantren",
      text: "Dengan QurMa, kami bisa mengelola kegiatan belajar mengajar di pesantren dengan lebih efektif. Fitur-fitur seperti manajemen jadwal dan pengarsipan data siswa sangat bermanfaat dan membuat proses administrasi lebih cepat. Aplikasi ini benar-benar solusi yang dibutuhkan oleh lembaga pendidikan Islam.",
      image: "/images/teacher_portrait.png",
      featured: true,
    },
    {
      name: "Ustadz Heri Lutfi",
      role: "Yayasan Al Qalam",
      text: "Sejak menggunakan QurMa, manajemen lebih tertata. Semua data siswa, jadwal diakses dalam satu platform. Tidak hanya itu tapi juga memudahkan orang tua memantau perkembangan anak-anak mereka. Sangat membantu sekolah islam.",
      image: null,
    },
    {
      name: "Ustadzah Siti Maryam",
      role: "Guru Tahfidz",
      text: "Aplikasi yang sangat user friendly. Penginputan hafalan jadi jauh lebih cepat dan data tersusun rapi. Sangat merekomendasikan QurMa untuk pesantren Tahfidz.",
      image: null,
    },
    {
      name: "Bapak Ahmad Fauzi",
      role: "Kepala Madrasah",
      text: "Transparansi data hafalan santri ke orang tua menjadi nilai tambah luar biasa bagi lembaga kami semenjak menggunakan QurMa.",
      image: null,
    },
    {
      name: "Ustadz Ridwan",
      role: "Pengurus Pondok",
      text: "Sistem keuangannya juga sangat membantu dalam tracking SPP santri. Benar-benar aplikasi All-in-One untuk pesantren.",
      image: null,
    },
  ];

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const targetChild = container.children[index + 1] as HTMLElement; // +1 to skip spacer
      if (targetChild) {
        const scrollLeft = targetChild.offsetLeft - container.clientWidth / 2 + targetChild.clientWidth / 2;
        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const tenants = await getAllTenants();
        setPartners(tenants.filter((t) => t.logo_url));
      } catch (error) {
        console.error("Error fetching partner logos:", error);
      }
    };
    fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-jade-600/20 selection:text-jade-600 overflow-x-hidden text-slate-800">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-md" : "py-5 border-b border-white/5"}`}>
        <div className="container mx-auto px-8 md:px-16 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            <img src="/images/qurma-logo.png" alt="QurMa Logo" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl shadow-lg shadow-black/5" />
            <div>
              <h1 className={`text-lg lg:text-xl font-black tracking-tight leading-none uppercase transition-colors duration-300 ${isScrolled ? "text-slate-800" : "text-white"}`}>QurMa</h1>
              <p className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300 ${isScrolled ? "text-jade-600" : "text-primary-500"}`}>Management Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-8">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {["Tentang Kami", "Portofolio", "FAQ"].map((item) => (
                <button key={item} className={`text-xs font-black uppercase tracking-widest transition-all duration-300 ${isScrolled ? "text-slate-600 hover:text-jade-600" : "text-white/80 hover:text-white hover:scale-105"}`}>
                  {item}
                </button>
              ))}
            </div>

            {/* Login Button - Desktop Only */}
            <button
              onClick={onLoginClick}
              className={`hidden md:block h-9 lg:h-10 px-4 lg:px-6 font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-full transition-all duration-300 ${
                isScrolled ? "bg-jade-600 text-white shadow-lg shadow-jade-600/30 hover:bg-jade-700" : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-jade-700"
              }`}
            >
              Login
            </button>

            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden transition-all duration-300 ${
                isScrolled ? "p-2 text-slate-800 hover:text-jade-600" : "p-2 lg:p-2.5 rounded-xl lg:rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 shadow-lg shadow-black/5"
              }`}
            >
              {isMenuOpen ? <X className="w-5 h-5 lg:w-6 lg:h-6" /> : <Menu className="w-5 h-5 lg:w-6 lg:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 transition-all duration-500 overflow-hidden shadow-2xl ${isMenuOpen ? "max-h-68 opacity-100" : "max-h-0 opacity-0"} ${
            isScrolled ? "bg-white backdrop-blur-md border-b border-slate-200 shadow-md" : "bg-[#2D2419]/95 backdrop-blur-xl border-b border-white/5"
          }`}
        >
          <div className="flex flex-col px-8 py-4 gap-0">
            {["Tentang Kami", "Portofolio", "FAQ"].map((item) => (
              <button
                key={item}
                onClick={() => setIsMenuOpen(false)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-2 last:border-0 text-left ${
                  isScrolled ? "text-slate-600 hover:text-jade-600 border-slate-50" : "text-white/80 hover:text-white border-white/5"
                }`}
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onLoginClick();
              }}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-2 border-b last:border-0 text-left ${
                isScrolled ? "text-slate-600 hover:text-jade-600 border-slate-50" : "text-white/80 hover:text-white border-white/5"
              }`}
            >
              LOGIN
            </button>
          </div>
        </div>
      </nav>

      <main className="min-h-screen overflow-hidden relative flex items-center bg-[url('/images/hero-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-900/40 z-0"></div>

        <div className="container mx-auto px-8 md:px-16 relative z-10">
          <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <h2 className="text-[28px] md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.2] md:leading-[1.1]">
              Aplikasi Manajemen <br className="hidden sm:block" />
              Tahfidz <span className="bg-linear-to-b from-primary-200 via-primary-500 to-primary-700 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">Al Qur'an</span>
            </h2>
            <p className="text-white/90 text-[13px] md:text-lg font-medium leading-relaxed max-w-xl">
              Tingkatkan program Tahfidz dengan menggunakan QurMa. <br className="hidden sm:block" />
              Pantau, sinkron data realtime dan kontrol hafalan dengan mudah dan efektif.
            </p>
            <div className="flex flex-row items-center gap-2 sm:gap-4 pt-4 sm:pt-2">
              <button className="h-10 sm:h-12 px-4 sm:px-8 bg-primary-500 text-amber-950 font-black uppercase text-[9px] sm:text-[11px] tracking-widest hover:bg-primary-400 shadow-xl shadow-primary-500/20 hover:scale-[1.05] transition-all active:scale-95 whitespace-nowrap">
                BACA INFO
              </button>
              <button
                onClick={onLoginClick}
                className="h-10 sm:h-12 px-4 sm:px-8 font-black text-[9px] sm:text-[11px] uppercase tracking-widest bg-jade-600 text-white shadow-xl shadow-jade-600/20 hover:bg-jade-700 hover:scale-[1.05] transition-all active:scale-95 whitespace-nowrap"
              >
                LOGIN SEKARANG
              </button>
            </div>
          </div>
        </div>
      </main>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">Masalah yang Sering Dihadapi oleh Pimpinan dan Guru</h2>

          <div className="flex flex-col md:flex-row items-start justify-center gap-16 lg:gap-20 w-full mx-auto">
            <div className="md:w-1/2 relative flex justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-jade-600/20 rounded-full blur-[80px] -z-10" />
              <img src="/images/teacher_portrait.png" alt="Ustadz" className="w-full max-87.5 object-cover rounded-32px drop-shadow-2xl z-10" />
            </div>

            <div className="md:w-1/2">
              <div className="space-y-2">
                {[
                  {
                    id: 0,
                    title: "Pimpinan / Yayasan",
                    problems: [
                      "Monitoring setoran harian yang sulit dipantau secara langsung",
                      "Evaluasi pencapaian target hafalan yang memakan waktu lama",
                      "Sistem pelaporan ke wali santri yang belum otomatis dan realtime",
                      "Pengambilan keputusan strategis terhambat data yang tidak valid",
                    ],
                  },
                  {
                    id: 1,
                    title: "Guru Pengajar",
                    problems: [
                      "Sulitnya pembuatan target hafalan yang detail untuk setiap santri",
                      "Controlling pencapaian hafalan harian yang melelahkan",
                      "Perekapan hafalan akhir semester yang sangat rumit",
                      "Data administrasi dan berkas hafalan yang sering berantakan",
                    ],
                  },
                  {
                    id: 2,
                    title: "Wali Santri",
                    problems: [
                      "Tidak mengetahui perkembangan hafalan anak setiap harinya",
                      "Laporan hanya bisa dilihat di akhir semester atau tahun ajaran",
                      "Sulit memberikan motivasi karena tidak tahu progres detail anak",
                      "Minimnya komunikasi dua arah terkait kendala hafalan anak",
                    ],
                  },
                ].map((item) => (
                  <div key={item.id} className="border-b border-slate-100 last:border-0 overflow-hidden">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                      className={`w-full py-4 px-3 flex items-center border border-slate-300 justify-between transition-all group ${activeAccordion === item.id ? "bg-jade-50/50 rounded-r-28px" : ""}`}
                    >
                      <span className={`text-lg lg:text-xl font-black transition-colors ${activeAccordion === item.id ? "text-jade-700" : "text-slate-400 group-hover:text-slate-600"}`}>{item.title}</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeAccordion === item.id ? "bg-jade-600 text-white rotate-180" : "bg-slate-50 text-slate-400"}`}>
                        <ChevronRight className={`w-4 h-4 ${activeAccordion === item.id ? "rotate-90" : ""}`} />
                      </div>
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${activeAccordion === item.id ? "max-h-64 opacity-100 py-4" : "max-h-0 opacity-0"}`}>
                      <ul className="space-y-3">
                        {item.problems.map((prob, idx) => (
                          <li key={idx} className="flex gap-3 items-start group/item">
                            <div className="w-1.5 h-1.5 rounded-full bg-jade-400 mt-1.5 shrink-0" />
                            <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed group-hover/item:text-slate-900 transition-colors">{prob}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">Atasi Semua Permasalahan di Lembaga Anda dengan QurMa</h2>

          <ProblemSlider />
        </div>
      </section>

      <section className="py-24 bg-white border-t border-slate-100 font-gotham" style={{ fontFamily: '"GothamWeb", sans-serif' }}>
        <div className="container mx-auto px-8 md:px-16 w-full max-w-6xl">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-10 text-center md:text-left">Kenapa Harus QurMa ?</h2>

          {(() => {
            const whyQurmaData = [
              {
                menuTitle: "Pionir Digital",
                title: "Pelopor Aplikasi Manajemen Tahfidz Al-Qur'an",
                desc: "QurMa adalah pionir dalam digitalisasi tahfidz dengan pengalaman melayani ratusan lembaga pendidikan Islam di seluruh Indonesia.",
              },
              {
                menuTitle: "Fitur Lengkap",
                title: "Fitur Tahfidz Komplit & Mudah Dioperasikan",
                desc: "Sistem yang dirancang khusus untuk alur KBM tahfidz, mulai dari target mingguan, monitoring harian, hingga rapot otomatis yang sangat user-friendly.",
              },
              {
                menuTitle: "Sangat Amanah",
                title: "Amanah dan Profesional",
                desc: "Kami berkomitmen terhadap keamanan data lembaga Anda dan memberikan pendampingan penggunaan aplikasi secara berkelanjutan (Lifetime Maintenance).",
              },
              {
                menuTitle: "Terintegrasi Penuh",
                title: "Aplikasi Terintegrasi 4 Role",
                desc: "Satu platform yang menghubungkan Pimpinan, Guru, Santri, dan Wali Santri dalam satu ekosistem data yang realtime dan transparan.",
              },
              {
                menuTitle: "Dukungan Penuh",
                title: "Layanan Dukungan 24/7",
                desc: "Tim teknis kami siap membantu kapanpun dibutuhkan untuk memastikan operasional tahfidz di lembaga Anda berjalan tanpa hambatan.",
              },
              {
                menuTitle: "Akses Mudah",
                title: "Akses Kapan Saja & Di Mana Saja",
                desc: "Dapat diakses melalui berbagai perangkat dengan mudah, memberikan fleksibilitas maksimal dalam memantau perkembangan hafalan santri dari manapun.",
              },
              {
                menuTitle: "Harga Terjangkau",
                title: "Biaya Operasional Terjangkau",
                desc: "Solusi premium dengan harga yang bersahabat untuk semua kalangan pesantren, tanpa biaya tambahan yang tersembunyi untuk fitur dasar.",
              },
            ];

            return (
              <div className="flex flex-col md:flex-row items-stretch gap-6 lg:gap-8 w-full mx-auto">
                {/* Left Menu */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  {whyQurmaData.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveWhyQurMa(i)}
                      className={`text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-300 flex-1 border ${
                        activeWhyQurMa === i ? "bg-jade-100/50 text-jade-700 border-jade-200 shadow-sm" : "bg-white text-neutral-darker hover:bg-slate-50 border-slate-300"
                      }`}
                    >
                      <span className={`text-sm leading-[1.4] tracking-[-0.18px] whitespace-nowrap pr-2 transition-all duration-300 ${activeWhyQurMa === i ? "font-medium" : "font-medium"}`}>{item.menuTitle}</span>
                      <ArrowRight className={`w-4 h-4 text-jade-600 shrink-0 ml-auto transition-all duration-300 ${activeWhyQurMa === i ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
                    </button>
                  ))}
                </div>

                {/* Right Content */}
                <div className="w-full md:w-2/3 flex">
                  <div className="bg-white rounded-lg p-4 lg:p-6 border border-slate-300 shadow-xl shadow-slate-200/50 flex flex-col w-full h-full">
                    <div className="w-full h-40 md:h-48 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-image-landing-page.png')" }}>
                      <div className="absolute inset-0 bg-black/5 z-0" />
                      <div className="w-48 h-28 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/50 flex flex-col p-4 relative z-10 transform hover:scale-105 transition-transform duration-500">
                        <div className="flex items-center justify-between mb-auto">
                          <div className="w-7 h-7 rounded-lg bg-jade-600 flex items-center justify-center shadow-md">
                            <BookOpen className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="h-3 w-10 bg-slate-200 rounded flex items-center justify-center">
                            <div className="w-5 h-1 bg-slate-400 rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-1.5 mt-4">
                          <div className="h-2 w-full bg-slate-200 rounded-full" />
                          <div className="h-2 w-2/3 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col flex-1">
                      <h3 className="font-gotham text-neutral-darkest text-xl md:text-2xl font-black mb-3 leading-tight">{whyQurmaData[activeWhyQurMa || 0].title}</h3>
                      <p className="text-neutral-darker font-medium leading-relaxed mb-6 text-xs md:text-sm">{whyQurmaData[activeWhyQurMa || 0].desc}</p>

                      <div className="mt-auto">
                        <button className="h-10 px-12 font-black text-[10px] uppercase tracking-widest rounded-lg bg-jade-600 text-white hover:bg-jade-700 transition-colors shadow-lg shadow-jade-600/30">PELAJARI LEBIH LANJUT</button>

                        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          <a href="#" className="flex items-center leading-0 gap-2 text-slate-600 text-[11px] font-bold hover:text-jade-600 transition-colors group">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-jade-600" /> Lihat fitur selengkapnya
                          </a>
                          <a href="#" className="flex items-center gap-2 text-slate-600 text-[11px] font-bold hover:text-jade-600 transition-colors group">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-jade-600" /> Hubungi tim konsultasi kami
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-8 md:px-16 w-full max-w-6xl relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">Fiturnya Apa Saja ?</h2>
          
          <div className="rounded-lg p-6 md:p-6 border border-slate-300">
            <div className="flex flex-col gap-4 md:gap-4">
              {/* Baris 1: 2 Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
                {[
                  { title: "Manajemen Data", desc: "Kelola database santri & guru hingga buku induk otomatis", icon: Database, color: "text-blue-500", bg: "bg-blue-100" },
                  { title: "Menu Tahfidz", desc: "Buat target, KBM, ujian, hingga laporan hafalan otomatis", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100" },
                ].map((item, i) => (
                  <div key={i} className="group relative bg-white rounded-lg p-4 lg:p-6 transition-all duration-300 border border-slate-300 shadow-xl shadow-slate-200/50 hover:border-jade-500 flex flex-col items-center text-center overflow-hidden cursor-pointer w-full h-full">
                    <div className="absolute top-4 right-4 text-slate-300 group-hover:text-jade-600 transition-colors duration-300">
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${item.bg} flex items-center justify-center mb-4 md:mb-6 transition-colors duration-500`}>
                      <item.icon className={`w-7 h-7 md:w-8 md:h-8 ${item.color}`} />
                    </div>
                    
                    <h3 className="text-[#0e5c3b] font-bold text-base md:text-lg mb-1.5 md:mb-2" style={{ fontFamily: '"GothamWeb", sans-serif' }}>{item.title}</h3>
                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed" style={{ fontFamily: '"GothamWeb", sans-serif' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Baris 2: 3 Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
                {[
                  { title: "Menu Tahsin", desc: "Manajemen tahsin mulai dari target hingga kenaikan jilid", icon: BookAudio, color: "text-amber-500", bg: "bg-amber-100" },
                  { title: "Menu Akademik", desc: "Kelola rombel, jadwal, RPP, jurnal, hingga rapot otomatis", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-100" },
                  { title: "Data User", desc: "Hak akses khusus untuk pimpinan, admin, guru, & wali santri", icon: UserCog, color: "text-rose-500", bg: "bg-rose-100" },
                ].map((item, i) => (
                  <div key={i} className="group relative bg-white rounded-lg p-4 lg:p-6 transition-all duration-300 border border-slate-300 shadow-xl shadow-slate-200/50 hover:border-jade-500 flex flex-col items-center text-center overflow-hidden cursor-pointer w-full h-full">
                    <div className="absolute top-4 right-4 text-slate-300 group-hover:text-jade-600 transition-colors duration-300">
                      <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${item.bg} flex items-center justify-center mb-4 md:mb-6 transition-colors duration-500`}>
                      <item.icon className={`w-7 h-7 md:w-8 md:h-8 ${item.color}`} />
                    </div>
                    
                    <h3 className="text-[#0e5c3b] font-bold text-base md:text-lg mb-1.5 md:mb-2" style={{ fontFamily: '"GothamWeb", sans-serif' }}>{item.title}</h3>
                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed" style={{ fontFamily: '"GothamWeb", sans-serif' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Testimonial</h2>
            <p className="text-sm md:text-base font-bold text-slate-500 mt-2">Bagaimana QurMa Membantu Mereka?</p>
          </div>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 no-scrollbar scroll-smooth"
            onScroll={(e) => {
              const container = e.currentTarget;
              const centerOfContainer = container.scrollLeft + container.clientWidth / 2;
              let closestIndex = 0;
              let minDistance = Infinity;

              const children = Array.from(container.children);
              children.forEach((child, idx) => {
                if (idx === 0 || idx === children.length - 1) return; // Skip spacers

                const htmlChild = child as HTMLElement;
                const childCenter = htmlChild.offsetLeft + htmlChild.clientWidth / 2;
                const distance = Math.abs(childCenter - centerOfContainer);

                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = idx - 1;
                }
              });
              setActiveTesti(closestIndex);
            }}
          >
            {/* Kiri Spacer */}
            <div className="flex-none w-[5vw] md:w-[calc(33.333%-1.5rem)] shrink-0 pointer-events-none" aria-hidden="true" />

            {testimonials.map((testi, i) => (
              <div
                key={i}
                className={`flex-none snap-center w-[85vw] md:w-[calc(33.333%-1.5rem)] bg-white p-7 lg:p-9 rounded-32px shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-all duration-500 relative overflow-hidden ${i === activeTesti ? "shadow-lg shadow-emerald-600/10 scale-[1.02] border-emerald-100" : "opacity-60 scale-95"}`}
              >
                <div className="flex gap-1 shrink-0">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star key={starIdx} className="w-3.5 h-3.5 lg:w-4 lg:h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed">"{testi.text}"</p>
                <div className="flex items-center gap-4 mt-auto shrink-0 pt-2">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-50 border border-slate-200 mb-0 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {testi.image ? <img src={testi.image} className="w-full h-full object-cover" alt={testi.name} /> : <Users className="w-5 h-5 lg:w-6 lg:h-6 text-slate-300" />}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[11px] lg:text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{testi.name}</h4>
                    <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Kanan Spacer */}
            <div className="flex-none w-[5vw] md:w-[calc(33.333%-1.5rem)] shrink-0 pointer-events-none" aria-hidden="true" />
          </div>

          <div className="flex justify-center items-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeTesti === i ? "w-8 bg-jade-600" : "w-2.5 bg-slate-200 hover:bg-slate-300"}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#1e1e1e] pt-12 pb-8 border-t border-slate-800">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/images/qurma-logo.png" alt="QurMa Logo" className="w-10 h-10 rounded-2xl" />
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">QurMa</h1>
                  <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-0.5">Management Platform</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-medium">Solusi digital terpadu untuk manajemen tahfidz dan administrasi sekolah Islam modern yang efisien dan transparan.</p>
              <div className="flex gap-3">
                {[Instagram, MessageCircle, Facebook, Youtube].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary-500 transition-colors cursor-pointer group">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#1e1e1e] transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-12 lg:gap-24">
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Navigasi</h4>
                <ul className="space-y-3">
                  {["Tentang Kami", "Portofolio", "FAQ"].map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary-500 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6">Informasi</h4>
                <ul className="space-y-3">
                  <li className="text-slate-400 text-[10px] font-black uppercase tracking-widest">info@qurma.com</li>
                  <li className="text-slate-400 text-[10px] font-black uppercase tracking-widest">+62 895 1028 5885</li>
                  <li className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Jakarta Barat, DKI Jakarta</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <p className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest md:tracking-[0.2em] whitespace-nowrap text-center" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} QurMa Digital Indonesia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
