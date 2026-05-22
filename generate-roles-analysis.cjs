const { jsPDF } = require("jspdf");

const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
let y = 20;

// Colors
const PRIMARY = [41, 98, 255];
const SECONDARY = [99, 102, 241];
const ACCENT = [16, 185, 129];
const DESTRUCTIVE = [220, 38, 38];
const WARNING = [245, 158, 11];
const DARK = [31, 41, 55];
const MEDIUM = [107, 114, 128];
const LIGHT = [156, 163, 175];
const BG_LIGHT = [249, 250, 251];
const BG_SECTION = [243, 244, 246];

function checkPage(needed = 20) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
    return true;
  }
  return false;
}

function drawHeader() {
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, 12, "F");
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT);
  doc.text("Analyse Onglet Roles - VTTApp v0.709 - Document Confidentiel", MARGIN, 8);
  doc.text(new Date().toLocaleDateString("fr-FR"), PAGE_WIDTH - MARGIN - 20, 8);
  y = 18;
}

function sectionTitle(text, color = PRIMARY) {
  checkPage(25);
  doc.setFillColor(...color);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 10, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 4, y + 7);
  y += 16;
  doc.setTextColor(...DARK);
}

function subsectionTitle(text, color = SECONDARY) {
  checkPage(18);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 4, y);
  doc.setLineWidth(0.3);
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 6, y + 1);
  y += 8;
  doc.setTextColor(...DARK);
}

function bullet(text, indent = 0, bold = false) {
  checkPage(8);
  const x = MARGIN + indent * 5;
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  if (bold) {
    doc.setFont("helvetica", "bold");
  } else {
    doc.setFont("helvetica", "normal");
  }
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent * 5 - 8);
  doc.text("\u2022", x, y + 4);
  doc.text(lines, x + 5, y + 4);
  y += lines.length * 4.5 + 1;
}

function bulletBold(label, detail, indent = 0) {
  checkPage(8);
  const x = MARGIN + indent * 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  const labelLines = doc.splitTextToSize(label + " ", CONTENT_WIDTH - indent * 5 - 8);
  const labelWidth = doc.getTextWidth(labelLines[0]);
  doc.text("\u2022", x, y + 4);
  doc.text(labelLines[0], x + 5, y + 4);
  
  doc.setFont("helvetica", "normal");
  const detailLines = doc.splitTextToSize(detail, CONTENT_WIDTH - indent * 5 - labelWidth - 10);
  doc.text(detailLines, x + 5 + labelWidth, y + 4);
  y += Math.max(labelLines.length, detailLines.length) * 4.5 + 1;
}

function codeBlock(code, label = "") {
  checkPage(20);
  if (label) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECONDARY);
    doc.text(label, MARGIN + 2, y + 3);
    y += 5;
  }
  doc.setFillColor(...BG_SECTION);
  doc.setDrawColor(220, 220, 220);
  const lines = doc.splitTextToSize(code, CONTENT_WIDTH - 8);
  const h = lines.length * 4 + 6;
  doc.roundedRect(MARGIN + 2, y, CONTENT_WIDTH - 4, h, 1, 1, "FD");
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(lines, MARGIN + 5, y + 5);
  y += h + 4;
  doc.setTextColor(...DARK);
}

function normalText(text, size = 9) {
  checkPage(8);
  doc.setFontSize(size);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y + 4);
  y += lines.length * 4.5 + 2;
}

function boldText(text, size = 9) {
  checkPage(8);
  doc.setFontSize(size);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y + 4);
  y += lines.length * 4.5 + 2;
}

function table(headers, rows, colWidths) {
  checkPage(15 + rows.length * 7);
  const startX = MARGIN;
  const rowH = 7;
  
  // Header
  doc.setFillColor(...PRIMARY);
  doc.rect(startX, y, CONTENT_WIDTH, rowH, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x + 1, y + 5);
    x += colWidths[i];
  });
  y += rowH;
  
  // Rows
  doc.setFont("helvetica", "normal");
  rows.forEach((row, ri) => {
    if (y + rowH > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
      // Re-draw header
      doc.setFillColor(...PRIMARY);
      doc.rect(startX, y, CONTENT_WIDTH, rowH, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      let x2 = startX;
      headers.forEach((h, i) => {
        doc.text(h, x2 + 1, y + 5);
        x2 += colWidths[i];
      });
      y += rowH;
      doc.setFont("helvetica", "normal");
    }
    
    if (ri % 2 === 0) {
      doc.setFillColor(...BG_SECTION);
      doc.rect(startX, y, CONTENT_WIDTH, rowH, "F");
    }
    doc.setTextColor(...DARK);
    doc.setFontSize(7.5);
    x = startX;
    row.forEach((cell, ci) => {
      doc.text(String(cell), x + 1, y + 5);
      x += colWidths[ci];
    });
    y += rowH;
  });
  y += 3;
}

function priorityBadge(priority) {
  const colors = {
    "P0": DESTRUCTIVE,
    "P1": WARNING,
    "P2": ACCENT,
    "P3": SECONDARY
  };
  return colors[priority] || MEDIUM;
}

