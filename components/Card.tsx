'use client';

import Link from 'next/link';

interface CardProps {
  title: string;
  description?: string;
  image?: string;
  href?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export default function Card({ 
  title, 
  description, 
  image, 
  href, 
  footer,
  onClick 
}: CardProps) {
  const CardContent = (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {image && (
        <div className="mb-4">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 text-sm mb-4 font-sans leading-relaxed">
          {description}
        </p>
      )}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

interface NewsCardProps {
  title: string;
  description: string;
  image?: string;
  date?: string;
  href?: string;
}

export function NewsCard({ title, description, image, date, href }: NewsCardProps) {
  return (
    <Card
      title={title}
      description={description}
      image={image}
      href={href}
      footer={
        date && (
          <div className="text-xs text-gray-500 font-sans">
            {new Date(date).toLocaleDateString()}
          </div>
        )
      }
    />
  );
}
