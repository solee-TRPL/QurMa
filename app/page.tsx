"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProblemSlider from "../components/landing/ProblemSlider";
import { MarqueeRibbon } from "../components/landing/MarqueeRibbon";
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
  ChevronLeft,
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
  BookAudio,
  Plus
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

  const handleAccordionClick = (id: number) => {
    if (activeAccordion === id) {
      setActiveAccordion(null);
    } else if (activeAccordion !== null) {
      setActiveAccordion(null);
      setTimeout(() => setActiveAccordion(id), 300); // Wait 300ms before opening the new one
    } else {
      setActiveAccordion(id);
    }
  };

  const onLoginClick = () => {
    router.push("/login");
  };

  const scrollToSection = (sectionName: string) => {
    setIsMenuOpen(false);
    const id = sectionName.toLowerCase();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
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
              {["Solusi", "Keunggulan", "Fitur", "Testimoni"].map((item) => (
                <button 
                  key={item} 
                  onClick={() => scrollToSection(item)}
                  className={`text-xs font-black uppercase tracking-widest transition-all duration-300 ${isScrolled ? "text-slate-600 hover:text-jade-600" : "text-white/80 hover:text-white hover:scale-105"}`}
                >
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
            {["Solusi", "Keunggulan", "Fitur", "Testimoni"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
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

      <main className="relative flex flex-col justify-start md:justify-center pt-28 pb-12 md:py-0 md:min-h-screen overflow-hidden bg-jade-900 md:bg-[url('/images/hero-image.png')] md:bg-cover md:bg-center">
        {/* Desktop overlay */}
        <div className="hidden md:block absolute inset-0 bg-slate-900/40 z-0"></div>

        {/* Mobile top-right image blend */}
        <div className="absolute top-0 right-0 w-[85%] h-87.5 md:hidden z-0">
          <div className="absolute inset-0 bg-[url('/images/hero-image.png')] bg-cover bg-right opacity-50 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-jade-900/40 to-jade-900"></div>
          <div className="absolute inset-0 bg-linear-to-r from-jade-900 via-jade-900/20 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 md:px-16 relative z-10">
          <div className="max-w-3xl space-y-5 animate-in fade-in slide-in-from-bottom-10 duration-1000 relative z-10">
            <h2 className="text-[32px] md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] md:leading-[1.1]">
              Aplikasi Manajemen <br className="hidden md:block" />
              Tahfidz <span className="text-primary-300 drop-shadow-sm">Al Qur'an</span>
            </h2>
            <p className="text-white/90 text-[15px] md:text-lg font-medium leading-relaxed max-w-xl">
              Tingkatkan program Tahfidz dengan menggunakan QurMa. Pantau, sinkron data realtime dan kontrol hafalan dengan mudah dan efektif.
            </p>
            <div className="flex flex-row items-center pt-6 w-max">
              <button
                onClick={onLoginClick}
                className="w-auto h-11 sm:h-12 px-6 sm:px-8 font-black text-[10px] sm:text-[11px] uppercase tracking-widest bg-primary-400 text-amber-950 shadow-xl hover:bg-primary-300 transition-all rounded-lg whitespace-nowrap"
              >
                LOGIN SEKARANG
              </button>
            </div>
          </div>
        </div>
      </main>

      <section id="solusi" className="pt-12 pb-4 bg-white">
        <div className="container mx-auto px-8 md:px-16 w-full">

          <div className="flex flex-col md:flex-row-reverse items-center md:items-stretch justify-center gap-6 md:gap-16 lg:gap-20 w-full">
            <div className="hidden md:flex md:w-1/2 relative justify-center py-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-jade-600/20 rounded-full blur-[80px] -z-10" />
              <img src="/images/kartun-men-nobg.png" alt="Ustadz" className="w-full md:w-auto h-auto md:h-full object-contain drop-shadow-2xl z-10 max-h-100 md:max-h-none" />
            </div>

            <div className="md:w-1/2 flex flex-col justify-center">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight mb-10 text-left">Masalah yang Sering Dihadapi</h2>
              <div className="space-y-2 min-h-105 sm:min-h-90 md:min-h-95 lg:min-h-87.5">
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
                  <div key={item.id} className="overflow-hidden flex flex-col">
                    <button
                      onClick={() => handleAccordionClick(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-300 border ${
                        activeAccordion === item.id ? "bg-jade-100/50 text-jade-700 border-jade-200 shadow-sm" : "bg-white text-neutral-darker hover:bg-slate-50 border-slate-300"
                      }`}
                    >
                      <span className={`text-sm md:text-base leading-[1.4] tracking-[-0.18px] pr-2 transition-all duration-300 font-bold`}>{item.title}</span>
                      <Plus className={`w-4 h-4 text-jade-600 shrink-0 ml-auto transition-all duration-300 ${activeAccordion === item.id ? "rotate-45 opacity-100" : "rotate-0 opacity-90"}`} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out px-4 ${activeAccordion === item.id ? "max-h-64 opacity-100 py-4" : "max-h-0 opacity-0"}`}>
                      <ul className="space-y-3">
                        {item.problems.map((prob, idx) => (
                          <li key={idx} className="flex gap-3 items-start group/item">
                            <img src="/images/bottom-right.png" alt="icon" className="w-4 h-4 mt-0.5 shrink-0 opacity-70 group-hover/item:opacity-100 transition-opacity" />
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

      <section className="pt-8 pb-8 bg-slate-50/50 border-t border-slate-100">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight mb-10 text-center">Atasi Permasalahan Anda dengan QurMa</h2>

          <ProblemSlider />
        </div>
      </section>

      <section id="keunggulan" className="pt-8 pb-8 border-t border-slate-100">
        <div className="container mx-auto px-8 md:px-16 w-full">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight mb-10 text-center md:text-left">Kenapa Harus QurMa ?</h2>

          {(() => {
            const whyQurmaData = [
              {
                menuTitle: "Pionir Digital",
                title: "Pelopor Aplikasi Manajemen Tahfidz Qur'an",
                desc: "QurMa adalah pionir dalam digitalisasi tahfidz dengan pengalaman melayani ratusan lembaga pendidikan Islam di seluruh Indonesia.",
                centerImage: "/images/pioneering.png",
              },
              {
                menuTitle: "Fitur Lengkap",
                title: "Fitur Tahfidz Komplit & Mudah Dioperasikan",
                desc: "Sistem yang dirancang khusus untuk alur KBM tahfidz, mulai dari target mingguan, monitoring harian, hingga rapot otomatis yang sangat user-friendly.",
                centerImage: "/images/feature.png",
              },
              {
                menuTitle: "Sangat Amanah",
                title: "Amanah dan Profesional",
                desc: "Kami berkomitmen terhadap keamanan data lembaga Anda dan memberikan pendampingan penggunaan aplikasi secara berkelanjutan.",
                centerImage: "/images/trust.png",
              },
              {
                menuTitle: "Terintegrasi Penuh",
                title: "Aplikasi Terintegrasi 4 Role",
                desc: "Satu platform yang menghubungkan Pimpinan, Guru, Santri, dan Wali Santri dalam satu ekosistem data yang realtime dan transparan.",
                centerImage: "/images/gear-assembly.png",
              },
              {
                menuTitle: "Dukungan Penuh",
                title: "Layanan Dukungan 24/7",
                desc: "Tim teknis kami siap membantu kapanpun dibutuhkan untuk memastikan operasional tahfidz di lembaga Anda berjalan tanpa hambatan.",
                centerImage: "/images/24-hours.png",
              },
              {
                menuTitle: "Akses Mudah",
                title: "Akses Kapan Saja & Di Mana Saja",
                desc: "Dapat diakses melalui berbagai perangkat dengan mudah, memberikan fleksibilitas maksimal dalam memantau perkembangan hafalan santri.",
                centerImage: "/images/anywhere.png",
              },
              {
                menuTitle: "Gratis Pemakaian",
                title: "Nol Biaya Operasional",
                desc: "Solusi gratis untuk semua kalangan pesantren, tanpa biaya tambahan yang tersembunyi untuk fitur dasar.",
                centerImage: "/images/free.png",
              },
            ];

            return (
              <div className="flex flex-col-reverse md:flex-row items-stretch gap-6 lg:gap-8 w-full mx-auto">
                {/* Desktop Menu */}
                <div className="hidden md:flex flex-col w-1/3 gap-2">
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

                {/* Mobile Menu Navigator */}
                <div className="flex md:hidden items-center justify-between bg-white border border-slate-300 rounded-lg p-1 shadow-sm w-full">
                  <button 
                    onClick={() => setActiveWhyQurMa((prev) => ((prev ?? 0) > 0 ? (prev ?? 0) - 1 : whyQurmaData.length - 1))}
                    className="p-3 text-slate-400 hover:text-jade-600 hover:bg-slate-50 rounded-md transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-[13px] sm:text-sm font-bold text-jade-700 tracking-tight text-center px-2 line-clamp-1">
                    {whyQurmaData[activeWhyQurMa || 0].menuTitle}
                  </span>
                  <button 
                    onClick={() => setActiveWhyQurMa((prev) => ((prev ?? 0) < whyQurmaData.length - 1 ? (prev ?? 0) + 1 : 0))}
                    className="p-3 text-slate-400 hover:text-jade-600 hover:bg-slate-50 rounded-md transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Right Content */}
                <div className="w-full md:w-2/3 flex">
                  <div className="bg-white rounded-lg p-4 lg:p-6 border border-slate-300 shadow-xl shadow-slate-200/50 flex flex-col w-full h-full">
                    <div className="w-full h-40 md:h-48 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-image-landing-page.png')" }}>
                      <div className="absolute inset-0 bg-black/5 z-0" />
                      <img 
                        key={activeWhyQurMa}
                        src={whyQurmaData[activeWhyQurMa || 0].centerImage} 
                        alt="Feature Illustration" 
                        className="h-28 w-auto object-contain relative z-10 transform hover:scale-105 transition-transform duration-500 rounded-xl drop-shadow-2xl animate-scale-in" 
                      />
                    </div>

                    <div className="flex flex-col flex-1">
                      <div className="flex flex-col justify-end mt-auto min-h-32.5 md:min-h-37.5">
                        <h3 className="text-neutral-darkest text-xl md:text-2xl font-black mb-3 leading-tight">{whyQurmaData[activeWhyQurMa || 0].title}</h3>
                        <p className="text-neutral-darker font-medium leading-relaxed mb-0 text-xs md:text-sm min-h-22 md:min-h-24">{whyQurmaData[activeWhyQurMa || 0].desc}</p>
                      </div>

                      <div className="mt-auto">
                        {/*
                        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                          <a href="#" className="flex items-center leading-0 gap-2 text-slate-600 text-[11px] font-bold hover:text-jade-600 transition-colors group">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-jade-600" /> Lihat fitur selengkapnya
                          </a>
                          <a href="#" className="flex items-center gap-2 text-slate-600 text-[11px] font-bold hover:text-jade-600 transition-colors group">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-jade-600" /> Hubungi tim konsultasi kami
                          </a>
                        </div>
                        */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <section id="fitur" className="pt-8 pb-12 bg-white overflow-hidden">
        <div className="container mx-auto px-8 md:px-16 w-full relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight mb-10 text-left">Fiturnya Apa Saja ?</h2>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            {/* Left Column: Feature List */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              {[
                { title: "MANAJEMEN DATA SANTRI", desc: "Fitur pengelolaan database santri, pembagian halaqah, dan manajemen kelas secara terpusat" },
                { title: "MANAJEMEN TAHFIDZ", desc: "Fitur pencatatan hafalan harian, setoran baru, muraja'ah, ziadah, hingga rekapitulasi hafalan santri" },
                { title: "TARGET PEKANAN", desc: "Fitur pembuatan target hafalan pekanan dan pemantauan capaian target masing-masing santri" },
                { title: "PRESENSI & KEHADIRAN", desc: "Fitur pencatatan absensi dan kehadiran santri secara digital dan terintegrasi" },
                { title: "PENILAIAN & PENCAPAIAN", desc: "Fitur pengisian nilai ujian tahfidz dan pencatatan riwayat pencapaian prestasi santri" },
                { title: "CATATAN PERKEMBANGAN", desc: "Fitur pemberian catatan evaluasi dan perkembangan harian dari musyrif/guru untuk santri" },
                { title: "MANAJEMEN PENGGUNA", desc: "Fitur pengelolaan hak akses multi-peran untuk Pimpinan/Yayasan, Admin Sekolah, Guru/Musyrif, dan Wali Santri" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0 bg-white rounded-full">
                    <CheckCircle className="w-6 h-6 text-[#156d4b]" fill="#e6fcf5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-base md:text-[17px] mb-0.5">{item.title}</h3>
                    <p className="text-slate-500 text-[13px] md:text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Phone Mockup */}
            <div className="w-full lg:w-1/2 flex justify-center relative mt-10 lg:mt-0">
              {/* Circle Background */}
              <div className="absolute w-[75%] md:w-[60%] lg:w-[75%] aspect-square bg-jade-700 rounded-full bottom-0 translate-y-[15%] lg:translate-y-[20%] left-1/2 -translate-x-1/2 z-0"></div>
              
              {/* Mockup Image */}
              <img 
                src="/images/iPhone-13-PRO.png" 
                alt="QurMa App Mockup" 
                className="relative z-10 w-[60%] md:w-[45%] lg:w-[55%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Ribbon Section */}
      <MarqueeRibbon />

      <section id="testimoni" className="pt-4 pb-12 bg-linear-to-b from-white to-[#e6fcf5]">
        <div className="container mx-auto px-8 md:px-16 w-full">

          <div
            ref={scrollRef}
            className="flex items-stretch overflow-x-auto snap-x snap-mandatory gap-8 pb-8 no-scrollbar scroll-smooth"
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
            <div className="flex-none w-[5vw] md:hidden shrink-0 pointer-events-none" aria-hidden="true" />

            {testimonials.map((testi, i) => (
              <div
                key={i}
                className="h-50 lg:h-55 flex-none snap-center md:snap-start w-[85vw] md:w-[calc(33.3333%-1.333rem)] bg-slate-50 p-5 lg:p-6 rounded-2xl shadow-xl shadow-slate-200/60 flex flex-col gap-2 hover:bg-white hover:shadow-2xl hover:shadow-jade-600/10 transition-all duration-300 border border-slate-200"
              >
                <div className="flex gap-1.5 shrink-0">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star key={starIdx} className="w-4 h-4 lg:w-5 lg:h-5 fill-[#f59e0b] text-[#f59e0b]" />
                  ))}
                </div>
                <p className="text-sm lg:text-sm text-slate-900 font-bold leading-relaxed">
                  "{testi.text.length > 150 ? testi.text.substring(0, 150).substring(0, testi.text.substring(0, 150).lastIndexOf(' ')).trim() + ' ...' : testi.text}"
                </p>
                <div className="mt-auto shrink-0 pt-1">
                  <p className="text-xs lg:text-[13px] text-slate-500 font-medium">
                    — {testi.name}, {testi.role}
                  </p>
                </div>
              </div>
            ))}

            {/* Kanan Spacer */}
            <div className="flex-none w-[5vw] md:hidden shrink-0 pointer-events-none" aria-hidden="true" />
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
                  {["Solusi", "Keunggulan", "Fitur", "Testimoni"].map((link, i) => (
                    <li key={i}>
                      <button 
                        onClick={() => scrollToSection(link)} 
                        className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary-500 transition-colors text-left block p-0 leading-normal"
                      >
                        {link}
                      </button>
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
