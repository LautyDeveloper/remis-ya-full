import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  noindex?: boolean;
}

export function SEO({ title, description, noindex = false }: SEOProps) {
  const siteName = 'Sistema de Gestión de Remisería';
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