// ============================================================
// PAGE 1: TITLE PAGE
// ============================================================
doc.setFillColor(...PRIMARY);
doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

doc.setFillColor(255, 255, 255);
doc.roundedRect(MARGIN - 5, 50, CONTENT_WIDTH + 10, 160, 3, 3, "F");

doc.setFontSize(28);
doc.setFont("helvetica", "bold");
doc.setTextColor(...PRIMARY);
doc.text("Analyse Onglet Roles", PAGE_WIDTH / 2, 85, { align: "center" });

doc.setFontSize(18);
doc.setTextColor(...SECONDARY);
doc.text("VTTApp", PAGE_WIDTH / 2, 98, { align: "center" });

doc.setDrawColor(...PRIMARY);
doc.setLineWidth(1);
doc.line(MARGIN + 20, 108, PAGE_WIDTH - MARGIN - 20, 108);

doc.setFontSize(11);
doc.setTextColor(...MEDIUM);
doc.setFont("helvetica", "normal");
doc.text("Rapport d'analyse technique et recommandations", PAGE_WIDTH / 2, 120, { align: "center" });
doc.text("Composant RolesTab.tsx", PAGE_WIDTH / 2, 130, { align: "center" });

doc.setFontSize(10);
doc.setTextColor(...DARK);
doc.text("Version de l'application: 0.709", PAGE_WIDTH / 2, 150, { align: "center" });
doc.text("Date d'analyse: " + new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }), PAGE_WIDTH / 2, 160, { align: "center" });
doc.text("Fichier analyse: src/components/layout/tabs/RolesTab.tsx", PAGE_WIDTH / 2, 170, { align: "center" });
doc.text("Lignes de code: 354", PAGE_WIDTH / 2, 180, { align: "center" });

doc.setFontSize(9);
doc.setTextColor(...LIGHT);
doc.text("Document confidentiel - Usage interne uniquement", PAGE_WIDTH / 2, 200, { align: "center" });

// ============================================================
// PAGE 2: TABLE OF CONTENTS
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("Table des Matieres");

const tocItems = [
  ["1", "Resume Executif", "3"],
  ["2", "Architecture Actuelle", "4"],
  ["  2.1", "Structure du Composant", "4"],
  ["  2.2", "Gestion d'Etat", "4"],
  ["  2.3", "Flux de Donnees", "5"],
  ["3", "Points Forts", "5"],
  ["4", "Faiblesses Identifiees", "6"],
  ["  4.1", "Fonctionnalites Manquantes", "6"],
  ["  4.2", "Problemes UX", "7"],
  ["  4.3", "Qualite du Code", "7"],
  ["  4.4", "Risques de Securite", "8"],
  ["5", "Comparaison avec TagsTab", "8"],
  ["6", "Recommandations Priorisees", "10"],
  ["  6.1", "P0 - Critique", "10"],
  ["  6.2", "P1 - Important", "11"],
  ["  6.3", "P2 - Amelioration", "11"],
  ["  6.4", "P3 - Futur", "12"],
  ["7", "Estimation d'Effort", "12"],
  ["8", "Conclusion", "13"],
];

doc.setFontSize(10);
tocItems.forEach(([num, title, page]) => {
  const isMain = !num.startsWith(" ");
  doc.setFont("helvetica", isMain ? "bold" : "normal");
  const color = isMain ? DARK : MEDIUM;
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(isMain ? 10 : 9);
  
  const dots = ".".repeat(60 - num.length - title.length);
  const line = `${num} ${title} ${dots} ${page}`;
  doc.text(line, MARGIN + (isMain ? 0 : 8), y + 4);
  y += 7;
});

// ============================================================
// PAGE 3: RESUME EXECUTIF
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("1. Resume Executif");

normalText(
  "Ce document presente une analyse approfondie du composant RolesTab.tsx de l'application VTTApp. " +
  "L'objectif est d'identifier les forces, faiblesses, et opportunites d'amelioration de l'onglet de gestion des roles, " +
  "en le comparant avec l'onglet TagsTab qui sert de reference en termes de fonctionnalites implementees."
);

subsectionTitle("Etat Actuel en Bref");

bullet("354 lignes de code - composant de complexite moyenne", 0, true);
bullet("2 sections principales: Creation et Liste des roles", 0, true);
bullet("Groupement des roles par equipe avec expand/collapse", 0, true);
bullet("Drag-and-drop pour le reordonnancement des sections", 0, true);
bullet("Checkbox de selection pour distribution aleatoire", 0, true);
bullet("Actions par role: dupliquer, modifier, supprimer", 0, true);

subsectionTitle("Problemes Majeurs Identifies");

bullet("Aucune confirmation avant suppression (risque de perte de donnees)", 0, true);
bullet("Pas de recherche/filtrage des roles", 0, true);
bullet("Pas de tri (alphabetique, par equipe, par date)", 0, true);
bullet("Pas d'import/export JSON", 0, true);
bullet("Pas de modeles predefinis de roles", 0, true);
bullet("Pas de statistiques d'utilisation des roles", 0, true);
bullet("Pas de comptage de roles par equipe dans l'en-tete", 0, true);
bullet("Pas d'operations en masse (bulk)", 0, true);
bullet("Description et image non affichees dans la liste", 0, true);
bullet("Pas de persistance de l'ordre des sections (localStorage)", 0, true);

