export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/'],
    },
    sitemap: 'https://cobblynstudio.com/sitemap.xml',
  }
}
