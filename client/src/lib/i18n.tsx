// Internationalization utilities
export type Language = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export interface TranslationKeys {
  // Navigation
  'nav.overview': string;
  'nav.budgets': string;
  'nav.projects': string;
  'nav.spending': string;
  'nav.reports': string;
  'nav.search.placeholder': string;
  'nav.search.clear': string;
  'nav.report.issue': string;
  'nav.toggle.theme': string;
  'nav.language': string;
  
  // Filters
  'filter.department': string;
  'filter.region': string;
  'filter.status': string;
  'filter.category': string;
  'filter.all': string;
  'filter.reset': string;
  
  // Overview
  'overview.title': string;
  'overview.metrics': string;
  'overview.allocated': string;
  'overview.spent': string;
  'overview.utilization': string;
  'overview.transparency': string;
  'overview.projects.title': string;
  'overview.projects.recent': string;
  
  // Common
  'common.loading': string;
  'common.error': string;
  'common.save': string;
  'common.cancel': string;
  'common.close': string;
  'common.export': string;
  'common.compare': string;
  'common.watch': string;
  'common.details': string;
  'common.progress': string;
  'common.status': string;
  'common.budget': string;
  'common.spent': string;
  'common.department': string;
  'common.region': string;
  'common.updated': string;
  
  // Status
  'status.on-track': string;
  'status.delayed': string;
  'status.at-risk': string;
  'status.completed': string;
  
  // Accessibility
  'a11y.skip.content': string;
  'a11y.menu.main': string;
  'a11y.sort.by': string;
  'a11y.close.modal': string;
  'a11y.close.details': string;
  'a11y.progress.bar': string;
  'a11y.high.contrast': string;
  'a11y.text.size': string;
  'a11y.voice.toggle': string;
  
  // Help
  'help.tooltip.budget': string;
  'help.tooltip.progress': string;
  'help.tooltip.transparency': string;
  'help.guide.welcome': string;
  'help.guide.navigation': string;
  'help.guide.filters': string;
}