subsectionTitle("Score Global");

doc.setFillColor(...BG_SECTION);
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 25, 2, 2, "FD");
doc.setFontSize(24);
doc.setFont("helvetica", "bold");
doc.setTextColor(...WARNING);
doc.text("5.5 / 10", PAGE_WIDTH / 2, y + 12, { align: "center" });
doc.setFontSize(8);
doc.setTextColor(...MEDIUM);
doc.setFont("helvetica", "normal");
doc.text("Le composant est fonctionnel mais manque de nombreuses fonctionnalites presentes dans TagsTab", PAGE_WIDTH / 2, y + 20, { align: "center" });
y += 30;

// ============================================================
// PAGE 4-5: ARCHITECTURE ACTUELLE
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("2. Architecture Actuelle");

subsectionTitle("2.1 Structure du Composant");

normalText("Le composant RolesTab.tsx (354 lignes) est structure comme suit:");

codeBlock(
  "RolesTab.tsx (354 lignes)\n" +
  "  |-- DynamicColor (l.10-22): Wrapper pour couleurs dynamiques\n" +
  "  |-- SortableSection (l.24-70): Section drag-and-drop\n" +
  "  |-- RolesTab (l.72-354): Composant principal\n" +
  "       |-- State: newRoleName, newRoleColor, expandedTeams\n" +
  "       |-- State: sectionOrder, openSections\n" +
  "       |-- useMemo: rolesByTeam (groupement par equipe)\n" +
  "       |-- renderCreateRole(): Formulaire de creation\n" +
  "       |-- renderRolesList(): Liste groupee par equipe",
  "Arborescence du composant"
);

subsectionTitle("2.2 Gestion d'Etat");

normalText("Le composant utilise un melange d'etat local (useState) et de store global (Zustand):");

codeBlock(
  "// Etat local (RolesTab.tsx:74-86)\n" +
  "const [newRoleName, setNewRoleName] = useState('');\n" +
  "const [newRoleColor, setNewRoleColor] = useState('#3b82f6');\n" +
  "const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});\n" +
  "const [sectionOrder, setSectionOrder] = useState(['createRole', 'rolesList']);\n" +
  "const [openSections, setOpenSections] = useState({ createRole: true, rolesList: true });\n\n" +
  "// Store global (RolesTab.tsx:73)\n" +
  "const { roles, teams, setEditingEntity, addRole, updateRole, deleteRole } = useVttStore();",
  "Extrait de gestion d'etat"
);

normalText("Remarque: L'ordre des sections n'est PAS persiste en localStorage, contrairement a TagsTab (TagsTab.tsx:118-120, 128).");

checkPage(30);
subsectionTitle("2.3 Flux de Donnees");

normalText("Interface Role complete (types/index.ts:61-81):");

codeBlock(
  "interface Role {\n" +
  "  id: EntityId;\n" +
  "  name: string;\n" +
  "  color: string;\n" +
  "  lives: number;\n" +
  "  isUnique: boolean;\n" +
  "  teamId: EntityId | null;\n" +
  "  tags: TagModel[];\n" +
  "  imageUrl?: string;\n" +
  "  seenAsRoleId?: EntityId | null;\n" +
  "  seenInTeamId?: EntityId | null;\n" +
  "  description?: string;\n" +
  "  isSelectableForDistribution?: boolean;\n" +
  "  distributionQuantity?: number;\n" +
  "  smartphoneImageStyle?: 'circle' | 'square' | 'original' | 'background' | 'none';\n" +
  "  defaultCount?: number;\n" +
  "  minCount?: number;\n" +
  "  maxCount?: number;\n" +
  "  isFiller?: boolean;\n" +
  "  isMinMandatory?: boolean;\n" +
  "}",
  "Interface Role (types/index.ts:61-81)"
);

normalText("Actions du store (store/index.ts:667-675):");

codeBlock(
  "addRole: (roleData) => set((state) => ({\n" +
  "  roles: [...state.roles, { ...roleData, id: uuidv4() }]\n" +
  "})),\n" +
  "updateRole: (id, updates) => set((state) => ({\n" +
  "  roles: state.roles.map(r => r.id === id ? { ...r, ...updates } : r)\n" +
  "})),\n" +
  "deleteRole: (id) => set((state) => ({\n" +
  "  roles: state.roles.filter(r => r.id !== id)\n" +
  "}))",
  "Actions store (store/index.ts:667-675)"
);

// ============================================================
// PAGE 5-6: POINTS FORTS
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("3. Points Forts");

subsectionTitle("Architecture et Design");

bullet("Separation claire entre creation et liste des roles (SRP respecte)", 0, true);
bullet("Utilisation de useMemo pour le groupement par equipe (performance)", 0, true);
bullet("Composant DynamicColor pour gestion de couleurs dynamiques (RolesTab.tsx:10-22)", 0, true);
bullet("Sections reordonnables via drag-and-drop (@dnd-kit)", 0, true);

subsectionTitle("Fonctionnalites Implementees");

