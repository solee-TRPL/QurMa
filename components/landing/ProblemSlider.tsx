"use client";

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";

export default function ProblemSlider() {
  const problems = [
    {
      id: 1,
      title: "Manajemen Data Tidak Akurat",
      desc: "QurMa membantu menyinkronkan data hafalan agar selalu real-time.",
      image: "/images/data_management_v2.png",
    },
    {
      id: 2,
      title: "Wali Santri Sulit Memantau",
      desc: "Akses mudah bagi orang tua untuk memantau hafalan anak dari rumah.",
      image: "/images/parent_monitoring_v2.png",
    },
    {
      id: 3,
      title: "Target Hafalan Tidak Jelas",
      desc: "Buat target yang terukur untuk menjamin ketercapaian hafalan santri.",
      image: "/images/clear_target_v2.png",
    },
    {
      id: 4,
      title: "Rekapitulasi Hafalan Repot",
      desc: "Otomatisasi raport dan rekapitulasi capaian tahfidz dalam satu sentuhan.",
      image: "/images/easy_report_v2.png",
    },
    {
      id: 5,
      title: "Sulit Mengontrol Pengajar",
      desc: "Sistem absensi dan log mengajar yang transparan bagi pimpinan.",
      image: "/images/teacher_control_v2.png",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const duplicatedProblems = Array.from({ length: 20 }, () => problems).flat();

  return (
    <div className="relative pb-10 overflow-hidden w-screen left-1/2 -translate-x-1/2">
      <Swiper
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        spaceBetween={24}
        loop={true}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex % 5)}
        navigation={{
          nextEl: ".problem-next",
          prevEl: ".problem-prev",
        }}
        modules={[Navigation]}
        className="w-full py-12"
      >
        {duplicatedProblems.map((prob, index) => (
          <SwiperSlide key={`${prob.id}-${index}`} className="swiper-slide-fixed">
            {({ isActive }) => (
              <div className={`inner-card relative rounded-2xl overflow-hidden border-2 ${isActive ? "border-jade-500 opacity-100 shadow-2xl shadow-jade-900/20" : "border-slate-200 opacity-60 shadow-none"}`}>
                <Image src={prob.image} alt={prob.title} fill className="object-cover" />
                {/* Overlay Gradient and Text */}
                <div className={`absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8 transition-opacity ${isActive ? 'opacity-100 duration-500 delay-400' : 'opacity-0 duration-200 delay-0'}`}>
                  <h3 className="text-white font-black text-[17px] leading-[1.2] sm:text-xl md:text-3xl mb-1.5 sm:mb-2">{prob.title}</h3>
                  <p className="text-slate-200 font-medium text-xs sm:text-sm md:text-base line-clamp-2 leading-snug">{prob.desc}</p>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex items-center justify-center gap-6 mt-8">
        <button className="problem-prev w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-jade-700 hover:bg-jade-700 hover:text-white active:ring-2 active:ring-offset-2 active:ring-jade-700 transition-all z-10 shrink-0 outline-none">
          <svg className="w-5 h-5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="problem-pagination flex items-center justify-center z-10 w-auto! relative! bottom-0!">
          {problems.map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 mx-1.5 rounded-full inline-block transition-all border-2 ${activeIndex === i ? "bg-jade-700 border-jade-700" : "bg-transparent border-jade-600"}`}
            ></span>
          ))}
        </div>
        <button className="problem-next w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-jade-700 hover:bg-jade-700 hover:text-white active:ring-2 active:ring-offset-2 active:ring-jade-700 transition-all z-10 shrink-0 outline-none">
          <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <style jsx global>{`
        :root {
          --active-width: 270px;
          --inactive-width: 90px;
          --offset: 90px;
          --base-height: 250px;
        }
        @media (min-width: 640px) {
          :root {
            --active-width: 450px;
            --inactive-width: 150px;
            --offset: 150px;
            --base-height: 350px;
          }
        }
        @media (min-width: 768px) {
          :root {
            --active-width: 600px;
            --inactive-width: 200px;
            --offset: 200px;
            --base-height: 400px;
          }
        }

        .swiper-slide-fixed {
          /* Fixed wrapper width so Swiper's grid calculations never jump! */
          width: var(--inactive-width) !important;
          height: var(--base-height);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inner-card {
          /* Inactive slides default to being pushed LEFT */
          position: relative;
          flex-shrink: 0;
          width: var(--inactive-width);
          height: 75%; /* Card 3 (Outermost): noticeably shorter */
          transform: translateX(calc(-1 * var(--offset)));
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        /* Card 2 (Adjacent): moderately shorter */
        .swiper-slide-prev .inner-card,
        .swiper-slide-next .inner-card {
          height: 88%;
        }

        .swiper-slide-active .inner-card {
          /* Active slide expands and centers itself */
          width: var(--active-width);
          height: 100%; /* Card 1 (Center): full height */
          transform: translateX(0);
          z-index: 10;
        }

        .swiper-slide-active ~ .swiper-slide .inner-card {
          /* Inactive slides on the RIGHT are pushed RIGHT */
          transform: translateX(var(--offset));
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
