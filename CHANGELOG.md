# Journal des Modifications (Changelog) - VTTApp

Ce fichier trace toutes les nouvelles fonctionnalités et les corrections de bugs apportées à l'application.

## [Non Publié] - En cours de développement

### Ajouté / Modifié
- **Configuration Supabase Dynamique** : Refonte de la modale de réglage (clé API et URL) pour le mode Vercel. Le focus est maintenant forcé sur les champs de saisies et isolé des clics du plateau (Canvas) grâce à une gestion des événements du DOM `(stopPropagation)`.
- **Fiabilité Supabase** : Ajout d'une sécurité `try-catch` dans `supabase.ts` pour empêcher le crash complet de l'application au démarrage si les clés stockées dans le navigateur sont invalides ou vides.

### Historique des corrections précédentes (Résumé)
- Modification des permissions de stockage pour supporter des images via un bucket Supabase.
- Gestion Multi-joueurs: Ajout d'un système de session `/join` pour les smartphones. 

---
*Ce fichier sera tenu à jour à chaque nouvelle intervention sur le code.*