bullet("Creation de role avec nom et couleur", 0, true);
bullet("Groupement automatique par equipe avec 'Sans Equipe' par defaut", 0, true);
bullet("Expand/collapse par equipe avec bouton 'Tout deplier/replier'", 0, true);
bullet("Checkbox isSelectableForDistribution pour chaque role", 0, true);
bullet("Apercu de couleur du role dans la liste", 0, true);
bullet("Affichage des PV (lives) et unicite (Unique/Multiple)", 0, true);
bullet("Compteur de roles selectionnes dans l'en-tete (RolesTab.tsx:308)", 0, true);
bullet("Duplication de role avec suffixe '(Copie)'", 0, true);
bullet("Edition via EditingModal (setEditingEntity)", 0, true);
bullet("Suppression directe (mais sans confirmation)", 0, true);

subsectionTitle("Integration avec le Reste de l'Application");

bullet("Les roles sont utilises dans 139+ references dans le codebase", 0, true);
bullet("Integration avec Canvas pour l'affichage des couleurs de role", 0, true);
bullet("Integration avec RightPanel pour la distribution aleatoire", 0, true);
bullet("Integration avec EditingModal pour l'edition complete", 0, true);
bullet("Integration avec le moteur d'actions (role-team-effects.ts)", 0, true);
bullet("Selectors optimises dans store/selectors.ts (selectRoles, selectRoleById, selectRolesByTeam)", 0, true);

// ============================================================
// PAGE 6-8: FAIBLESSES IDENTIFIEES
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("4. Faiblesses Identifiees");

subsectionTitle("4.1 Fonctionnalites Manquantes (vs TagsTab)");

normalText("Le tableau suivant compare les fonctionnalites entre RolesTab et TagsTab:");

table(
  ["Fonctionnalite", "RolesTab", "TagsTab", "Ecart"],
  [
    ["Recherche/Filtre", "NON", "OUI", "Majeur"],
    ["Tri (A-Z/Date)", "NON", "OUI", "Majeur"],
    ["Mode de vue", "NON", "OUI (2 modes)", "Majeur"],
    ["Import JSON", "NON", "OUI", "Majeur"],
    ["Export JSON", "NON", "OUI", "Majeur"],
    ["Modeles predefinis", "NON", "OUI", "Majeur"],
    ["Dashboard stats", "NON", "OUI", "Majeur"],
    ["Confirmation delete", "NON", "OUI", "Critique"],
    ["Compteur usage", "NON", "OUI", "Important"],
    ["Drag & drop items", "NON", "OUI", "Important"],
    ["Persistance ordre", "NON", "OUI", "Important"],
    ["Tri dans groupes", "NON", "OUI", "Mineur"],
    ["Validation doublon", "NON", "OUI", "Important"],
    ["Creation inline equipe", "NON", "OUI", "Mineur"],
  ],
  [45, 25, 30, 30]
);

subsectionTitle("4.2 Problemes UX");

bullet("Suppression sans confirmation: Un clic accidentel supprime un role definitivement", 0, true);
normalText("Reference: RolesTab.tsx:285-291 - deleteRole(role.id) appele directement sans modal de confirmation.", 8);

bullet("Pas de feedback visuel lors de la creation d'un role en doublon", 0, true);
normalText("Contrairement a TagsTab qui affiche un message d'erreur (TagsTab.tsx:168-169), RolesTab cree silencieusement un doublon.", 8);

bullet("La liste des roles n'affiche pas la description du role", 0, true);
normalText("L'interface Role possede un champ description (types/index.ts:72) mais il n'est pas affiche dans la liste. L'utilisateur doit ouvrir EditingModal pour la voir.", 8);

bullet("Pas d'aperu de l'image du role dans la liste", 0, true);
normalText("Le champ imageUrl existe (types/index.ts:69) mais n'est pas utilise dans RolesTab. TagsTab affiche l'icone du tag dans la liste.", 8);

bullet("Les tags attaches au role ne sont pas visibles dans la liste", 0, true);
normalText("Le champ tags: TagModel[] (types/index.ts:68) existe mais n'est pas affiche. L'utilisateur ne sait pas quels tags sont associes sans ouvrir l'edition.", 8);

bullet("Pas de comptage de roles par equipe dans l'en-tete de groupe", 0, true);
normalText("L'en-tete d'equipe affiche seulement (selectifs/total) mais pas le nombre total de roles de l'equipe de maniere explicite.", 8);

bullet("Pas de creation d'equipe inline depuis l'onglet Roles", 0, true);
normalText("Si aucune equipe n'existe, l'utilisateur doit aller dans l'onglet Equipes pour en creer une.", 8);

checkPage(30);
subsectionTitle("4.3 Qualite du Code");

bullet("Composant monolithique de 354 lignes", 0, true);
normalText("Le composant RolesTab combine creation, liste, drag-and-drop, et gestion d'etat dans un seul fichier. TagsTab (530 lignes) est plus long mais mieux structure avec des sous-composants memoises (TagListItem avec React.memo).", 8);

bullet("Pas de React.memo sur les elements de liste", 0, true);
normalText("Chaque role est rendu dans un .map() sans memoisation. TagsTab utilise React.memo sur TagListItem (TagsTab.tsx:51).", 8);