const translations: Record<Language, TranslationKeys> = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.budgets': 'Budgets',
    'nav.projects': 'Projects',
    'nav.spending': 'Spending',
    'nav.reports': 'Reports',
    'nav.search.placeholder': 'Search...',
    'nav.search.clear': 'Clear',
    'nav.report.issue': 'Report Issue',
    'nav.toggle.theme': 'Toggle theme',
    'nav.language': 'Language',
    
    // Filters
    'filter.department': 'Department',
    'filter.region': 'Region',
    'filter.status': 'Status',
    'filter.category': 'Category',
    'filter.all': 'All',
    'filter.reset': 'Reset',
    
    // Overview
    'overview.title': 'Government Transparency Dashboard',
    'overview.metrics': 'Key Metrics',
    'overview.allocated': 'Total Allocated',
    'overview.spent': 'Total Spent',
    'overview.utilization': 'Overall Utilization',
    'overview.transparency': 'Transparency Index',
    'overview.projects.title': 'Recent Projects',
    'overview.projects.recent': 'Latest project updates',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.export': 'Export',
    'common.compare': 'Compare',
    'common.watch': 'Watch',
    'common.details': 'Details',
    'common.progress': 'Progress',
    'common.status': 'Status',
    'common.budget': 'Budget',
    'common.spent': 'Spent',
    'common.department': 'Department',
    'common.region': 'Region',
    'common.updated': 'Updated',
    
    // Status
    'status.on-track': 'On Track',
    'status.delayed': 'Delayed',
    'status.at-risk': 'At Risk',
    'status.completed': 'Completed',
    
    // Accessibility
    'a11y.skip.content': 'Skip to main content',
    'a11y.menu.main': 'Main navigation',
    'a11y.sort.by': 'Sort by',
    'a11y.close.modal': 'Close modal',
    'a11y.close.details': 'Close details',
    'a11y.progress.bar': 'Progress indicator',
    'a11y.high.contrast': 'Toggle high contrast',
    'a11y.text.size': 'Adjust text size',
    'a11y.voice.toggle': 'Toggle voice output',
    
    // Help
    'help.tooltip.budget': 'Total budget allocated vs amount spent',
    'help.tooltip.progress': 'Project completion percentage',
    'help.tooltip.transparency': 'Calculated based on budget utilization and report resolution',
    'help.guide.welcome': 'Welcome to GovTrack - your government transparency dashboard',
    'help.guide.navigation': 'Use the tabs to navigate between different sections',
    'help.guide.filters': 'Apply filters to narrow down the data you want to see',
  },
  es: {
    // Navigation
    'nav.overview': 'Resumen',
    'nav.budgets': 'Presupuestos',
    'nav.projects': 'Proyectos',
    'nav.spending': 'Gastos',
    'nav.reports': 'Informes',
    'nav.search.placeholder': 'Buscar...',
    'nav.search.clear': 'Limpiar',
    'nav.report.issue': 'Reportar Problema',
    'nav.toggle.theme': 'Cambiar tema',
    'nav.language': 'Idioma',
    
    // Filters
    'filter.department': 'Departamento',
    'filter.region': 'Región',
    'filter.status': 'Estado',
    'filter.category': 'Categoría',
    'filter.all': 'Todos',
    'filter.reset': 'Restablecer',
    
    // Overview
    'overview.title': 'Panel de Transparencia Gubernamental',
    'overview.metrics': 'Métricas Clave',
    'overview.allocated': 'Total Asignado',
    'overview.spent': 'Total Gastado',
    'overview.utilization': 'Utilización General',
    'overview.transparency': 'Índice de Transparencia',
    'overview.projects.title': 'Proyectos Recientes',
    'overview.projects.recent': 'Últimas actualizaciones de proyectos',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.export': 'Exportar',
    'common.compare': 'Comparar',
    'common.watch': 'Observar',
    'common.details': 'Detalles',
    'common.progress': 'Progreso',
    'common.status': 'Estado',
    'common.budget': 'Presupuesto',
    'common.spent': 'Gastado',
    'common.department': 'Departamento',
    'common.region': 'Región',
    'common.updated': 'Actualizado',
    
    // Status
    'status.on-track': 'En Curso',
    'status.delayed': 'Retrasado',
    'status.at-risk': 'En Riesgo',
    'status.completed': 'Completado',
    
    // Accessibility
    'a11y.skip.content': 'Saltar al contenido principal',
    'a11y.menu.main': 'Navegación principal',
    'a11y.sort.by': 'Ordenar por',
    'a11y.close.modal': 'Cerrar modal',
    'a11y.close.details': 'Cerrar detalles',
    'a11y.progress.bar': 'Indicador de progreso',
    'a11y.high.contrast': 'Alternar alto contraste',
    'a11y.text.size': 'Ajustar tamaño de texto',
    'a11y.voice.toggle': 'Alternar salida de voz',
    
    // Help
    'help.tooltip.budget': 'Presupuesto total asignado vs cantidad gastada',
    'help.tooltip.progress': 'Porcentaje de finalización del proyecto',
    'help.tooltip.transparency': 'Calculado basado en la utilización del presupuesto y resolución de informes',
    'help.guide.welcome': 'Bienvenido a GovTrack - tu panel de transparencia gubernamental',
    'help.guide.navigation': 'Usa las pestañas para navegar entre diferentes secciones',
    'help.guide.filters': 'Aplica filtros para reducir los datos que quieres ver',
  },
  fr: {
    // Navigation
    'nav.overview': 'Aperçu',
    'nav.budgets': 'Budgets',
    'nav.projects': 'Projets',
    'nav.spending': 'Dépenses',
    'nav.reports': 'Rapports',
    'nav.search.placeholder': 'Rechercher...',
    'nav.search.clear': 'Effacer',
    'nav.report.issue': 'Signaler un Problème',
    'nav.toggle.theme': 'Changer le thème',
    'nav.language': 'Langue',
    
    // Filters
    'filter.department': 'Département',
    'filter.region': 'Région',
    'filter.status': 'Statut',
    'filter.category': 'Catégorie',
    'filter.all': 'Tous',
    'filter.reset': 'Réinitialiser',
    
    // Overview
    'overview.title': 'Tableau de Bord de Transparence Gouvernementale',
    'overview.metrics': 'Métriques Clés',
    'overview.allocated': 'Total Alloué',
    'overview.spent': 'Total Dépensé',
    'overview.utilization': 'Utilisation Globale',
    'overview.transparency': 'Indice de Transparence',
    'overview.projects.title': 'Projets Récents',
    'overview.projects.recent': 'Dernières mises à jour des projets',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur survenue',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.export': 'Exporter',
    'common.compare': 'Comparer',
    'common.watch': 'Surveiller',
    'common.details': 'Détails',
    'common.progress': 'Progrès',
    'common.status': 'Statut',
    'common.budget': 'Budget',
    'common.spent': 'Dépensé',
    'common.department': 'Département',
    'common.region': 'Région',
    'common.updated': 'Mis à jour',
    
    // Status
    'status.on-track': 'Sur la Bonne Voie',
    'status.delayed': 'Retardé',
    'status.at-risk': 'À Risque',
    'status.completed': 'Terminé',
    
    // Accessibility
    'a11y.skip.content': 'Aller au contenu principal',
    'a11y.menu.main': 'Navigation principale',
    'a11y.sort.by': 'Trier par',
    'a11y.close.modal': 'Fermer la modale',
    'a11y.close.details': 'Fermer les détails',
    'a11y.progress.bar': 'Indicateur de progrès',
    'a11y.high.contrast': 'Basculer le contraste élevé',
    'a11y.text.size': 'Ajuster la taille du texte',
    'a11y.voice.toggle': 'Basculer la sortie vocale',
    
    // Help
    'help.tooltip.budget': 'Budget total alloué vs montant dépensé',
    'help.tooltip.progress': 'Pourcentage d\'achèvement du projet',
    'help.tooltip.transparency': 'Calculé basé sur l\'utilisation du budget et la résolution des rapports',
    'help.guide.welcome': 'Bienvenue sur GovTrack - votre tableau de bord de transparence gouvernementale',
    'help.guide.navigation': 'Utilisez les onglets pour naviguer entre les différentes sections',
    'help.guide.filters': 'Appliquez des filtres pour affiner les données que vous voulez voir',
  },
  pt: {
    // Navigation
    'nav.overview': 'Visão Geral',
    'nav.budgets': 'Orçamentos',
    'nav.projects': 'Projetos',
    'nav.spending': 'Gastos',
    'nav.reports': 'Relatórios',
    'nav.search.placeholder': 'Pesquisar...',
    'nav.search.clear': 'Limpar',
    'nav.report.issue': 'Reportar Problema',
    'nav.toggle.theme': 'Alternar tema',
    'nav.language': 'Idioma',
    
    // Filters
    'filter.department': 'Departamento',
    'filter.region': 'Região',
    'filter.status': 'Status',
    'filter.category': 'Categoria',
    'filter.all': 'Todos',
    'filter.reset': 'Redefinir',
    
    // Overview
    'overview.title': 'Painel de Transparência Governamental',
    'overview.metrics': 'Métricas Principais',
    'overview.allocated': 'Total Alocado',
    'overview.spent': 'Total Gasto',
    'overview.utilization': 'Utilização Geral',
    'overview.transparency': 'Índice de Transparência',
    'overview.projects.title': 'Projetos Recentes',
    'overview.projects.recent': 'Últimas atualizações de projetos',
    
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro ocorreu',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.export': 'Exportar',
    'common.compare': 'Comparar',
    'common.watch': 'Observar',
    'common.details': 'Detalhes',
    'common.progress': 'Progresso',
    'common.status': 'Status',
    'common.budget': 'Orçamento',
    'common.spent': 'Gasto',
    'common.department': 'Departamento',
    'common.region': 'Região',
    'common.updated': 'Atualizado',
    
    // Status
    'status.on-track': 'No Caminho Certo',
    'status.delayed': 'Atrasado',
    'status.at-risk': 'Em Risco',
    'status.completed': 'Concluído',
    
    // Accessibility
    'a11y.skip.content': 'Pular para o conteúdo principal',
    'a11y.menu.main': 'Navegação principal',
    'a11y.sort.by': 'Ordenar por',
    'a11y.close.modal': 'Fechar modal',
    'a11y.close.details': 'Fechar detalhes',
    'a11y.progress.bar': 'Indicador de progresso',
    'a11y.high.contrast': 'Alternar alto contraste',
    'a11y.text.size': 'Ajustar tamanho do texto',
    'a11y.voice.toggle': 'Alternar saída de voz',
    
    // Help
    'help.tooltip.budget': 'Orçamento total alocado vs valor gasto',
    'help.tooltip.progress': 'Porcentagem de conclusão do projeto',
    'help.tooltip.transparency': 'Calculado com base na utilização do orçamento e resolução de relatórios',
    'help.guide.welcome': 'Bem-vindo ao GovTrack - seu painel de transparência governamental',
    'help.guide.navigation': 'Use as abas para navegar entre diferentes seções',
    'help.guide.filters': 'Aplique filtros para restringir os dados que você quer ver',
  },
  ar: {
    // Navigation
    'nav.overview': 'نظرة عامة',
    'nav.budgets': 'الميزانيات',
    'nav.projects': 'المشاريع',
    'nav.spending': 'الإنفاق',
    'nav.reports': 'التقارير',
    'nav.search.placeholder': 'بحث...',
    'nav.search.clear': 'مسح',
    'nav.report.issue': 'الإبلاغ عن مشكلة',
    'nav.toggle.theme': 'تبديل المظهر',
    'nav.language': 'اللغة',
    
    // Filters
    'filter.department': 'القسم',
    'filter.region': 'المنطقة',
    'filter.status': 'الحالة',
    'filter.category': 'الفئة',
    'filter.all': 'الكل',
    'filter.reset': 'إعادة تعيين',
    
    // Overview
    'overview.title': 'لوحة معلومات الشفافية الحكومية',
    'overview.metrics': 'المقاييس الرئيسية',
    'overview.allocated': 'إجمالي المخصص',
    'overview.spent': 'إجمالي المنفق',
    'overview.utilization': 'الاستخدام العام',
    'overview.transparency': 'مؤشر الشفافية',
    'overview.projects.title': 'المشاريع الحديثة',
    'overview.projects.recent': 'آخر تحديثات المشاريع',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.close': 'إغلاق',
    'common.export': 'تصدير',
    'common.compare': 'مقارنة',
    'common.watch': 'مراقبة',
    'common.details': 'التفاصيل',
    'common.progress': 'التقدم',
    'common.status': 'الحالة',
    'common.budget': 'الميزانية',
    'common.spent': 'المنفق',
    'common.department': 'القسم',
    'common.region': 'المنطقة',
    'common.updated': 'محدث',
    
    // Status
    'status.on-track': 'على المسار الصحيح',
    'status.delayed': 'متأخر',
    'status.at-risk': 'في خطر',
    'status.completed': 'مكتمل',
    
    // Accessibility
    'a11y.skip.content': 'تخطي إلى المحتوى الرئيسي',
    'a11y.menu.main': 'التنقل الرئيسي',
    'a11y.sort.by': 'ترتيب حسب',
    'a11y.close.modal': 'إغلاق النافذة المنبثقة',
    'a11y.close.details': 'إغلاق التفاصيل',
    'a11y.progress.bar': 'مؤشر التقدم',
    'a11y.high.contrast': 'تبديل التباين العالي',
    'a11y.text.size': 'تعديل حجم النص',
    'a11y.voice.toggle': 'تبديل الإخراج الصوتي',
    
    // Help
    'help.tooltip.budget': 'إجمالي الميزانية المخصصة مقابل المبلغ المنفق',
    'help.tooltip.progress': 'نسبة إنجاز المشروع',
    'help.tooltip.transparency': 'محسوب بناءً على استخدام الميزانية وحل التقارير',
    'help.guide.welcome': 'مرحباً بك في GovTrack - لوحة معلومات الشفافية الحكومية',
    'help.guide.navigation': 'استخدم علامات التبويب للتنقل بين الأقسام المختلفة',
    'help.guide.filters': 'طبق المرشحات لتضييق البيانات التي تريد رؤيتها',
  },
};

// Language context and hooks
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('govtrack-language');
    if (saved && saved in translations) return saved as Language;
    
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in translations) return browserLang as Language;
    
    return 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('govtrack-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const t = (key: keyof TranslationKeys): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const formatCurrency = (amount: number, language: Language = 'en'): string => {
  const currencyMap: Record<Language, string> = {
    en: 'USD',
    es: 'USD',
    fr: 'EUR',
    pt: 'BRL',
    ar: 'USD'
  };

  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : language, {
    style: 'currency',
    currency: currencyMap[language],
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string, language: Language = 'en'): string => {
  return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : language);
};