# Phase 1 — Refactoring architectural "Modifier Tag"

## Goal
Extraire les formulaires tags d'EditingModal.tsx en composants dédiés avec typage strict.

## Tasks

- [ ] **Task 1**: Créer `src/types/tag-form.ts` — interface `TagFormData` + type `TagFormUpdate`
- [ ] **Task 2**: Créer `src/components/tags/TagGeneralTab.tsx` — onglet Général
- [ ] **Task 3**: Créer `src/components/tags/TagAppearanceTab.tsx` — onglet Apparence
- [ ] **Task 4**: Créer `src/components/tags/TagFieldsTab.tsx` — onglet Champs
- [ ] **Task 5**: Créer `src/components/tags/TagSmartphoneTab.tsx` — onglet Smartphone
- [ ] **Task 6**: Créer `src/components/tags/TagContainerTab.tsx` — onglet Container
- [ ] **Task 7**: Créer `src/components/tags/TagFormContent.tsx` — conteneur à onglets partagé
- [ ] **Task 8**: Créer `src/components/tags/TagModelForm.tsx` — wrapper modèle
- [ ] **Task 9**: Créer `src/components/tags/TagInstanceForm.tsx` — wrapper instance
- [ ] **Task 10**: Créer `src/components/tags/index.ts` — exports
- [ ] **Task 11**: Refondre `EditingModal.tsx` — remplacer les sections inline par les nouveaux composants
- [ ] **Task 12**: Vérifier la compilation TypeScript et le build

## Done When
- [ ] EditingModal.tsx ne contient plus de JSX tag inline (importe `TagModelForm` et `TagInstanceForm`)
- [ ] Tous les types sont stricts (plus de `any` pour les tags)
- [ ] Le build TypeScript passe sans erreur
