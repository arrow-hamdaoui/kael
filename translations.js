const translations = {
    en: {
        nav_cases: "Cases",
        nav_services: "Services",
        nav_workflow: "Workflow",
        nav_platform: "Platform",
        nav_contact: "Contact",
        nav_login: "Login",
        nav_submit: "Submit Case",
        hero_tag: "Kael Designer | Premium Digital Lab",
        hero_title_1: "Precision Digital",
        hero_title_2: "Dental Design",
        hero_subtitle: "High-end Crowns, Bridges, Veneers, and All-on-X rehabilitations engineered for the world's leading clinics.",
        hero_btn_submit: "Submit Your Case",
        hero_btn_view: "View Cases",
        prop_precision: "Precision",
        prop_consistency: "Consistency",
        prop_comm: "Fast Communication",
        prop_workflow: "Structured Workflow",
        badge_risk: "Pre-Delivery Risk Flags",
        badge_turnaround: "24h Turnaround",
        platform_tag: "Platform Features",
        platform_title: "Beyond a Portfolio. A Complete System.",
        platform_desc: "Manage your cases efficiently with our intelligent digital dental platform.",
        feat_submission_title: "Smart Case Submission",
        feat_submission_desc: "Multi-step forms with case completeness scores to ensure all STL files and specs are ready before design begins.",
        feat_tracking_title: "Live Case Tracking",
        feat_tracking_desc: "Real-time dashboard updates: Received → In Design → Preview Ready → Approved → Delivered.",
        feat_intel_title: "Chairside Intelligence",
        feat_intel_desc: "Instant guidance on tight contacts, occlusion, or seating issues with our smart escalation and correction system.",
        feat_profile_title: "Design Profile System",
        feat_profile_desc: "We store your preferences (contacts, occlusion, esthetics) and apply them automatically to all your future cases.",
        portfolio_title: "Featured Cases",
        portfolio_desc: "Explore precision-engineered digital prosthetics, from single crowns to complex full-arch rehabilitations.",
        filter_all: "All",
        filter_crowns: "Crowns & Bridges",
        filter_veneers: "Veneers",
        filter_implant: "Implant",
        filter_allonx: "All-on-X",
        view_details: "View Case Details",
        cta_title: "Ready for Precision?",
        cta_desc: "Join top clinics and labs worldwide who trust Kael Designer for flawless digital workflows.",
        footer_brand_desc: "Reliable, structured, and scalable digital dental design.",
        footer_privacy: "Privacy Policy",
        footer_terms: "Terms of Service",
        footer_admin: "Admin Login",
        login_header: "Platform Access",
        login_subheader: "Log in to your command center",
        login_label: "Admin Password",
        login_placeholder: "Enter password",
        login_btn: "Login to Command Center",
        login_error: "Incorrect password."
    },
    fr: {
        nav_cases: "Réalisations",
        nav_services: "Services",
        nav_workflow: "Flux de Travail",
        nav_platform: "Plateforme",
        nav_contact: "Contact",
        nav_login: "Connexion",
        nav_submit: "Soumettre un Cas",
        hero_tag: "Kael Designer | Laboratoire Digital Premium",
        hero_title_1: "Conception Dentaire",
        hero_title_2: "Digitale de Précision",
        hero_subtitle: "Couronnes, Bridges, Facettes et réhabilitations All-on-X haut de gamme conçus pour les plus grandes cliniques mondiales.",
        hero_btn_submit: "Soumettre Votre Cas",
        hero_btn_view: "Voir les Réalisations",
        prop_precision: "Précision",
        prop_consistency: "Consistance",
        prop_comm: "Communication Rapide",
        prop_workflow: "Flux Structuré",
        badge_risk: "Contrôle des Risques",
        badge_turnaround: "Délai de 24h",
        platform_tag: "Fonctionnalités",
        platform_title: "Plus qu'un Portfolio. Un Système Complet.",
        platform_desc: "Gérez vos cas efficacement avec notre plateforme dentaire digitale intelligente.",
        feat_submission_title: "Soumission Intelligente",
        feat_submission_desc: "Formulaires multi-étapes avec score de complétude pour garantir que tous les fichiers STL sont prêts.",
        feat_tracking_title: "Suivi en Direct",
        feat_tracking_desc: "Mises à jour en temps réel : Reçu → En Conception → Aperçu Prêt → Approuvé → Livré.",
        feat_intel_title: "Intelligence au Fauteuil",
        feat_intel_desc: "Guidage instantané sur les points de contact, l'occlusion ou l'insertion via notre système de correction.",
        feat_profile_title: "Profil de Conception",
        feat_profile_desc: "Nous enregistrons vos préférences (contacts, occlusion, esthétique) et les appliquons automatiquement.",
        portfolio_title: "Cas de Référence",
        portfolio_desc: "Explorez nos prothèses digitales de précision, des couronnes unitaires aux réhabilitations complètes.",
        filter_all: "Tout",
        filter_crowns: "Couronnes & Bridges",
        filter_veneers: "Facettes",
        filter_implant: "Implants",
        filter_allonx: "All-on-X",
        view_details: "Voir les Détails",
        cta_title: "Prêt pour la Précision ?",
        cta_desc: "Rejoignez les cliniques et laboratoires du monde entier qui font confiance à Kael Designer.",
        footer_brand_desc: "Conception dentaire digitale fiable, structurée et évolutive.",
        footer_privacy: "Politique de Confidentialité",
        footer_terms: "Conditions d'Utilisation",
        footer_admin: "Accès Admin",
        login_header: "Accès Plateforme",
        login_subheader: "Connectez-vous à votre centre de commande",
        login_label: "Mot de Passe Admin",
        login_placeholder: "Entrez le mot de passe",
        login_btn: "Connexion au Centre de Commande",
        login_error: "Mot de passe incorrect."
    }
};

function setLanguage(lang) {
    localStorage.setItem('kael_lang', lang);
    
    // Update active button state
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    // Handle specific complex updates (like spans inside headers)
    if (lang === 'fr') {
        document.documentElement.lang = 'fr';
    } else {
        document.documentElement.lang = 'en';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('kael_lang') || 'en';
    setLanguage(savedLang);
});
