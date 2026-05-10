'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldCheck, Activity, Users, Settings, Cloud, BarChart, FileText, MonitorPlay, ChevronRight, Lock, Target, CheckCircle, Star, CheckSquare, Facebook, Instagram, Youtube, Twitter, MessageCircle, AlertCircle, Menu, X } from 'lucide-react';
import { getAllTenants } from '@/services/data/tenantService';
import { Tenant } from '@/types';

export default function LandingPage() {
    const router = useRouter();
    const [partners, setPartners] = useState<Tenant[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
    const [activeWhyQurMa, setActiveWhyQurMa] = useState<number | null>(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const onLoginClick = () => {
        router.push('/login');
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [activeTesti, setActiveTesti] = useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const testimonials = [
        {
            name: "Ibu Dewi",
            role: "Wali Santri",
            text: "Sangat membantu cara kami mengelola fitur yang lengkap dan atur jadwal, memantau sinkronisasi dengan lebih hemat waktu, tetapi juga berjalan dengan lancar. Bagi sekolah yang ingin meningkatkan sistemnya!",
            image: null
        },
        {
            name: "Ustadz Uwa Mauludin",
            role: "Pimpinan Pesantren",
            text: "Dengan QurMa, kami bisa mengelola kegiatan belajar mengajar di pesantren dengan lebih efektif. Fitur-fitur seperti manajemen jadwal dan pengarsipan data siswa sangat bermanfaat dan membuat proses administrasi lebih cepat. Aplikasi ini benar-benar solusi yang dibutuhkan oleh lembaga pendidikan Islam.",
            image: "/images/teacher_portrait.png",
            featured: true
        },
        {
            name: "Ustadz Heri Lutfi",
            role: "Yayasan Al Qalam",
            text: "Sejak menggunakan QurMa, manajemen lebih tertata. Semua data siswa, jadwal diakses dalam satu platform. Tidak hanya itu tapi juga memudahkan orang tua memantau perkembangan anak-anak mereka. Sangat membantu sekolah islam.",
            image: null
        },
        {
            name: "Ustadzah Siti Maryam",
            role: "Guru Tahfidz",
            text: "Aplikasi yang sangat user friendly. Penginputan hafalan jadi jauh lebih cepat dan data tersusun rapi. Sangat merekomendasikan QurMa untuk pesantren Tahfidz.",
            image: null
        },
        {
            name: "Bapak Ahmad Fauzi",
            role: "Kepala Madrasah",
            text: "Transparansi data hafalan santri ke orang tua menjadi nilai tambah luar biasa bagi lembaga kami semenjak menggunakan QurMa.",
            image: null
        },
        {
            name: "Ustadz Ridwan",
            role: "Pengurus Pondok",
            text: "Sistem keuangannya juga sangat membantu dalam tracking SPP santri. Benar-benar aplikasi All-in-One untuk pesantren.",
            image: null
        }
    ];

    const scrollTo = (index: number) => {
        if (scrollRef.current) {
            const width = scrollRef.current.clientWidth;
            const itemWidth = window.innerWidth >= 768 ? width / 3 : width;
            scrollRef.current.scrollTo({
                left: index * itemWidth,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const tenants = await getAllTenants();
                setPartners(tenants.filter(t => t.logo_url));
            } catch (error) {
                console.error("Error fetching partner logos:", error);
            }
        };
        fetchPartners();
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-jade-600/20 selection:text-jade-600 overflow-x-hidden text-slate-800">
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled 
                ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-md' 
                : 'py-5 border-b border-white/5'
            }`}>
                <div className="container mx-auto px-8 md:px-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 lg:gap-3">
                        <img src="/images/qurma-logo.png" alt="QurMa Logo" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl shadow-lg shadow-black/5" />
                        <div>
                            <h1 className={`text-lg lg:text-xl font-black tracking-tight leading-none uppercase transition-colors duration-300 ${isScrolled ? 'text-slate-800' : 'text-white'}`}>QurMa</h1>
                            <p className={`text-[8px] lg:text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300 ${isScrolled ? 'text-jade-600' : 'text-primary-500'}`}>Management Platform</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 lg:gap-8">
                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            {['Tentang Kami', 'Portofolio', 'FAQ'].map((item) => (
                                <button 
                                    key={item}
                                    className={`text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                        isScrolled 
                                        ? 'text-slate-600 hover:text-jade-600' 
                                        : 'text-white/80 hover:text-white hover:scale-105'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        {/* Login Button - Always Visible */}
                        <button 
                            onClick={onLoginClick} 
                            className={`h-9 lg:h-10 px-4 lg:px-6 font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-full transition-all duration-300 ${
                                isScrolled 
                                ? 'bg-jade-600 text-white shadow-lg shadow-jade-600/30 hover:bg-jade-700' 
                                : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-jade-700'
                            }`}
                        >
                            Login
                        </button>

                        {/* Hamburger Menu - Mobile Only */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`md:hidden transition-all duration-300 ${
                                isScrolled 
                                ? 'p-2 text-slate-800 hover:text-jade-600' 
                                : 'p-2 lg:p-2.5 rounded-xl lg:rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 shadow-lg shadow-black/5'
                            }`}
                        >
                            {isMenuOpen ? <X className="w-5 h-5 lg:w-6 lg:h-6" /> : <Menu className="w-5 h-5 lg:w-6 lg:h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`md:hidden absolute top-full left-0 right-0 transition-all duration-500 overflow-hidden shadow-2xl ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'} ${
                    isScrolled 
                    ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-md' 
                    : 'bg-[#2D2419]/95 backdrop-blur-xl border-b border-white/5'
                }`}>
                    <div className="flex flex-col px-8 py-8 gap-0">
                        {['Tentang Kami', 'Portofolio', 'FAQ'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-5 border-b last:border-0 text-left ${
                                    isScrolled 
                                    ? 'text-slate-600 hover:text-jade-600 border-slate-50' 
                                    : 'text-white/80 hover:text-white border-white/5'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="min-h-screen overflow-hidden relative flex items-center bg-[url('/images/hero-image.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-slate-900/40 z-0"></div>
                
                <div className="container mx-auto px-8 md:px-16 relative z-10">
                    <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <h2 className="text-[28px] md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.2] md:leading-[1.1]">
                            Aplikasi Manajemen <br className="hidden sm:block"/>
                            Tahfidz <span className="bg-gradient-to-b from-primary-200 via-primary-500 to-primary-700 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">Al Qur'an</span>
                        </h2>
                        <p className="text-white/90 text-[13px] md:text-lg font-medium leading-relaxed max-w-xl">
                            Tingkatkan program Tahfidz dengan menggunakan QurMa. <br className="hidden sm:block"/>Pantau, sinkron data realtime dan kontrol hafalan dengan mudah dan efektif.
                        </p>
                        <div className="flex flex-row items-center gap-2 sm:gap-4 pt-4 sm:pt-2">
                            <button className="h-10 sm:h-12 px-4 sm:px-8 bg-primary-500 text-amber-950 font-black uppercase text-[9px] sm:text-[11px] tracking-widest hover:bg-primary-400 shadow-xl shadow-primary-500/20 hover:scale-[1.05] transition-all active:scale-95 whitespace-nowrap">BACA INFO</button>
                            <button onClick={onLoginClick} className="h-10 sm:h-12 px-4 sm:px-8 font-black text-[9px] sm:text-[11px] uppercase tracking-widest bg-jade-600 text-white shadow-xl shadow-jade-600/20 hover:bg-jade-700 hover:scale-[1.05] transition-all active:scale-95 whitespace-nowrap">LOGIN SEKARANG</button>
                        </div>
                    </div>
                </div>
            </main>


            <section className="py-24 bg-white">
                <div className="container mx-auto px-8 md:px-16 w-full">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">
                        Masalah yang Sering Dihadapi oleh Pimpinan dan Guru
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-start justify-center gap-16 lg:gap-20 w-full mx-auto">
                        <div className="md:w-1/2 relative flex justify-center">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-jade-600/20 rounded-full blur-[80px] -z-10" />
                            <img 
                                src="/images/teacher_portrait.png" 
                                alt="Ustadz" 
                                className="w-full max-w-[350px] object-cover rounded-[32px] drop-shadow-2xl z-10"
                            />
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
                                            "Pengambilan keputusan strategis terhambat data yang tidak valid"
                                        ]
                                    },
                                    {
                                        id: 1,
                                        title: "Guru Pengajar",
                                        problems: [
                                            "Sulitnya pembuatan target hafalan yang detail untuk setiap santri",
                                            "Controlling pencapaian hafalan harian yang melelahkan",
                                            "Perekapan hafalan akhir semester yang sangat rumit",
                                            "Data administrasi dan berkas hafalan yang sering berantakan"
                                        ]
                                    },
                                    {
                                        id: 2,
                                        title: "Wali Santri",
                                        problems: [
                                            "Tidak mengetahui perkembangan hafalan anak setiap harinya",
                                            "Laporan hanya bisa dilihat di akhir semester atau tahun ajaran",
                                            "Sulit memberikan motivasi karena tidak tahu progres detail anak",
                                            "Minimnya komunikasi dua arah terkait kendala hafalan anak"
                                        ]
                                    }
                                ].map((item) => (
                                    <div key={item.id} className="border-b border-slate-100 last:border-0 overflow-hidden">
                                        <button 
                                            onClick={() => setActiveAccordion(activeAccordion === item.id ? null : item.id)}
                                            className={`w-full py-4 px-3 flex items-center border border-slate-300 justify-between transition-all group ${activeAccordion === item.id ? 'bg-jade-50/50 rounded-r-[28px]' : ''}`}
                                        >
                                            <span className={`text-lg lg:text-xl font-black transition-colors ${activeAccordion === item.id ? 'text-jade-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                {item.title}
                                            </span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeAccordion === item.id ? 'bg-jade-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                                <ChevronRight className={`w-4 h-4 ${activeAccordion === item.id ? 'rotate-90' : ''}`} />
                                            </div>
                                        </button>
                                        <div className={`transition-all duration-500 ease-in-out ${activeAccordion === item.id ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
                                            <ul className="space-y-3">
                                                {item.problems.map((prob, idx) => (
                                                    <li key={idx} className="flex gap-3 items-start group/item">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-jade-400 mt-1.5 shrink-0" />
                                                        <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed group-hover/item:text-slate-900 transition-colors">
                                                            {prob}
                                                        </p>
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
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">
                        Atasi Semua Permasalahan di Lembaga Anda dengan QurMa
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-20 w-full mx-auto">
                        <div className="md:w-1/2 space-y-5">
                            {[
                                "Penerimaan peserta didik baru jadi lebih mudah dan optimal",
                                "Semua santri lebih mudah dalam mencapai target hafalan",
                                "Sistem pendidikan di pesantren dan sekolah lebih efektif",
                                "Kualitas Informasi yang akurat dan realtime",
                                "Pengambilan keputusan lebih cepat dan tepat",
                                "Keterlibatan wali santri dalam memantau perkembangan anak"
                            ].map((text, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="w-8 h-8 rounded-lg bg-white border-2 border-jade-600 flex items-center justify-center shrink-0">
                                        <Star className="w-4 h-4 text-jade-600 fill-current" />
                                    </div>
                                    <p className="text-xs md:text-sm font-bold text-slate-700 leading-tight">{text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="md:w-1/2 flex flex-col items-center gap-8">
                             <div className="relative w-full max-w-[400px] h-[400px] bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200 border border-slate-100 flex flex-col justify-center items-center">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-jade-600/10 rounded-full blur-[60px]" />
                                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[60px]" />
                                 
                                 <div className="flex w-full px-8 items-center justify-between z-10">
                                     <div className="w-1/2 space-y-2">
                                         <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 rounded-md bg-jade-600 flex items-center justify-center shadow-md">
                                                <BookOpen className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-jade-600 uppercase tracking-widest">QurMa</span>
                                         </div>
                                         <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">Buat <span className="text-primary-500">Target<br/>Hafalan,</span><br/>Dalam Satu<br/>Genggaman</h3>
                                         <p className="text-[8px] text-slate-500 font-medium leading-relaxed mt-2 max-w-[120px]">
                                             Dirancang untuk membantu kebutuhan Manajemen Tahfidz dalam menyusun target hafalan santri secara cepat dan mudah.
                                         </p>
                                     </div>
                                     <div className="w-1/2 flex justify-end">
                                         <div className="w-[140px] h-[280px] bg-slate-800 rounded-[20px] p-1 shadow-2xl relative rotate-3 hover:rotate-0 transition-transform duration-500">
                                             <div className="w-full h-full bg-slate-50 rounded-[16px] flex flex-col overflow-hidden relative border border-slate-600">
                                                <div className="w-16 h-3 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-md z-10"></div>
                                                <div className="bg-jade-600 h-12 w-full shrink-0 flex items-end px-2 pb-2">
                                                    <div className="w-10 h-2 bg-white/20 rounded-full"></div>
                                                </div>
                                                <div className="p-2 space-y-2 flex-1 relative bg-white">
                                                    <div className="h-16 bg-slate-50 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-jade-600"></div>
                                                        <CheckCircle className="w-4 h-4 text-jade-600 mb-1" />
                                                        <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                                                    </div>
                                                    <div className="h-16 bg-slate-50 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                                                        <Target className="w-4 h-4 text-primary-500 mb-1" />
                                                        <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
                                                    </div>
                                                    <div className="h-16 bg-slate-50 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                                                        <Activity className="w-4 h-4 text-rose-400 mb-1" />
                                                        <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
                                                    </div>
                                                </div>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <button className="h-11 px-8 font-black text-[10px] uppercase tracking-widest rounded-full bg-jade-600 text-white shadow-lg shadow-primary-100/50 hover:bg-jade-700 hover:scale-[1.02] transition-all active:scale-95">
                                 Coba Demo Aplikasi Gratis
                             </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white border-t border-slate-100">
                <div className="container mx-auto px-8 md:px-16 w-full">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">
                        Kenapa Harus QurMa ?
                    </h2>

                    <div className="flex flex-col md:flex-row items-start gap-16 lg:gap-20 w-full mx-auto">
                        <div className="md:w-1/2 flex flex-col items-center gap-8">
                            <div className="relative w-full max-w-[400px] h-[400px] bg-slate-50/50 rounded-3xl overflow-hidden shadow-inner border border-slate-200 flex flex-col justify-center items-center p-8">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-jade-600/10 rounded-full blur-[60px]" />
                                
                                <div className="flex items-center justify-between w-full h-full relative z-10">
                                    <div className="w-1/2 pr-4 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-md bg-jade-600 flex items-center justify-center shadow-md">
                                                <BookOpen className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[9px] font-black text-jade-600 uppercase tracking-widest">QurMa</span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-jade-600 leading-tight">
                                            Aplikasi Dibuatkan <br/><span className="text-primary-500">Khusus Untuk Lembaga Anda</span>
                                        </h3>
                                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                                            Selain menu default, juga dapat ditambahkan menu lain sesuai kebutuhan.
                                        </p>
                                    </div>
                                    <div className="w-1/2 relative h-full flex items-center justify-end">
                                        <div className="w-[160px] h-[320px] bg-slate-800 rounded-[24px] p-1 shadow-2xl relative -rotate-6 translate-x-4 hover:rotate-0 hover:translate-x-0 transition-transform duration-500 border border-slate-700">
                                             <div className="w-full h-full bg-jade-600 rounded-[20px] flex flex-col overflow-hidden relative">
                                                <div className="w-20 h-4 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-lg z-10"></div>
                                                <div className="pt-10 px-3 pb-3 grid grid-cols-2 gap-2 content-start flex-1 bg-[#20664a]">
                                                    {[...Array(8)].map((_, i) => (
                                                        <div key={i} className="aspect-square bg-white rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                                                            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                                                                <Activity className="w-3 h-3 text-jade-600" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="h-11 px-8 font-black text-[10px] uppercase tracking-widest rounded-full bg-jade-600 text-white shadow-lg shadow-primary-100/50 hover:bg-jade-700 hover:scale-[1.02] transition-all active:scale-95">
                                Lebih Dekat dengan QurMa
                            </button>
                        </div>

                        <div className="md:w-1/2 space-y-2">
                            {[
                                { 
                                    title: "Pelopor Aplikasi Manajemen Tahfidz Al-Qur'an", 
                                    desc: "QurMa adalah pionir dalam digitalisasi tahfidz dengan pengalaman melayani ratusan lembaga pendidikan Islam di seluruh Indonesia." 
                                },
                                { 
                                    title: "Fitur Tahfidz Komplit & Mudah Dioperasikan", 
                                    desc: "Sistem yang dirancang khusus untuk alur KBM tahfidz, mulai dari target mingguan, monitoring harian, hingga rapot otomatis yang sangat user-friendly." 
                                },
                                { 
                                    title: "Amanah dan Profesional", 
                                    desc: "Kami berkomitmen terhadap keamanan data lembaga Anda dan memberikan pendampingan penggunaan aplikasi secara berkelanjutan (Lifetime Maintenance)." 
                                },
                                { 
                                    title: "Aplikasi Terintegrasi 4 Role", 
                                    desc: "Satu platform yang menghubungkan Pimpinan, Guru, Santri, dan Wali Santri dalam satu ekosistem data yang realtime dan transparan." 
                                },
                                { 
                                    title: "Layanan Dukungan 24/7", 
                                    desc: "Tim teknis kami siap membantu kapanpun dibutuhkan untuk memastikan operasional tahfidz di lembaga Anda berjalan tanpa hambatan." 
                                },
                            ].map((item, i) => (
                                <div key={i} className="border-b border-slate-100 last:border-0 overflow-hidden">
                                    <button 
                                        onClick={() => setActiveWhyQurMa(activeWhyQurMa === i ? null : i)}
                                        className={`w-full py-4 px-3 flex items-center justify-between transition-all group ${activeWhyQurMa === i ? 'bg-jade-50/50 rounded-r-[28px]' : ''}`}
                                    >
                                        <span className={`text-sm lg:text-base font-black transition-colors ${activeWhyQurMa === i ? 'text-jade-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            {item.title}
                                        </span>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${activeWhyQurMa === i ? 'bg-jade-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                            <ChevronRight className={`w-3.5 h-3.5 ${activeWhyQurMa === i ? 'rotate-90' : ''}`} />
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-500 ease-in-out ${activeWhyQurMa === i ? 'max-h-40 opacity-100 py-3 px-3' : 'max-h-0 opacity-0'}`}>
                                        <p className="text-[10px] lg:text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white border-t border-slate-100 overflow-hidden">
                <div className="container mx-auto px-8 md:px-16 w-full">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight text-center mb-16">
                        Fiturnya Apa Saja ?
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center gap-16 w-full mx-auto">
                        <div className="md:w-1/2 space-y-6 z-10">
                            {[
                                { title: "MANAJEMEN DATA", desc: "Fitur pengelolaan database santri dan guru sampai terbuat buku induk otomatis" },
                                { title: "MENU TAHFIDZ", desc: "Fitur manajemen program tahfidz Al-Qur'an mulai dari pembuatan target hafalan, KBM, ujian sampai laporan otomatis" },
                                { title: "MENU TAHSIN/TILAWAH", desc: "Fitur manajemen program tahsin/tilawah mulai dari pembuatan target, KBM, ujian kenaikan jilid sampai laporan otomatis" },
                                { title: "MENU AKADEMIK", desc: "Fitur manajemen program akademik pelajaran sekolah mulai dari pembagian rombel, pembagian jadwal mata pelajaran, RPP, pengisian jurnal guru, penilaian sampai rapot otomatis" },
                                { title: "DATA USER", desc: "Fitur pembuatan username untuk pengguna aplikasi mulai dari pimpinan, admin, guru dan wali santri. Semua user bisa login kedalam aplikasi dengan hak akses masing-masing" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="mt-1">
                                        <div className="w-8 h-8 rounded-lg border-2 border-jade-600 flex items-center justify-center shrink-0 group-hover:bg-jade-600 transition-colors">
                                            <CheckSquare className="w-5 h-5 text-jade-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800">{item.title}</h4>
                                        <p className="text-[10px] md:text-xs text-slate-600 font-medium leading-relaxed mt-1">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="md:w-1/2 flex flex-col items-center">
                            <div className="relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-jade-600/90 rounded-full -z-10" />
                                
                                <div className="w-[280px] h-[580px] bg-slate-900 rounded-[40px] p-2 shadow-2xl shadow-slate-900/40 relative transform transition-transform duration-500">
                                     <div className="w-full h-full bg-slate-50 rounded-[32px] overflow-hidden flex flex-col relative border border-slate-200">
                                         <div className="bg-jade-600 pt-8 pb-10 px-5 text-white relative">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-xs">QurMa Mobile</span>
                                            </div>
                                            <h3 className="text-xl font-black leading-tight">QurMa adalah<br/><span className="text-primary-500">Pionir</span><br/>Aplikasi Manajemen<br/>Tahfidz Al-Quran</h3>
                                         </div>
                                         <div className="flex-1 bg-slate-50 -mt-4 rounded-t-3xl p-5 grid grid-cols-3 gap-3 content-start z-10 relative">
                                            {[
                                                { icon: BookOpen, label: 'Target', color: 'text-rose-500', bg: 'bg-rose-100' },
                                                { icon: CheckCircle, label: 'Setoran', color: 'text-amber-500', bg: 'bg-amber-100' },
                                                { icon: BarChart, label: 'Statistik', color: 'text-blue-500', bg: 'bg-blue-100' },
                                                { icon: FileText, label: 'Buku Rapot', color: 'text-jade-600', bg: 'bg-emerald-100' },
                                                { icon: Activity, label: 'Ujian', color: 'text-purple-500', bg: 'bg-purple-100' },
                                                { icon: Settings, label: 'Setelan', color: 'text-slate-500', bg: 'bg-slate-200' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1.5">
                                                    <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</span>
                                                </div>
                                            ))}
                                            
                                            <div className="col-span-3 mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <BarChart className="w-16 h-16 text-jade-600" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold mb-1">Setoran Hari Ini</p>
                                                <h4 className="text-2xl font-black text-jade-600">6.236 <span className="text-xs font-bold text-slate-400">Baris</span></h4>
                                            </div>
                                            <div className="col-span-3 mt-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                                <p className="text-[10px] text-slate-400 font-bold mb-1">Total Santri Aktif</p>
                                                <h4 className="text-2xl font-black text-jade-600">3.236 <span className="text-xs font-bold text-slate-400">Santri</span></h4>
                                            </div>
                                         </div>
                                     </div>
                                </div>
                            </div>

                            <button className="mt-16 h-11 px-8 font-black text-[10px] uppercase tracking-widest rounded-full bg-jade-600 text-white shadow-lg shadow-primary-100/50 hover:bg-jade-700 hover:scale-[1.02] transition-all active:scale-95">
                                Lihat Semua Fitur
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-slate-50 border-t border-slate-100">
                <div className="container mx-auto px-8 md:px-16 w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            Testimonial
                        </h2>
                        <p className="text-sm md:text-base font-bold text-slate-500 mt-2">
                            Bagaimana QurMa Membantu Mereka?
                        </p>
                    </div>

                    <div 
                        ref={scrollRef}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-8 px-4 md:px-0 pb-8 no-scrollbar scroll-smooth"
                        onScroll={(e) => {
                            const scrollLeft = e.currentTarget.scrollLeft;
                            const width = e.currentTarget.clientWidth;
                            const itemWidth = window.innerWidth >= 768 ? width / 3 : width;
                            const containerCenter = scrollLeft + width / 2;
                            const newActive = Math.floor(containerCenter / itemWidth);
                            setActiveTesti(newActive);
                        }}
                    >
                        {testimonials.map((testi, i) => (
                            <div 
                                key={i} 
                                className={`flex-none snap-center w-full md:w-[calc(33.333%-1.5rem)] bg-white p-7 lg:p-9 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-md transition-all duration-500 relative overflow-hidden ${i === activeTesti ? 'shadow-lg shadow-emerald-600/10 scale-[1.02] border-emerald-100' : 'opacity-60 scale-95'}`}
                            >
                                {i === activeTesti && (
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600 animate-in fade-in slide-in-from-top duration-500" />
                                )}
                                <div className="flex gap-1 shrink-0">
                                    {[...Array(5)].map((_, starIdx) => (
                                        <Star key={starIdx} className="w-3.5 h-3.5 lg:w-4 lg:h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed">
                                    "{testi.text}"
                                </p>
                                <div className="flex items-center gap-4 mt-auto shrink-0 pt-2">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-50 border border-slate-200 mb-0 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                        {testi.image ? (
                                            <img src={testi.image} className="w-full h-full object-cover" alt={testi.name} />
                                        ) : (
                                            <Users className="w-5 h-5 lg:w-6 lg:h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-[11px] lg:text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{testi.name}</h4>
                                        <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{testi.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center items-center gap-2 mt-8">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => scrollTo(i)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                    activeTesti === i 
                                    ? 'w-8 bg-jade-600' 
                                    : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                                }`}
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
                            <p className="text-slate-400 text-xs leading-relaxed max-w-xs font-medium">
                                Solusi digital terpadu untuk manajemen tahfidz dan administrasi sekolah Islam modern yang efisien dan transparan.
                            </p>
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
                                    {['Tentang Kami', 'Portofolio', 'FAQ'].map((link, i) => (
                                        <li key={i}>
                                            <a href="#" className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary-500 transition-colors">{link}</a>
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
