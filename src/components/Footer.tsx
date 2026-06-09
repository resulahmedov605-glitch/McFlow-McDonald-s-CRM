import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../store/useThemeStore'

const footerLinks = [
  { key: 'help', labelKey: 'footer.help' },
  { key: 'privacy', labelKey: 'footer.privacy' },
] as const

const contactLinks = [
  {
    title: 'GitHub',
    href: 'https://github.com/resulahmedov605-glitch',
  },
  {
    title: 'LinkedIn',
    href: 'https://www.linkedin.com/in/resul-ahmedov-342933348/',
  },
]

const Footer = () => {
  const theme = useThemeStore((state) => state.theme)
  const isLight = theme === 'light'
  const { t } = useTranslation()

  return (
    <footer
      className={`w-full border-t px-4 py-4 transition-colors duration-300 ${
        isLight
          ? 'border-gray-200 bg-white text-gray-700'
          : 'border-gray-600 bg-gray-800 text-gray-200'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <img
            src="McFlow.svg"
            alt={t('common.logoAlt')}
            className="size-10 rounded-xl"
          />

          <div>
            <p className="font-semibold">McFlow CRM</p>
            <p
              className={`text-sm ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              © {new Date().getFullYear()} McFlow. {t('footer.built')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
          {footerLinks.map((item) => (
            <button
              key={item.key}
              type="button"
              className="transition-colors duration-200 hover:text-amber-300 hover:cursor-pointer"
            >
              {t(item.labelKey)}
            </button>
          ))}

          {contactLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-200 hover:text-amber-300"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
