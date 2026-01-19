'use client';

import { useState, useEffect, SetStateAction } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ImageCarousels = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = [
    {
      image: '/carousel (1).jpg',
      link: 'https://booker.spotix.com.ng/create-event',
      alt: 'Carousel slide 1'
    },
    {
      image: '/carousel (2).jpg',
      link: 'https://spotix.com.ng/Referrals',
      alt: 'Carousel slide 2'
    },
    {
      image: '/carousel (3).jpg',
      link: 'https://booker.spotix.com.ng/listings',
      alt: 'Carousel slide 3'
    },
    {
      image: '/carousel (4).jpg',
      link: 'https://instagram.com/spotixnigeria',
      alt: 'Carousel slide 4'
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index: SetStateAction<number>) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };



  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '1024/540' }}>
        {/* Slides */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <Link
              key={index}
              href={slide.link}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Bullet Navigation */}
      <div className="flex justify-center gap-2 md:gap-3 mt-4 md:mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'scale-110 shadow-lg'
                : 'hover:scale-105 opacity-60 hover:opacity-80'
            }`}
            style={{ backgroundColor: '#6b2fa5' }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousels;