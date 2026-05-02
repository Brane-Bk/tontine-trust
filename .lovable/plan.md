
# TontineChain — Application React complète

Application de tontine numérique avec 16 écrans, thème sombre/clair, base de données Supabase, et système de dépôt de garantie obligatoire.

## Design System

- **Thème sombre par défaut** avec toggle clair/sombre
- Palette : vert principal (#10B981), bleu (#3B82F6), ambre (#F59E0B), rouge (#EF4444), violet (#8B5CF6)
- Font : Inter
- Style mobile-first avec cards arrondies, glassmorphism subtil
- Bottom tab bar : Accueil, Groupes, Cotiser, Score, Profil

## Écrans à construire (16)

### Authentification (3 écrans)
1. **Splash** — Logo TontineChain, boutons Créer un compte / Se connecter
2. **Connexion** — Téléphone + PIN, option biométrie
3. **Inscription** — Nom, téléphone, OTP, création PIN

### Application principale (13 écrans)
4. **Dashboard** — Solde total, 3 groupes actifs avec progression, actions rapides (Cotiser, Rejoindre, Créer)
5. **Rechercher groupes** — Barre de recherche, filtres (Tous, Proches, Premium, Diaspora), liste des groupes ouverts
6. **Rejoindre un groupe** — Aperçu du contrat, vérification score minimum, **dépôt de garantie obligatoire** (caution remboursable)
7. **Détail groupe** — Cagnotte, ordre de passage des membres, statut de cotisation, bouton Cotiser
8. **Créer un groupe** — Formulaire 3 étapes (paramètres, règles avancées avec montant de garantie, invitation membres)
9. **Cotiser** — Choix moyen de paiement (MTN MoMo, Moov Money, Celtiis Cash), récapitulatif avec frais
10. **Confirmation paiement** — Animation succès, récapitulatif, hash transaction
11. **Score Gbè** — Score de confiance (0-1000), barres de progression par critère, historique score
12. **Historique** — Liste transactions avec filtres (Tout, Reçus, Cotisations, Pénalités)
13. **Notifications** — Centre d'alertes (versements, rappels, retards, invitations)
14. **Profil** — Avatar, DID, stats, raccourcis
15. **Paramètres** — Thème, sécurité (PIN, biométrie), portefeuilles liés, langue, notifications, déconnexion
16. **Admin groupe** — Actions admin, système de vote multi-signatures, gestion membres

## Système de dépôt de garantie

- Lors de la création d'un groupe, le fondateur définit le montant de la caution obligatoire
- Pour rejoindre un groupe, le membre doit payer la caution (affichée sur l'écran "Rejoindre")
- La caution est enregistrée en base et marquée comme "verrouillée"
- Remboursement automatique en fin de cycle si aucun défaut
- En cas de défaut de paiement, la caution couvre les cotisations manquées

## Base de données (Lovable Cloud / Supabase)

Tables principales :
- **profiles** — nom, téléphone, avatar, score, DID
- **user_roles** — rôles (admin, member)
- **tontine_groups** — nom, montant cotisation, fréquence, nb membres max, pénalité retard, montant garantie, statut
- **group_members** — user_id, group_id, ordre de passage, statut, rôle (fondateur/membre)
- **guarantee_deposits** — user_id, group_id, montant, statut (verrouillé/remboursé/saisi)
- **contributions** — user_id, group_id, tour, montant, moyen de paiement, statut, date
- **payouts** — user_id, group_id, tour, montant, date
- **transactions** — historique complet (cotisations, versements, pénalités, garanties)
- **notifications** — type, message, lu/non-lu, redirection
- **scores** — user_id, score total, détail par critère (ponctualité, participation, ancienneté)

RLS activé sur toutes les tables. Auth par email/téléphone.

## Fonctionnalités supplémentaires (non présentes dans la maquette)

- Validation : vérification que le solde de garantie est suffisant avant adhésion
- Calcul automatique des pénalités de retard (% défini par le groupe)
- Système de tours : rotation automatique, suivi du bénéficiaire courant
- Score Gbè calculé dynamiquement (ponctualité 40%, participation 25%, ancienneté 20%, fiabilité 15%)
- Notifications in-app avec badge compteur

## Détails techniques

- React 18 + TypeScript + Tailwind CSS
- React Router pour la navigation entre écrans
- Supabase (Lovable Cloud) pour auth, DB, et RLS
- Zustand ou React Context pour le state management du thème
- Lucide React pour les icônes
- Animations CSS (transitions entre écrans, check de confirmation)
- Données de démonstration pré-remplies pour tester l'app immédiatement
