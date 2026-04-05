# Journal des Modifications (Changelog) - VTTApp

Ce fichier trace toutes les nouvelles fonctionnalités et les corrections de bugs apportées à l'application.

## [Non Publié] - En cours de développement

### Ajouté / Modifié
- **Édition des Tags (Container) :** Les tags listés dans l'onglet "Container" de la fenêtre d'édition d'un tag sont désormais regroupés par catégorie avec un système de repliage/dépliage (accordéon), tout comme dans le panneau latéral.
- **Onglet Joueurs et Tags :** Mise en place d'un système de repliage/dépliage (accordéon) pour toutes les sections ("Créer un Joueur", "Ajouter des joueurs en masse", "Créer une Équipe", "Créer une Catégorie", "Créer un Tag", "Modèles Disponibles") afin de libérer de l'espace visuellement.
- **Ajout de Joueurs en masse :** Ajout d'une fonctionnalité d'import de masse des joueurs. L'utilisateur peut saisir un nombre de joueurs et les valider dans une modale. Les joueurs sont générés avec des couleurs aléatoires et placés automatiquement en cercle au centre de la salle.
- **Configuration Supabase Dynamique** : Refonte de la modale de réglage (clé API et URL) pour le mode Vercel. Le focus est maintenant forcé sur les champs de saisies et isolé des clics du plateau (Canvas) grâce à une gestion des événements du DOM `(stopPropagation)`.
- **Fiabilité Supabase** : Ajout d'une sécurité `try-catch` dans `supabase.ts` pour empêcher le crash complet de l'application au démarrage si les clés stockées dans le navigateur sont invalides ou vides.

### Historique des corrections précédentes (Résumé)
- Modification des permissions de stockage pour supporter des images via un bucket Supabase.
- Gestion Multi-joueurs: Ajout d'un système de session `/join` pour les smartphones. 

---
*Ce fichier sera tenu à jour à chaque nouvelle intervention sur le code.*