bullet("Pas de validation de nom en doublon a la creation", 0, true);
normalText("handleAddRole (RolesTab.tsx:127-146) ne verifie pas si un role du meme nom existe deja.", 8);

bullet("Pas de gestion d'erreur sur les actions du store", 0, true);
normalText("Les appels addRole, updateRole, deleteRole n'ont pas de gestion d'erreur ou de try/catch.", 8);

bullet("Pas de lazy loading ou virtualisation pour les longues listes", 0, true);
normalText("Bien que l'application utilise @tanstack/react-virtual (package.json:19), RolesTab ne l'utilise pas. Pour 50+ roles, les performances pourraient se degrader.", 8);

subsectionTitle("4.4 Risques de Securite et Integrite des Donnees");

bullet("Suppression en cascade non geree", 0, true);
normalText("deleteRole (store/index.ts:673-675) supprime uniquement le role. Si des joueurs ont ce role (Player.roleId), leurs references deviennent invalides. TagsTab gere le nettoyage des tags lors de la suppression.", 8);

bullet("Pas de traçage de l'utilisation des roles", 0, true);
normalText("Contrairement a selectTagUsageCount (selectors.ts:156-161), il n'existe pas de selectRoleUsageCount. Impossible de savoir si un role est assigne a des joueurs avant suppression.", 8);

// ============================================================
// PAGE 8-10: COMPARAISON DETAILLEE
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("5. Comparaison Detaillee avec TagsTab");

subsectionTitle("5.1 Analyse des Ecarts de Fonctionnalites");

normalText("TagsTab sert de reference dans cette application. Voici une analyse detaillee de chaque ecart:");

subsectionTitle("Recherche et Filtrage");

normalText("TagsTab implemente une barre de recherche complete (TagsTab.tsx:113, 153-162, 374-379):");
codeBlock(
  "// TagsTab.tsx:153-162\n" +
  "const filteredTagsByCategory = useMemo(() => {\n" +
  "  if (!searchQuery.trim()) return sortedTagsByCategory;\n" +
  "  const query = searchQuery.toLowerCase();\n" +
  "  const filtered: Record<string, typeof tags> = {};\n" +
  "  Object.entries(sortedTagsByCategory).forEach(([catId, catTags]) => {\n" +
  "    const matching = catTags.filter(t => t.name.toLowerCase().includes(query));\n" +
  "    if (matching.length > 0 || catId === 'no-category') filtered[catId] = matching;\n" +
  "  });\n" +
  "  return filtered;\n" +
  "}, [sortedTagsByCategory, searchQuery]);",
  "Implementation recherche TagsTab"
);

normalText("RolesTab: Aucune fonctionnalite de recherche. Pour 20+ roles, l'utilisateur doit parcourir manuellement chaque equipe.");

subsectionTitle("Tri et Organisation");

normalText("TagsTab offre le tri alphabetique et par date (TagsTab.tsx:114, 145-151, 298-300):");
codeBlock(
  "// TagsTab.tsx:145-151\n" +
  "const sortedTagsByCategory = useMemo(() => {\n" +
  "  const sorted: Record<string, typeof tags> = {};\n" +
  "  Object.entries(tagsByCategory).forEach(([catId, catTags]) => {\n" +
  "    sorted[catId] = [...catTags].sort((a, b) =>\n" +
  "      sortBy === 'name' ? a.name.localeCompare(b.name, 'fr') : 0\n" +
  "    );\n" +
  "  });\n" +
  "  return sorted;\n" +
  "}, [tagsByCategory, sortBy]);",
  "Implementation tri TagsTab"
);

normalText("RolesTab: Les roles dans chaque equipe ne sont tries selon aucun critere. L'ordre depend de l'ordre d'insertion dans le store.");

subsectionTitle("Import/Export");

normalText("TagsTab implemente l'export JSON (TagsTab.tsx:195-201) et l'import JSON (TagsTab.tsx:203-214):");
codeBlock(
  "// TagsTab.tsx:195-201\n" +
  "const handleExportTags = useCallback(() => {\n" +
  "  const data = { version: '1.0', tags, tagCategories, exportedAt: new Date().toISOString() };\n" +
  "  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });\n" +
  "  const url = URL.createObjectURL(blob);\n" +
  "  const a = document.createElement('a');\n" +
  "  a.href = url; a.download = 'tags-export.json';\n" +
  "  a.click(); URL.revokeObjectURL(url);\n" +
  "}, [tags, tagCategories]);",
  "Implementation export TagsTab"
);

normalText("RolesTab: Aucune fonctionnalite d'import/export. Impossible de sauvegarder/restaurer une configuration de roles.");

subsectionTitle("Modeles Predefinis");

normalText("TagsTab utilise PREDEFINED_TAG_TEMPLATES (TagsTab.tsx:9, 222-236) permettant d'importer des tags standards en un clic.");
normalText("RolesTab: Aucun modele predefini. Chaque role doit etre cree manuellement.");

subsectionTitle("Dashboard Statistiques");

