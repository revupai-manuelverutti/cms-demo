'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  href?: string;
}

export default function Logo({ 
  src, 
  alt, 
  width = 150, 
  height = 50,
  href 
}: LogoProps) {
  const ImageComponent = (
    <div className="flex items-center justify-center bg-transparent">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center justify-center">
        {ImageComponent}
      </Link>
    );
  }

  return ImageComponent;
}
