export async function GET() {
  const base = 'https://av9assist.vercel.app';
  const now = new Date().toISOString();
  const urls = [
    {
      loc: `${base}/`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      loc: `${base}/chat`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8',
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
