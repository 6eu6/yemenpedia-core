'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  BookOpen,
  Send
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Social links - these can be configured from admin in production
const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/yemenpedia', color: 'hover:bg-zinc-700' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/yemenpedia', color: 'hover:bg-zinc-700' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/yemenpedia', color: 'hover:bg-zinc-700' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/yemenpedia', color: 'hover:bg-zinc-700' },
]

export function Footer() {
  const locale = useLocale()
  const t = useTranslations()
  const currentYear = new Date().getFullYear()
  
  // Only Arabic is RTL
  const isRTL = locale === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  const footerLinks = {
    main: [
      { name: t('nav.home'), href: '/' },
      { name: t('nav.map'), href: '/map' },
      { name: t('nav.articles'), href: '/articles' },
      { name: t('nav.categories'), href: '/categories' },
    ],
    categories: [
      { name: t('categories.history'), href: '/category/history' },
      { name: t('categories.geography'), href: '/category/geography' },
      { name: t('categories.culture'), href: '/category/culture' },
      { name: t('categories.people'), href: '/category/people' },
      { name: t('categories.places'), href: '/category/places' },
      { name: t('categories.arts'), href: '/category/arts' },
    ],
    community: [
      { name: t('footer.joinUs'), href: '/auth/register' },
      { name: t('footer.howToContribute'), href: '/guide' },
      { name: t('footer.writingRules'), href: '/rules' },
      { name: t('footer.faq'), href: '/faq' },
    ],
    legal: [
      { name: t('footer.privacy'), href: '/privacy' },
      { name: t('footer.terms'), href: '/terms' },
      { name: t('footer.copyright'), href: '/copyright' },
      { name: t('footer.contactUs'), href: '/contact' },
    ],
  }

  return (
    // GOVERNANCE: Zinc color system - no flashy gradients
    <footer className="bg-zinc-900 text-zinc-300 relative overflow-hidden">
      {/* Minimal Top Border */}
      <div className="h-px bg-zinc-800" />
      
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              {/* GOVERNANCE: Simple zinc logo */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center"
              >
                <span className="text-lg font-bold text-zinc-900">Y</span>
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-zinc-50">Yemenpedia</h2>
                <p className="text-xs text-zinc-500">{t('common.nationalEncyclopedia')}</p>
              </div>
            </Link>
            
            <p className="text-sm text-zinc-400 mb-6 max-w-md leading-relaxed">
              <strong className="text-zinc-50">Yemenpedia</strong> {t('footer.aboutText')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-center gap-3 hover:text-zinc-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-zinc-400" />
                </div>
                <span>info@yemenpedia.org</span>
              </div>
              <div className="flex items-center gap-3 hover:text-zinc-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-zinc-400" />
                </div>
                <span dir="ltr">+967 1 234 5678</span>
              </div>
              <div className="flex items-center gap-3 hover:text-zinc-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                </div>
                <span>{t('footer.sanaa')}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className={`w-10 h-10 rounded-lg bg-zinc-800 hover:text-zinc-50 flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${social.color}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-zinc-50 font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-zinc-600 rounded-full" />
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.main.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm text-zinc-400 hover:text-zinc-50 ${dir === 'rtl' ? 'hover:pr-2' : 'hover:pl-2'} transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                  >
                    <span className="text-zinc-600 text-xs">{dir === 'rtl' ? '›' : '‹'}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-zinc-50 font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-zinc-600 rounded-full" />
              {t('footer.mainCategories')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm text-zinc-400 hover:text-zinc-50 ${dir === 'rtl' ? 'hover:pr-2' : 'hover:pl-2'} transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-500 rounded`}
                  >
                    <span className="text-zinc-600 text-xs">{dir === 'rtl' ? '›' : '‹'}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-zinc-50 font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-zinc-600 rounded-full" />
              {t('footer.newsletter')}
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              {t('footer.newsletterDesc')}
            </p>
            <form className="space-y-3">
              <Input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="bg-zinc-800 border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-blue-500 text-zinc-50 placeholder:text-zinc-500"
              />
              <Button className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500">
                <Send className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                {t('footer.subscribe')}
              </Button>
            </form>
            
            {/* Additional Links */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium text-zinc-50 mb-2">{t('footer.community')}</h4>
              <ul className="space-y-2">
                {footerLinks.community.slice(0, 3).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-400 hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800 bg-zinc-950/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-400 hover:text-zinc-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>© {currentYear} Yemenpedia.</span>
              <span className="flex items-center gap-1">
                {t('footer.madeWith')}
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Heart className="h-4 w-4 text-zinc-400 fill-zinc-400" />
                </motion.span>
                {t('footer.inYemen')}
              </span>
            </div>
          </div>
          
          {/* Academic Badge */}
          <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <BookOpen className="h-4 w-4" />
              <span>{t('footer.academicSource')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