normalText("TagsTab offre un dashboard complet (TagsTab.tsx:441-527) avec:");
bullet("Nombre total de tags, categories, tags dans distributeur", 0, true);
bullet("Top 5 des tags les plus utilises avec barres de progression", 0, true);
bullet("Repartition par categorie", 0, true);
bullet("Tags avec auto-suppression", 0, true);

normalText("RolesTab: Aucune statistique. Impossible de voir la repartition des roles par equipe, le nombre de roles uniques vs multiples, etc.");

subsectionTitle("Confirmation de Suppression");

normalText("TagsTab implemente un modal de confirmation (TagsTab.tsx:123, 188-193, 389-402):");
codeBlock(
  "// TagsTab.tsx:123\n" +
  "const [deleteConfirm, setDeleteConfirm] = useState<\n" +
  "  { type: 'tag' | 'category'; id: string; name: string } | null\n" +
  ">(null);\n\n" +
  "// TagsTab.tsx:188-193\n" +
  "const handleRequestDelete = useCallback(\n" +
  "  (type, id, name) => setDeleteConfirm({ type, id, name }), []\n" +
  ");",
  "Implementation confirmation TagsTab"
);

normalText("RolesTab: Suppression directe sans confirmation (RolesTab.tsx:285-291). Risque eleve de suppression accidentelle.");

subsectionTitle("Persistance de l'Ordre des Sections");

normalText("TagsTab persiste l'ordre des sections en localStorage (TagsTab.tsx:118-120, 128):");
codeBlock(
  "// TagsTab.tsx:118-120\n" +
  "const [sectionOrder, setSectionOrder] = useState(() => {\n" +
  "  try {\n" +
  "    const saved = localStorage.getItem('tagsTabSectionOrder');\n" +
  "    return saved ? JSON.parse(saved) : ['createCategory', 'createTag', 'tagList'];\n" +
  "  } catch { return ['createCategory', 'createTag', 'tagList']; }\n" +
  "});\n\n" +
  "// TagsTab.tsx:128\n" +
  "useEffect(() => {\n" +
  "  try { localStorage.setItem('tagsTabSectionOrder', JSON.stringify(sectionOrder)); }\n" +
  "  catch {}\n" +
  "}, [sectionOrder]);",
  "Implementation persistance TagsTab"
);

normalText("RolesTab: L'ordre des sections est perdu a chaque rechargement de page.");

// ============================================================
// PAGE 10-12: RECOMMANDATIONS
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("6. Recommandations Priorisees");

subsectionTitle("6.1 P0 - Critique (A implementer immediatement)");

const p0Color = priorityBadge("P0");
doc.setFillColor(...p0Color);
doc.rect(MARGIN, y, 8, 8, "F");
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...p0Color);
doc.text("P0", MARGIN + 10, y + 6);
doc.setTextColor(...DARK);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text("- Critique", MARGIN + 22, y + 6);
y += 12;

bullet("Modal de confirmation de suppression", 0, true);
normalText("Ajouter un modal identique a TagsTab avant chaque suppression de role. Impact: evite la perte accidentelle de donnees. Reference: s'inspirer de TagsTab.tsx:389-402.", 8);

bullet("Verification de doublon a la creation", 0, true);
normalText("Ajouter une validation du nom avant creation. Si un role du meme nom existe, afficher un message d'erreur. Reference: s'inspirer de TagsTab.tsx:168-169.", 8);

bullet("Gestion de la suppression en cascade", 0, true);
normalText("Avant de supprimer un role, verifier si des joueurs y sont assignes. Si oui, afficher un avertissement et proposer de reassigner les joueurs a 'null'. Reference: creer un selectRoleUsageCount similaire a selectTagUsageCount (selectors.ts:156-161).", 8);

checkPage(40);
subsectionTitle("6.2 P1 - Important (A implementer rapidement)");

const p1Color = priorityBadge("P1");
doc.setFillColor(...p1Color);
doc.rect(MARGIN, y, 8, 8, "F");
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...p1Color);
doc.text("P1", MARGIN + 10, y + 6);
doc.setTextColor(...DARK);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text("- Important", MARGIN + 22, y + 6);
y += 12;

bullet("Barre de recherche/filtrage", 0, true);
normalText("Ajouter une barre de recherche identique a TagsTab. Filtrer les roles par nom. Reference: TagsTab.tsx:374-379.", 8);

bullet("Tri alphabetique des roles dans chaque equipe", 0, true);
normalText("Ajouter un bouton de tri A-Z/Date. Trier les roles par nom par defaut. Reference: TagsTab.tsx:145-151.", 8);

bullet("Import/Export JSON des roles", 0, true);
normalText("Permettre l'export de tous les roles en JSON et l'import depuis un fichier. Reference: TagsTab.tsx:195-214.", 8);

bullet("Persistance de l'ordre des sections en localStorage", 0, true);
normalText("Sauvegarder et restaurer l'ordre des sections. Reference: TagsTab.tsx:118-120, 128.", 8);

bullet("Compteur de roles par equipe dans l'en-tete", 0, true);
normalText("Afficher le nombre total de roles dans chaque en-tete d'equipe, pas seulement le ratio selectifs/total.", 8);

