# Journal des Modifications (Changelog) - VTTApp

Ce fichier trace toutes les nouvelles fonctionnalités et les corrections de bugs apportées à l'application.

## [Non Publié] - En cours de développement

### Ajouté / Modifié
- **Onglet Joueurs (Modèles) :** Ajout d'une fonctionnalité d'import de masse. L'utilisateur peut saisir un nombre de joueurs, renseigner (ou corriger) leur nom à la volée dans une fenêtre modale, et les importer d'un coup (les noms vides seront remplacés automatiquement par "Joueur X" avec des couleurs aléatoires).
- **Interface Utilisateur (Joueurs) :** Mise en place d'un système de repliage/dépliage (accordéon) avec chevrons pour les sections ("Créer un Joueur", "Ajouter des joueurs en masse", et "Créer une Équipe") afin de libérer de l'espace visuellement.
- **Configuration Supabase Dynamique** : Refonte de la modale de réglage (clé API et URL) pour le mode Vercel. Le focus est maintenant forcé sur les champs de saisies et isolé des clics du plateau (Canvas) grâce à une gestion des événements du DOM `(stopPropagation)`.
- **Fiabilité Supabase** : Ajout d'une sécurité `try-catch` dans `supabase.ts` pour empêcher le crash complet de l'application au démarrage si les clés stockées dans le navigateur sont invalides ou vides.

### Historique des corrections précédentes (Résumé)
- Modification des permissions de stockage pour supporter des images via un bucket Supabase.
- Gestion Multi-joueurs: Ajout d'un système de session `/join` pour les smartphones. 

---
*Ce fichier sera tenu à jour à chaque nouvelle intervention sur le code.*
