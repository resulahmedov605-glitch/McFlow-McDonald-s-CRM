import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useLanguageStore } from '../store/useLanguageStore'

const initialLanguage = useLanguageStore.getState().language

i18n.use(initReactI18next).init({
  resources: {
    az: {
      translation: {
        nav: {
          tagline: "Ən yaxşı McDonald's CRM",
          help: 'Kömək',
          contact: 'Əlaqə',
          about: 'Haqqımızda',
          openMenu: 'Menyunu aç',
          closeMenu: 'Menyunu bağla',
        },
        language: {
          aria: 'Dili seç',
        },
        theme: {
          dark: 'Qaranlıq rejimə keç',
          light: 'İşıqlı rejimə keç',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Tam icazə',
          },
          cashier: {
            title: 'Kassir',
            description: 'Satış və kassa',
          },
          warehouse: {
            title: 'Anbardar',
            description: 'Stok və anbar',
          },
        },
        login: {
          eyebrow: 'Restoran CRM',
          title: 'Xoş gəldiniz',
          subtitle: 'Məlumatlarınızı daxil edin',
          username: 'İstifadəçi adı və ya email',
          password: 'Şifrə',
          showPassword: 'Şifrəni göstər',
          hidePassword: 'Şifrəni gizlət',
          submit: 'Daxil ol',
          checking: 'Yoxlanılır...',
          validation: {
            usernameRequired: 'İstifadəçi adı boş ola bilməz',
            usernameMin: 'İstifadəçi adı minimum 3 simvol olmalıdır',
            passwordRequired: 'Şifrə boş ola bilməz',
            passwordMin: 'Şifrə minimum 6 simvol olmalıdır',
          },
          toast: {
            invalid: 'Form məlumatlarını yoxlayın!',
            loading: 'Giriş yoxlanılır...',
            success: 'Xoş gəldiniz',
            error: 'Giriş uğursuz oldu',
          },
        },
        verify: {
          title: 'Verify kodu',
          subtitle: 'Authenticator tətbiqindəki 6 rəqəmli kodu daxil edin',
          usernameOrEmail: 'İstifadəçi adı və ya email',
          code: 'Code',
          digitAria: '{{index}}-ci rəqəm',
          qrAlt: 'Verify QR',
          toast: {
            loading: 'Kod təsdiqlənir...',
            success: 'Kod təsdiq olundu',
            error: 'Kod təsdiq olunmadı',
          },
        },
        footer: {
          help: 'Kömək',
          privacy: 'Məxfilik',
          built: 'Restoran əməliyyatları üçün hazırlanıb.',
        },
      },
    },
    tr: {
      translation: {
        nav: {
          tagline: "En iyi McDonald's CRM",
          help: 'Yardım',
          contact: 'İletişim',
          about: 'Hakkımızda',
          openMenu: 'Menüyü aç',
          closeMenu: 'Menüyü kapat',
        },
        language: {
          aria: 'Dil seç',
        },
        theme: {
          dark: 'Karanlık moda geç',
          light: 'Aydınlık moda geç',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Tam yetki',
          },
          cashier: {
            title: 'Kasiyer',
            description: 'Satış ve kasa',
          },
          warehouse: {
            title: 'Depocu',
            description: 'Stok ve depo',
          },
        },
        login: {
          eyebrow: 'Restoran CRM',
          title: 'Hoş geldiniz',
          subtitle: 'Bilgilerinizi girin',
          username: 'Username or Email',
          password: 'Şifre',
          showPassword: 'Şifreyi göster',
          hidePassword: 'Şifreyi gizle',
          submit: 'Giriş yap',
          checking: 'Kontrol ediliyor...',
          validation: {
            usernameRequired: 'Kullanıcı adı boş olamaz',
            usernameMin: 'Kullanıcı adı en az 3 karakter olmalıdır',
            passwordRequired: 'Şifre boş olamaz',
            passwordMin: 'Şifre en az 6 karakter olmalıdır',
          },
          toast: {
            invalid: 'Form bilgilerini kontrol edin!',
            loading: 'Giriş kontrol ediliyor...',
            success: 'Hoş geldiniz',
            error: 'Giriş başarısız oldu',
          },
        },
        verify: {
          title: 'Doğrulama kodu',
          subtitle: 'Authenticator uygulamasındaki 6 haneli kodu girin',
          usernameOrEmail: 'Kullanıcı adı veya e-posta',
          code: 'Kod',
          digitAria: '{{index}}. rakam',
          qrAlt: 'Doğrulama QR',
          toast: {
            loading: 'Kod doğrulanıyor...',
            success: 'Kod doğrulandı',
            error: 'Kod doğrulanamadı',
          },
        },
        footer: {
          help: 'Yardım',
          privacy: 'Gizlilik',
          built: 'Restoran operasyonları için geliştirildi.',
        },
      },
    },
    en: {
      translation: {
        nav: {
          tagline: "Best McDonald's CRM",
          help: 'Help',
          contact: 'Contact Us',
          about: 'About Us',
          openMenu: 'Open menu',
          closeMenu: 'Close menu',
        },
        language: {
          aria: 'Choose language',
        },
        theme: {
          dark: 'Switch to dark mode',
          light: 'Switch to light mode',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Full access',
          },
          cashier: {
            title: 'Cashier',
            description: 'Sales and checkout',
          },
          warehouse: {
            title: 'Warehouse',
            description: 'Stock and storage',
          },
        },
        login: {
          eyebrow: 'Restaurant CRM',
          title: 'Welcome back',
          subtitle: 'Enter your credentials',
          username: 'Username or Email',
          password: 'Password',
          showPassword: 'Show password',
          hidePassword: 'Hide password',
          submit: 'Sign in',
          checking: 'Checking...',
          validation: {
            usernameRequired: 'Username cannot be empty',
            usernameMin: 'Username must be at least 3 characters',
            passwordRequired: 'Password cannot be empty',
            passwordMin: 'Password must be at least 6 characters',
          },
          toast: {
            invalid: 'Check the form details!',
            loading: 'Checking login...',
            success: 'Welcome back',
            error: 'Login failed',
          },
        },
        verify: {
          title: 'Verification code',
          subtitle: 'Enter the 6-digit code from your authenticator app',
          usernameOrEmail: 'Username or email',
          code: 'Code',
          digitAria: 'Digit {{index}}',
          qrAlt: 'Verification QR',
          toast: {
            loading: 'Verifying code...',
            success: 'Code verified',
            error: 'Code could not be verified',
          },
        },
        footer: {
          help: 'Help',
          privacy: 'Privacy',
          built: 'Built for restaurant operations.',
        },
      },
    },
    de: {
      translation: {
        nav: {
          tagline: "Bestes McDonald's CRM",
          help: 'Hilfe',
          contact: 'Kontakt',
          about: 'Über uns',
          openMenu: 'Menü öffnen',
          closeMenu: 'Menü schließen',
        },
        language: {
          aria: 'Sprache wählen',
        },
        theme: {
          dark: 'Zum dunklen Modus wechseln',
          light: 'Zum hellen Modus wechseln',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Voller Zugriff',
          },
          cashier: {
            title: 'Kassierer',
            description: 'Verkauf und Kasse',
          },
          warehouse: {
            title: 'Lager',
            description: 'Bestand und Lager',
          },
        },
        login: {
          eyebrow: 'Restaurant CRM',
          title: 'Willkommen zurück',
          subtitle: 'Anmeldedaten eingeben',
          username: 'Username or Email',
          password: 'Passwort',
          showPassword: 'Passwort anzeigen',
          hidePassword: 'Passwort ausblenden',
          submit: 'Anmelden',
          checking: 'Wird geprüft...',
          validation: {
            usernameRequired: 'Benutzername darf nicht leer sein',
            usernameMin: 'Benutzername muss mindestens 3 Zeichen haben',
            passwordRequired: 'Passwort darf nicht leer sein',
            passwordMin: 'Passwort muss mindestens 6 Zeichen haben',
          },
          toast: {
            invalid: 'Formulardaten prüfen!',
            loading: 'Anmeldung wird geprüft...',
            success: 'Willkommen zurück',
            error: 'Anmeldung fehlgeschlagen',
          },
        },
        verify: {
          title: 'Bestätigungscode',
          subtitle: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein',
          usernameOrEmail: 'Benutzername oder E-Mail',
          code: 'Code',
          digitAria: 'Ziffer {{index}}',
          qrAlt: 'Bestätigungs-QR',
          toast: {
            loading: 'Code wird bestätigt...',
            success: 'Code bestätigt',
            error: 'Code konnte nicht bestätigt werden',
          },
        },
        footer: {
          help: 'Hilfe',
          privacy: 'Datenschutz',
          built: 'Entwickelt für Restaurantabläufe.',
        },
      },
    },
    ru: {
      translation: {
        nav: {
          tagline: "Лучший McDonald's CRM",
          help: 'Помощь',
          contact: 'Контакты',
          about: 'О нас',
          openMenu: 'Открыть меню',
          closeMenu: 'Закрыть меню',
        },
        language: {
          aria: 'Выбрать язык',
        },
        theme: {
          dark: 'Переключить на темную тему',
          light: 'Переключить на светлую тему',
        },
        roles: {
          admin: {
            title: 'Админ',
            description: 'Полный доступ',
          },
          cashier: {
            title: 'Кассир',
            description: 'Продажи и касса',
          },
          warehouse: {
            title: 'Кладовщик',
            description: 'Запасы и склад',
          },
        },
        login: {
          eyebrow: 'CRM ресторана',
          title: 'Добро пожаловать',
          subtitle: 'Введите данные для входа',
          username: 'Username or Email',
          password: 'Пароль',
          showPassword: 'Показать пароль',
          hidePassword: 'Скрыть пароль',
          submit: 'Войти',
          checking: 'Проверяем...',
          validation: {
            usernameRequired: 'Имя пользователя не может быть пустым',
            usernameMin: 'Имя пользователя должно быть не короче 3 символов',
            passwordRequired: 'Пароль не может быть пустым',
            passwordMin: 'Пароль должен быть не короче 6 символов',
          },
          toast: {
            invalid: 'Проверьте данные формы!',
            loading: 'Проверяем вход...',
            success: 'Добро пожаловать',
            error: 'Не удалось войти',
          },
        },
        verify: {
          title: 'Код подтверждения',
          subtitle: 'Введите 6-значный код из приложения-аутентификатора',
          usernameOrEmail: 'Имя пользователя или email',
          code: 'Код',
          digitAria: 'Цифра {{index}}',
          qrAlt: 'QR подтверждения',
          toast: {
            loading: 'Проверяем код...',
            success: 'Код подтвержден',
            error: 'Не удалось подтвердить код',
          },
        },
        footer: {
          help: 'Помощь',
          privacy: 'Конфиденциальность',
          built: 'Создано для ресторанных операций.',
        },
      },
    },
    fr: {
      translation: {
        nav: {
          tagline: "Le meilleur CRM McDonald's",
          help: 'Aide',
          contact: 'Contact',
          about: 'À propos',
          openMenu: 'Ouvrir le menu',
          closeMenu: 'Fermer le menu',
        },
        language: {
          aria: 'Choisir la langue',
        },
        theme: {
          dark: 'Passer au mode sombre',
          light: 'Passer au mode clair',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Accès complet',
          },
          cashier: {
            title: 'Caissier',
            description: 'Ventes et caisse',
          },
          warehouse: {
            title: 'Entrepôt',
            description: 'Stock et réserve',
          },
        },
        login: {
          eyebrow: 'CRM restaurant',
          title: 'Bon retour',
          subtitle: 'Saisissez vos identifiants',
          username: 'Username or Email',
          password: 'Mot de passe',
          showPassword: 'Afficher le mot de passe',
          hidePassword: 'Masquer le mot de passe',
          submit: 'Se connecter',
          checking: 'Vérification...',
          validation: {
            usernameRequired: "Le nom d'utilisateur est obligatoire",
            usernameMin:
              "Le nom d'utilisateur doit contenir au moins 3 caractères",
            passwordRequired: 'Le mot de passe est obligatoire',
            passwordMin: 'Le mot de passe doit contenir au moins 6 caractères',
          },
          toast: {
            invalid: 'Vérifiez les informations du formulaire!',
            loading: 'Vérification de la connexion...',
            success: 'Bon retour',
            error: 'Connexion échouée',
          },
        },
        verify: {
          title: 'Code de vérification',
          subtitle: "Saisissez le code à 6 chiffres de votre application d'authentification",
          usernameOrEmail: "Nom d'utilisateur ou e-mail",
          code: 'Code',
          digitAria: 'Chiffre {{index}}',
          qrAlt: 'QR de vérification',
          toast: {
            loading: 'Vérification du code...',
            success: 'Code vérifié',
            error: 'Le code n’a pas pu être vérifié',
          },
        },
        footer: {
          help: 'Aide',
          privacy: 'Confidentialité',
          built: 'Conçu pour les opérations de restaurant.',
        },
      },
    },
    es: {
      translation: {
        nav: {
          tagline: "El mejor CRM de McDonald's",
          help: 'Ayuda',
          contact: 'Contacto',
          about: 'Sobre nosotros',
          openMenu: 'Abrir menú',
          closeMenu: 'Cerrar menú',
        },
        language: {
          aria: 'Elegir idioma',
        },
        theme: {
          dark: 'Cambiar al modo oscuro',
          light: 'Cambiar al modo claro',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Acceso completo',
          },
          cashier: {
            title: 'Cajero',
            description: 'Ventas y caja',
          },
          warehouse: {
            title: 'Almacén',
            description: 'Stock y almacén',
          },
        },
        login: {
          eyebrow: 'CRM de restaurante',
          title: 'Bienvenido de nuevo',
          subtitle: 'Introduce tus credenciales',
          username: 'Username or Email',
          password: 'Contraseña',
          showPassword: 'Mostrar contraseña',
          hidePassword: 'Ocultar contraseña',
          submit: 'Iniciar sesión',
          checking: 'Comprobando...',
          validation: {
            usernameRequired: 'El usuario no puede estar vacío',
            usernameMin: 'El usuario debe tener al menos 3 caracteres',
            passwordRequired: 'La contraseña no puede estar vacía',
            passwordMin: 'La contraseña debe tener al menos 6 caracteres',
          },
          toast: {
            invalid: 'Revisa los datos del formulario!',
            loading: 'Comprobando inicio de sesión...',
            success: 'Bienvenido de nuevo',
            error: 'Error al iniciar sesión',
          },
        },
        verify: {
          title: 'Código de verificación',
          subtitle: 'Introduce el código de 6 dígitos de tu app de autenticación',
          usernameOrEmail: 'Usuario o correo electrónico',
          code: 'Código',
          digitAria: 'Dígito {{index}}',
          qrAlt: 'QR de verificación',
          toast: {
            loading: 'Verificando código...',
            success: 'Código verificado',
            error: 'No se pudo verificar el código',
          },
        },
        footer: {
          help: 'Ayuda',
          privacy: 'Privacidad',
          built: 'Creado para operaciones de restaurante.',
        },
      },
    },
    it: {
      translation: {
        nav: {
          tagline: "Il miglior CRM McDonald's",
          help: 'Aiuto',
          contact: 'Contatti',
          about: 'Chi siamo',
          openMenu: 'Apri menu',
          closeMenu: 'Chiudi menu',
        },
        language: {
          aria: 'Scegli lingua',
        },
        theme: {
          dark: 'Passa alla modalità scura',
          light: 'Passa alla modalità chiara',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Accesso completo',
          },
          cashier: {
            title: 'Cassiere',
            description: 'Vendite e cassa',
          },
          warehouse: {
            title: 'Magazzino',
            description: 'Stock e deposito',
          },
        },
        login: {
          eyebrow: 'CRM ristorante',
          title: 'Bentornato',
          subtitle: 'Inserisci le credenziali',
          username: 'Username or Email',
          password: 'Password',
          showPassword: 'Mostra password',
          hidePassword: 'Nascondi password',
          submit: 'Accedi',
          checking: 'Controllo...',
          validation: {
            usernameRequired: 'Il nome utente non può essere vuoto',
            usernameMin: 'Il nome utente deve avere almeno 3 caratteri',
            passwordRequired: 'La password non può essere vuota',
            passwordMin: 'La password deve avere almeno 6 caratteri',
          },
          toast: {
            invalid: 'Controlla i dati del modulo!',
            loading: "Controllo dell'accesso...",
            success: 'Bentornato',
            error: 'Accesso non riuscito',
          },
        },
        verify: {
          title: 'Codice di verifica',
          subtitle: "Inserisci il codice a 6 cifre dall'app di autenticazione",
          usernameOrEmail: 'Nome utente o email',
          code: 'Codice',
          digitAria: 'Cifra {{index}}',
          qrAlt: 'QR di verifica',
          toast: {
            loading: 'Verifica del codice...',
            success: 'Codice verificato',
            error: 'Impossibile verificare il codice',
          },
        },
        footer: {
          help: 'Aiuto',
          privacy: 'Privacy',
          built: 'Creato per le operazioni di ristorazione.',
        },
      },
    },
    pt: {
      translation: {
        nav: {
          tagline: "O melhor CRM McDonald's",
          help: 'Ajuda',
          contact: 'Contato',
          about: 'Sobre nós',
          openMenu: 'Abrir menu',
          closeMenu: 'Fechar menu',
        },
        language: {
          aria: 'Escolher idioma',
        },
        theme: {
          dark: 'Mudar para modo escuro',
          light: 'Mudar para modo claro',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Acesso completo',
          },
          cashier: {
            title: 'Caixa',
            description: 'Vendas e caixa',
          },
          warehouse: {
            title: 'Armazém',
            description: 'Estoque e armazém',
          },
        },
        login: {
          eyebrow: 'CRM de restaurante',
          title: 'Bem-vindo de volta',
          subtitle: 'Insira suas credenciais',
          username: 'Username or Email',
          password: 'Senha',
          showPassword: 'Mostrar senha',
          hidePassword: 'Ocultar senha',
          submit: 'Entrar',
          checking: 'Verificando...',
          validation: {
            usernameRequired: 'O usuário não pode ficar vazio',
            usernameMin: 'O usuário deve ter pelo menos 3 caracteres',
            passwordRequired: 'A senha não pode ficar vazia',
            passwordMin: 'A senha deve ter pelo menos 6 caracteres',
          },
          toast: {
            invalid: 'Verifique os dados do formulário!',
            loading: 'Verificando login...',
            success: 'Bem-vindo de volta',
            error: 'Falha ao entrar',
          },
        },
        verify: {
          title: 'Código de verificação',
          subtitle: 'Insira o código de 6 dígitos do app autenticador',
          usernameOrEmail: 'Usuário ou e-mail',
          code: 'Código',
          digitAria: 'Dígito {{index}}',
          qrAlt: 'QR de verificação',
          toast: {
            loading: 'Verificando código...',
            success: 'Código verificado',
            error: 'Não foi possível verificar o código',
          },
        },
        footer: {
          help: 'Ajuda',
          privacy: 'Privacidade',
          built: 'Criado para operações de restaurante.',
        },
      },
    },
    nl: {
      translation: {
        nav: {
          tagline: "Beste McDonald's CRM",
          help: 'Help',
          contact: 'Contact',
          about: 'Over ons',
          openMenu: 'Menu openen',
          closeMenu: 'Menu sluiten',
        },
        language: {
          aria: 'Taal kiezen',
        },
        theme: {
          dark: 'Naar donkere modus',
          light: 'Naar lichte modus',
        },
        roles: {
          admin: {
            title: 'Admin',
            description: 'Volledige toegang',
          },
          cashier: {
            title: 'Kassier',
            description: 'Verkoop en kassa',
          },
          warehouse: {
            title: 'Magazijn',
            description: 'Voorraad en opslag',
          },
        },
        login: {
          eyebrow: 'Restaurant CRM',
          title: 'Welkom terug',
          subtitle: 'Voer je inloggegevens in',
          username: 'Username or Email',
          password: 'Wachtwoord',
          showPassword: 'Wachtwoord tonen',
          hidePassword: 'Wachtwoord verbergen',
          submit: 'Inloggen',
          checking: 'Controleren...',
          validation: {
            usernameRequired: 'Gebruikersnaam mag niet leeg zijn',
            usernameMin: 'Gebruikersnaam moet minimaal 3 tekens bevatten',
            passwordRequired: 'Wachtwoord mag niet leeg zijn',
            passwordMin: 'Wachtwoord moet minimaal 6 tekens bevatten',
          },
          toast: {
            invalid: 'Controleer de formuliergegevens!',
            loading: 'Login controleren...',
            success: 'Welkom terug',
            error: 'Inloggen mislukt',
          },
        },
        verify: {
          title: 'Verificatiecode',
          subtitle: 'Voer de 6-cijferige code uit je authenticator-app in',
          usernameOrEmail: 'Gebruikersnaam of e-mail',
          code: 'Code',
          digitAria: 'Cijfer {{index}}',
          qrAlt: 'Verificatie-QR',
          toast: {
            loading: 'Code controleren...',
            success: 'Code gecontroleerd',
            error: 'Code kon niet worden gecontroleerd',
          },
        },
        footer: {
          help: 'Help',
          privacy: 'Privacy',
          built: 'Gebouwd voor restaurantactiviteiten.',
        },
      },
    },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

document.documentElement.lang = initialLanguage

export default i18n