bullet("Affichage de la description dans la liste", 0, true);
normalText("Afficher la description du role sous le nom, en texte grise italique, si elle existe. Reference: TagsTab.tsx:78.", 8);

subsectionTitle("6.3 P2 - Amelioration (A planifier)");

const p2Color = priorityBadge("P2");
doc.setFillColor(...p2Color);
doc.rect(MARGIN, y, 8, 8, "F");
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...p2Color);
doc.text("P2", MARGIN + 10, y + 6);
doc.setTextColor(...DARK);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text("- Amelioration", MARGIN + 22, y + 6);
y += 12;

bullet("Dashboard de statistiques des roles", 0, true);
normalText("Creer un modal dashboard avec: total roles, repartition par equipe, roles uniques vs multiples, roles dans distribution, top roles les plus assignes. Reference: TagsTab.tsx:441-527.", 8);

bullet("Modeles predefinis de roles", 0, true);
normalText("Creer un fichier role-templates.ts avec des roles standards (Loup, Voyante, Guerisseur, etc.) importables en un clic.", 8);

bullet("Mode de vue compact/detaille", 0, true);
normalText("Permettre de basculer entre une vue detaillee (actuelle) et une vue compacte (nom + couleur uniquement). Reference: TagsTab.tsx:115, 51-96.", 8);

bullet("Memoisation des elements de liste avec React.memo", 0, true);
normalText("Extraire le rendu de chaque role dans un composant RoleListItem memoise. Reference: TagsTab.tsx:51.", 8);

bullet("Apercu de l'image du role dans la liste", 0, true);
normalText("Afficher une miniature de l'image du role si imageUrl est defini.", 8);

bullet("Affichage des tags dans la liste", 0, true);
normalText("Afficher les badges des tags associes au role dans la liste.", 8);

checkPage(40);
subsectionTitle("6.4 P3 - Futur (Nice to have)");

const p3Color = priorityBadge("P3");
doc.setFillColor(...p3Color);
doc.rect(MARGIN, y, 8, 8, "F");
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.setTextColor(...p3Color);
doc.text("P3", MARGIN + 10, y + 6);
doc.setTextColor(...DARK);
doc.setFontSize(9);
doc.setFont("helvetica", "normal");
doc.text("- Futur", MARGIN + 22, y + 6);
y += 12;

bullet("Drag-and-drop des roles entre equipes", 0, true);
normalText("Permettre de deplacer un role d'une equipe a une autre par glisser-deposer. Reference: TagsTab.tsx:216-220, 319.", 8);

bullet("Operations en masse (bulk)", 0, true);
normalText("Selection multiple de roles pour appliquer des actions en masse: changer d'equipe, activer/desactiver distribution, supprimer.", 8);

bullet("Creation d'equipe inline depuis l'onglet Roles", 0, true);
normalText("Ajouter un bouton '+ Equipe' dans la liste pour creer une equipe sans changer d'onglet.", 8);

bullet("Virtualisation pour les longues listes", 0, true);
normalText("Utiliser @tanstack/react-virtual pour optimiser le rendu de 50+ roles.", 8);

bullet("Undo/Redo pour les actions sur les roles", 0, true);
normalText("L'application utilise deja zundo (package.json:31) pour l'undo global. Verifier que les actions sur les roles sont bien trackees.", 8);

// ============================================================
// PAGE 12-13: ESTIMATION D'EFFORT
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("7. Estimation d'Effort");

subsectionTitle("7.1 Estimation par Recommandation");

table(
  ["Priorite", "Recommandation", "Complexite", "Estimation"],
  [
    ["P0", "Modal confirmation suppression", "Faible", "1-2h"],
    ["P0", "Verification doublon creation", "Faible", "1h"],
    ["P0", "Suppression en cascade", "Moyenne", "3-4h"],
    ["P1", "Barre de recherche", "Faible", "2h"],
    ["P1", "Tri alphabetique", "Faible", "1-2h"],
    ["P1", "Import/Export JSON", "Moyenne", "3-4h"],
    ["P1", "Persistance localStorage", "Faible", "1h"],
    ["P1", "Compteur roles par equipe", "Faible", "1h"],
    ["P1", "Affichage description", "Faible", "1h"],
    ["P2", "Dashboard statistiques", "Moyenne", "4-6h"],
    ["P2", "Modeles predefinis", "Moyenne", "3-4h"],
    ["P2", "Mode vue compacte", "Moyenne", "2-3h"],
    ["P2", "React.memo RoleListItem", "Faible", "1-2h"],
    ["P2", "Apercu image role", "Faible", "1-2h"],
    ["P2", "Affichage tags liste", "Faible", "1-2h"],
    ["P3", "Drag-drop entre equipes", "Elevee", "6-8h"],
    ["P3", "Operations en masse", "Elevee", "6-8h"],
    ["P3", "Creation equipe inline", "Moyenne", "3-4h"],
    ["P3", "Virtualisation liste", "Moyenne", "3-4h"],
    ["P3", "Undo/Redo verification", "Faible", "1h"],
  ],
  [15, 60, 25, 25]
);

subsectionTitle("7.2 Estimation Totale par Priorite");

