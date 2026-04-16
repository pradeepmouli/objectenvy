import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json' with { type: 'json' };

export default defineConfig({
  title: 'objectenvy',
  description: 'Automatically map process.env to strongly-typed, nested config objects with camelCase fields',
  base: '/objectenvy/',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/objectenvy/favicon.svg' }],
    ['meta', { property: 'og:title', content: 'objectenvy' }],
    ['meta', { property: 'og:description', content: 'Automatically map process.env to strongly-typed, nested config objects with camelCase fields' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://pradeepmouli.github.io/objectenvy/' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'objectenvy' }],
    ['meta', { name: 'twitter:description', content: 'Automatically map process.env to strongly-typed, nested config objects with camelCase fields' }],
  ],
  sitemap: {
    hostname: 'https://pradeepmouli.github.io/objectenvy'
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/pradeepmouli/objectenvy' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Usage', link: '/guide/usage' }
          ]
        }
      ],
      '/api/': [
        { text: 'API Reference', items: typedocSidebar }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/pradeepmouli/objectenvy' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Pradeep Mouli'
    },
    search: { provider: 'local' }
  }
});
