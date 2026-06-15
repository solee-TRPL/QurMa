"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";

export default function ProblemSlider() {
  const problems = [
    {
      id: 1,
      title: "Manajemen Data Tidak Akurat",
      desc: "QurMa membantu menyinkronkan data hafalan agar selalu real-time.",
      image: "/images/bg-image-landing-page.png",
    },
    {
      id: 2,
      title: "Wali Santri Sulit Memantau",
      desc: "Akses mudah bagi orang tua untuk memantau hafalan anak dari rumah.",
      image: "/images/bg-image-landing-page.png",
    },
    {
      id: 3,
      title: "Target Hafalan Tidak Jelas",
      desc: "Buat target yang terukur untuk menjamin ketercapaian hafalan santri.",
      image: "/images/bg-image-landing-page.png",
    },
    {
      id: 4,
      title: "Rekapitulasi Nilai Repot",
      desc: "Otomatisasi raport dan rekapitulasi penilaian tahfidz dalam satu sentuhan.",
      image: "/images/bg-image-landing-page.png",
    },
    {
      id: 5,
      title: "Sulit Mengontrol Pengajar",
      desc: "Sistem absensi dan log mengajar yang transparan bagi pimpinan.",
      image: "/images/bg-image-landing-page.png",
    },
    {
      id: 6,
      title: "Kurangnya Keterlibatan Pimpinan",
      desc: "Laporan eksekutif yang memudahkan pimpinan mengawasi semua aktivitas.",
      image: "/images/bg-image-landing-page.png",
    },
  ];

  return (
    <div className="w-screen relative pb-10 -ml-8 md:-ml-16 xl:-ml-[calc((100vw-1152px)/2)] overflow-hidden">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        loop={true}
        coverflowEffect={{
          rotate: 0,
          stretch: 80,
          depth: 250,
          modifier: 1.5,
          slideShadows: false,
        }}
        pagination={{
          clickable: true,
          el: ".problem-pagination",
          bulletClass: "swiper-pagination-bullet bg-slate-200 w-2.5 h-2.5 mx-1.5 rounded-full inline-block transition-colors cursor-pointer",
          bulletActiveClass: "bg-jade-700",
        }}
        navigation={{
          nextEl: ".problem-next",
          prevEl: ".problem-prev",
        }}
        modules={[EffectCoverflow, Pagination, Navigation]}
        className="w-full py-12"
      >
        {problems.map((prob) => (
          <SwiperSlide key={prob.id} className="swiper-slide-custom transition-all duration-300">
            {({ isActive }) => (
              <div className={`relative w-full h-62.5 sm:h-87.5 md:h-100 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 border-2 ${isActive ? 'border-jade-500 scale-100 opacity-100' : 'border-slate-200 scale-95 opacity-60'}`}>
                <Image src={prob.image} alt={prob.title} fill className="object-cover" />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <h3 className="text-white font-black text-xl md:text-3xl mb-2">{prob.title}</h3>
                  <p className="text-slate-200 font-medium text-sm md:text-base line-clamp-2">{prob.desc}</p>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button className="problem-prev w-12 h-12 rounded-full flex items-center justify-center bg-transparent sm:bg-white sm:shadow-sm text-jade-700 hover:bg-jade-700 hover:text-white hover:shadow-md transition-all z-10 shrink-0">
          <svg className="w-5 h-5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="problem-pagination flex items-center justify-center z-10 !w-auto !relative !bottom-0"></div>
        <button className="problem-next w-12 h-12 rounded-full flex items-center justify-center bg-transparent sm:bg-white sm:shadow-sm text-jade-700 hover:bg-jade-700 hover:text-white hover:shadow-md transition-all z-10 shrink-0">
          <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx global>{`
        .swiper-slide-custom {
          width: 280px;
        }
        @media (min-width: 640px) {
          .swiper-slide-custom {
            width: 450px;
          }
        }
        @media (min-width: 768px) {
          .swiper-slide-custom {
            width: 600px;
          }
        }
      `}</style>
    </div>
  );
}