table(
  ["Priorite", "Nb Items", "Temps Minimum", "Temps Maximum"],
  [
    ["P0 - Critique", "3", "5h", "7h"],
    ["P1 - Important", "6", "7h", "11h"],
    ["P2 - Amelioration", "6", "12h", "19h"],
    ["P3 - Futur", "5", "19h", "25h"],
    ["TOTAL", "20", "43h", "62h"],
  ],
  [40, 25, 35, 35]
);

subsectionTitle("7.3 Plan de Mise en OEuvre Recommande");

normalText("Phase 1 (Semaine 1) - P0: Stabilisation et securite des donnees");
bullet("Modal de confirmation de suppression", 1, true);
bullet("Verification de doublon a la creation", 1, true);
bullet("Gestion de la suppression en cascade", 1, true);
normalText("Objectif: Eliminer les risques de perte de donnees.");

normalText("Phase 2 (Semaine 2) - P1: Productivite utilisateur");
bullet("Barre de recherche et tri", 1, true);
bullet("Import/Export JSON", 1, true);
bullet("Persistance localStorage et compteurs", 1, true);
bullet("Affichage de la description", 1, true);
normalText("Objectif: Rendre l'onglet Roles aussi fonctionnel que TagsTab.");

normalText("Phase 3 (Semaine 3-4) - P2: Experience utilisateur");
bullet("Dashboard statistiques", 1, true);
bullet("Modeles predefinis", 1, true);
bullet("Mode de vue et memoisation", 1, true);
normalText("Objectif: Offrir une experience premium.");

normalText("Phase 4 (Semaine 5+) - P3: Fonctionnalites avancees");
bullet("Drag-drop entre equipes", 1, true);
bullet("Operations en masse", 1, true);
normalText("Objectif: Fonctionnalites power-user.");

// ============================================================
// PAGE 13: CONCLUSION
// ============================================================
doc.addPage();
drawHeader();

sectionTitle("8. Conclusion");

subsectionTitle("Synthese");

normalText(
  "Le composant RolesTab.tsx est fonctionnel et integre correctement avec le reste de l'application VTTApp. " +
  "Cependant, il presente un decalage significatif par rapport a TagsTab en termes de fonctionnalites et d'experience utilisateur."
);

normalText(
  "Les 20 recommandations identifiees couvrent un spectre allant de la securite des donnees (P0) " +
  "aux fonctionnalites avancees (P3), avec une estimation totale de 43 a 62 heures de developpement."
);

subsectionTitle("Priorites Recommandees");

normalText("1. Implementer les 3 elements P0 dans la semaine pour securiser les operations de suppression.");
normalText("2. Aligner les fonctionnalites de base avec TagsTab (P1) pour une experience utilisateur coherente.");
normalText("3. Ajouter les fonctionnalites differentiantes (P2) pour offrir une valeur ajoutee.");
normalText("4. Planifier les fonctionnalites avancees (P3) selon les retours utilisateurs.");

subsectionTitle("References Techniques");

codeBlock(
  "Fichiers analyses:\n" +
  "  - src/components/layout/tabs/RolesTab.tsx (354 lignes)\n" +
  "  - src/components/layout/tabs/TagsTab.tsx (530 lignes)\n" +
  "  - src/types/index.ts (Role: lignes 61-81)\n" +
  "  - src/store/index.ts (Actions: lignes 667-675)\n" +
  "  - src/store/selectors.ts (Selectors: lignes 24, 113-114, 137-138)\n" +
  "  - src/components/EditingModal.tsx (Edition role: lignes 503-864)\n" +
  "  - src/components/layout/RightPanel.tsx (Distribution: lignes 119-441)\n" +
  "  - src/components/layout/Canvas.tsx (Affichage: lignes 1315-1587)\n" +
  "  - src/lib/action-engine/effects/role-team-effects.ts\n" +
  "  - src/hooks/useCallOrder.ts (lignes 44-45)",
  "Fichiers de reference"
);

subsectionTitle("Metriques du Composant");

table(
  ["Metrique", "Valeur", "Benchmark TagsTab"],
  [
    ["Lignes de code", "354", "530"],
    ["Sous-composants", "2", "3 (SortableSection, TagListItem)"],
    ["Hooks useState", "5", "13"],
    ["Hooks useMemo", "2", "5"],
    ["Hooks useCallback", "0", "7"],
    ["Hooks useEffect", "0", "1"],
    ["React.memo", "0", "1 (TagListItem)"],
    ["Fonctionnalites", "~10", "~20"],
    ["Persistance", "Aucune", "localStorage"],
  ],
  [50, 30, 55]
);

// Footer on last page
y = PAGE_HEIGHT - 25;
doc.setDrawColor(...LIGHT);
doc.setLineWidth(0.3);
doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
doc.setFontSize(7);
doc.setTextColor(...LIGHT);
doc.text("Fin du rapport - Analyse Onglet Roles - VTTApp v0.709", PAGE_WIDTH / 2, y + 5, { align: "center" });
doc.text("Genere le " + new Date().toLocaleString("fr-FR"), PAGE_WIDTH / 2, y + 10, { align: "center" });

// Save
doc.save("analyse-roles.pdf");
console.log("PDF genere avec succes: analyse-roles.pdf");
