Tontine Trust - Mobile d'Épargne Décentralisée

Tontine Trust est une application mobile conçue pour moderniser et sécuriser le système de tontine. Elle combine l'aspect communautaire et la flexibilité des tontines traditionnelles avec la robustesse et la transparence de la technologie blockchain et des solutions Web3.

🚀 Objectif
Permettre aux membres d'une tontine de gérer leurs cotisations, de suivre l'ordre de passage, de vérifier les fonds disponibles et de sécuriser leurs transactions via une plateforme numérique sécurisée.

✨ Fonctionnalités Clés
1. Gestion de Compte et Sécurité
Authentification Sécurisée : Connexion via email et mot de passe.
Vérification d'Identité : Processus d'inscription avec vérification de l'utilisateur.
Profil Utilisateur : Visualisation des informations personnelles, solde du portefeuille et score de confiance.
2. Gestion des Tontines (Groupes)
Création et Adhésion : Possibilité de créer de nouveaux groupes de tontine ou de rejoindre des groupes existants.
Ordre de Passage : Calendrier et suivi clair de qui doit recevoir les fonds à quel tour.
Statuts : Suivi du statut des paiements (En attente, Cotisé, Paiement effectué).
3. Finances et Paiements
Cotisations : Interface simple pour payer sa part mensuelle.
Cagnotte : Affichage transparent de la cagnotte totale du groupe et du montant du prochain tour.
Dépôt de Garantie : Système de sécurité pour garantir l'engagement des membres (via portefeuille crypto).
4. Points et Réputation
Système de Points : Acquisition de points pour la participation et les actions positives.
Score de Confiance : Calcul du score basé sur l'activité et la régularité (par exemple, 1000 points pour l'inscription, points déduits en cas de défaut de paiement).
5. Interface Utilisateur
Design Responsive : Adapté pour mobile et tablette.
Notifications : Alertes pour les paiements à venir et les rappels.
Thème Sombre : Support complet du mode sombre.
🔗 Technologie
Frontend : React + Vite
Styling : Tailwind CSS + Composants UI (TCAvatar, ProgressBar, etc.)
Backend : Node.js + Supabase (Authentification, Base de données)
📊 Architecture des Données
La base de données Supabase est structurée autour de plusieurs tables principales :

users : Informations des utilisateurs (nom, email, profil, score).
user_groups : Association entre utilisateurs et groupes.
groups : Détails des tontines (montant, tour actuel, cycle).
tontine_rotations : Gestion du tour de passage et des paiements.
guarantee_deposits : Suivi des dépôts de garantie.
🛠️ Installation & Démarrage
Prérequis
Node.js (16.x ou supérieur)
npm ou yarn
Clé API Supabase (URL et Anon Key)
Étapes d'installation

1. Cloner le dépôt :


git clone <repository-url>
cd tontine-trust
2. Installer les dépendances :


npm install
3. Configuration de l'environnement :

Créez un fichier .env à la racine du projet avec les variables suivantes :

# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_KKIAPAY_SECRET=your-kkiapay-secret
VITE_KKIAPAY_PUBLIC_KEY=your-kkiapay-public-key
VITE_KKIAPAY_PRIVATE_KEY=your-kkiapay-private-key
VITE_KKIAPAY_SANDBOX=true



4. Lancer l'application :


npm run dev
L'application sera accessible à l'adresse indiquée par Vite (généralement http://localhost:5173).

📂 Structure du Projet
src/components/ : Composants React réutilisables (TopBar, UI widgets).
src/lib/ : Configuration (supabase).
src/pages/ : Pages de l'application (Inscription, Connexion, Home, GroupeDetail).
supabase_schema.sql : Schéma de base de données à exécuter dans votre projet Supabase.

5. Migration de la base de données :

 Après avoir exécuter le supabase_schema.sql exécutez le fichier de migration SQL dans votre projet Supabase :

```bash
# Dans la console SQL de Supabase, copiez-collez le contenu de :
migrate_to_kkiapay.sql
```

Ce fichier crée les tables nécessaires pour le système de paiement Kkiapay et les transactions.