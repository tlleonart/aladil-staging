"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    src: "/carousel-1.jpg",
    alt: "ALADIL - Laboratorios de América Latina",
  },
  {
    src: "/carousel-2.jpg",
    alt: "ALADIL - Investigación científica",
  },
];

export const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
    },
    [Autoplay({ delay: 6000, stopOnInteraction: false })],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full h-[calc(100vh-64px)] min-h-[500px]">
      {/* Carousel */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide.src}
              className="relative flex-[0_0_100%] min-w-0 h-full"
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-white/40 z-10" />
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="100vw"
                priority={slide.src === slides[0].src}
                className="object-cover"
                quality={85}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center">
        <div className="container px-4 sm:px-6 md:px-8 text-center max-w-5xl">
          <div className="flex mb-4 sm:mb-6 items-center justify-center">
            <Image
              src="/logo.png"
              alt="ALADIL Logo"
              width={400}
              height={200}
              className="h-20 sm:h-24 md:h-28 lg:h-36 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-blue-900 leading-tight">
            Asociación Latinoamericana de Directores de Instituciones de
            Laboratorio
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mt-3 sm:mt-4 md:mt-6 max-w-3xl mx-auto text-blue-800 font-medium">
            Uniendo la excelencia en laboratorios a través de toda América
            Latina
          </p>
          <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/about">Conoce más sobre nosotros</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contáctanos</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        className="cursor-pointer absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2 sm:p-3 backdrop-blur-sm transition-colors"
        onClick={scrollPrev}
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-blue-900" />
      </button>

      <button
        type="button"
        className="cursor-pointer absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2 sm:p-3 backdrop-blur-sm transition-colors"
        onClick={scrollNext}
        aria-label="Siguiente slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-blue-900" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 flex justify-center gap-2">
        {scrollSnaps.map((snap, snapIndex) => (
          <button
            type="button"
            key={`dot-${snap}`}
            className={`cursor-pointer w-2 h-2 rounded-full transition-colors ${
              snapIndex === selectedIndex
                ? "bg-blue-600"
                : "bg-blue-600/40 hover:bg-blue-600/60"
            }`}
            onClick={() => emblaApi?.scrollTo(snapIndex)}
            aria-label={`Ir al slide ${snapIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
