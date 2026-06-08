from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, PageBreak, HRFlowable, KeepTogether,
                                 ListFlowable, ListItem, Frame, PageTemplate)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Register Bitstream Vera fonts (shipped with reportlab) for French accents
import reportlab
RL_FONTS = os.path.join(os.path.dirname(reportlab.__file__), 'fonts')
pdfmetrics.registerFont(TTFont('Vera', os.path.join(RL_FONTS, 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('VeraBd', os.path.join(RL_FONTS, 'VeraBd.ttf')))
pdfmetrics.registerFont(TTFont('VeraIt', os.path.join(RL_FONTS, 'VeraIt.ttf')))
pdfmetrics.registerFont(TTFont('VeraBI', os.path.join(RL_FONTS, 'VeraBI.ttf')))
FONT = 'Vera'
FONT_BOLD = 'VeraBd'
FONT_ITALIC = 'VeraIt'

# Colors
C_PRIMARY = HexColor('#1a73e8')
C_SECONDARY = HexColor('#5f6368')
C_ACCENT = HexColor('#e8f0fe')
C_BG_LIGHT = HexColor('#f8f9fa')
C_BORDER = HexColor('#dadce0')
C_GREEN = HexColor('#34a853')
C_ORANGE = HexColor('#fbbc04')
C_RED = HexColor('#ea4335')
C_PURPLE = HexColor('#9334e6')
C_DARK = HexColor('#202124')
C_TITLE_BG = HexColor('#1a237e')

OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'analyse-modifier-tag.pdf')



styles = getSampleStyleSheet()

s_title = ParagraphStyle('CustomTitle', parent=styles['Title'],
    fontName=FONT_BOLD, fontSize=26, leading=32, textColor=white,
    spaceAfter=4, alignment=TA_CENTER)

s_subtitle = ParagraphStyle('CustomSubtitle', parent=styles['Normal'],
    fontName=FONT, fontSize=11, leading=14, textColor=HexColor('#b0bec5'),
    spaceAfter=20, alignment=TA_CENTER)

s_h1 = ParagraphStyle('H1', parent=styles['Heading1'],
    fontName=FONT_BOLD, fontSize=18, leading=24, textColor=C_PRIMARY,
    spaceBefore=20, spaceAfter=10, borderPadding=(0,0,2,0))

s_h2 = ParagraphStyle('H2', parent=styles['Heading2'],
    fontName=FONT_BOLD, fontSize=14, leading=18, textColor=C_DARK,
    spaceBefore=16, spaceAfter=8)

s_h3 = ParagraphStyle('H3', parent=styles['Heading3'],
    fontName=FONT_BOLD, fontSize=12, leading=16, textColor=HexColor('#37474f'),
    spaceBefore=12, spaceAfter=6)

s_body = ParagraphStyle('Body', parent=styles['Normal'],
    fontName=FONT, fontSize=10, leading=14, textColor=HexColor('#3c4043'),
    spaceAfter=6, alignment=TA_JUSTIFY)

s_body_bold = ParagraphStyle('BodyBold', parent=s_body,
    fontName=FONT_BOLD)

s_bullet = ParagraphStyle('Bullet', parent=s_body,
    leftIndent=20, bulletIndent=8, spaceBefore=2, spaceAfter=2)

s_bullet2 = ParagraphStyle('Bullet2', parent=s_body,
    leftIndent=36, bulletIndent=24, spaceBefore=1, spaceAfter=1, fontSize=9, leading=12)

s_code = ParagraphStyle('Code', parent=styles['Code'],
    fontName='Courier', fontSize=8, leading=10, textColor=HexColor('#1a1a2e'),
    backColor=HexColor('#f5f5f5'), borderPadding=6, spaceAfter=8,
    leftIndent=8, rightIndent=8)

s_label = ParagraphStyle('Label', parent=s_body,
    fontName=FONT_BOLD, fontSize=9, textColor=HexColor('#5f6368'),
    spaceBefore=4, spaceAfter=1)

s_small = ParagraphStyle('Small', parent=s_body,
    fontSize=8, leading=10, textColor=HexColor('#80868b'))

s_tag_good = ParagraphStyle('TagGood', parent=s_body,
    backColor=HexColor('#e6f4ea'), borderPadding=(2,6,2,6), fontSize=9, leading=12,
    textColor=HexColor('#137333'))

s_tag_issue = ParagraphStyle('TagIssue', parent=s_body,
    backColor=HexColor('#fce8e6'), borderPadding=(2,6,2,6), fontSize=9, leading=12,
    textColor=HexColor('#c5221f'))

s_tag_improve = ParagraphStyle('TagImprove', parent=s_body,
    backColor=HexColor('#e8f0fe'), borderPadding=(2,6,2,6), fontSize=9, leading=12,
    textColor=HexColor('#1a73e8'))

def HLine():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor('#dadce0'),
                       spaceBefore=6, spaceAfter=6)

def SeverityBadge(level):
    colors = {'critical': ('#ea4335', '#fce8e6'), 'high': ('#fbbc04', '#fef7e0'),
              'medium': ('#1a73e8', '#e8f0fe'), 'low': ('#34a853', '#e6f4ea'),
              'info': ('#80868b', '#f1f3f4')}
    c, bg = colors.get(level, colors['info'])
    return Paragraph(f'<font color="{c}"><b>[{level.upper()}]</b></font>',
                     ParagraphStyle('badge', fontSize=8, backColor=bg,
                                    borderPadding=(1,5,1,5), textColor=HexColor(c)))

class SeverityBox(Flowable):
    def __init__(self, level, width=60, height=16):
        super().__init__()
        self.level = level
        self.width = width
        self.height = height
        colors = {'critical': ('#ea4335', '#fce8e6'), 'high': ('#fbbc04', '#fef7e0'),
                  'medium': ('#1a73e8', '#e8f0fe'), 'low': ('#34a853', '#e6f4ea'),
                  'info': ('#80868b', '#f1f3f4')}
        self.fg, self.bg = colors.get(level, colors['info'])

    def draw(self):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        c = self.canv
        c.setFillColor(HexColor(self.bg))
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(HexColor(self.fg))
        c.setFont(FONT_BOLD, 7)
        label = f'[{self.level.upper()}]'
        tw = stringWidth(label, FONT_BOLD, 7)
        c.drawString((self.width - tw) / 2, 4.5, label)

def make_section(title, items):
    """items: list of (text, severity) tuples"""
    data = []
    for item in items:
        if len(item) == 2:
            text, severity = item
        else:
            text, severity = item[0], 'info'
        data.append([
            SeverityBox(severity),
            Paragraph(text, s_body)
        ])

    t = Table(data, colWidths=[64, 450])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (1,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
    ]))
    return t

# ============================================================
# BUILD DOCUMENT
# ============================================================
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm,
    leftMargin=2.5*cm, rightMargin=2.5*cm,
    title='Analyse - Modifier Tag - VTTApp',
    author='VTTApp Audit'
)

elements = []

# ---- COVER ----
cover_data = [[
    Paragraph('VTTApp', ParagraphStyle('cover_label', fontName=FONT_BOLD, fontSize=11,
               textColor=HexColor('#90a4ae'), spaceAfter=2)),
]]
cover_t = Table(cover_data, colWidths=[160])
cover_t.setStyle(TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 0),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
]))
elements.append(cover_t)
elements.append(Paragraph('Analyse UX/UI de la fenêtre<br/>"Modifier Tag"', s_title))
elements.append(Spacer(1, 4))
elements.append(Paragraph('Rapport d\'audit détaillé — Propositions d\'amélioration', s_subtitle))
elements.append(Spacer(1, 8))

meta = [
    ['Version analysée', '0.709'],
    ['Composant', 'EditingModal.tsx (3 455 lignes)'],
    ['Type', 'TagModel / TagInstance'],
    ['Langue', 'Français (FR)'],
]
meta_t = Table(meta, colWidths=[120, 340])
meta_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), HexColor('#f1f3f4')),
    ('TEXTCOLOR', (0,0), (0,-1), HexColor('#5f6368')),
    ('FONTNAME', (0,0), (0,-1), FONT_BOLD),
    ('FONTNAME', (1,0), (1,-1), FONT),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('ALIGN', (0,0), (0,-1), 'RIGHT'),
    ('RIGHTPADDING', (0,0), (0,-1), 12),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e0e0e0')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(meta_t)

elements.append(Spacer(1, 30))
elements.append(HLine())
elements.append(Spacer(1, 12))

# ---- TABLE OF CONTENTS ----
elements.append(Paragraph('Sommaire', s_h1))
toc_items = [
    '1. Contexte et objectif de l\'analyse',
    '2. Architecture de la fenêtre',
    '3. Analyse détaillée : points forts',
    '4. Analyse détaillée : axes d\'amélioration',
    '5. Synthèse et priorisation',
    '6. Recommandations clés',
]
for item in toc_items:
    elements.append(Paragraph(item, ParagraphStyle('toc_item', parent=s_body,
        fontName=FONT_BOLD, fontSize=10, leading=16, spaceBefore=2, spaceAfter=2,
        textColor=C_PRIMARY, leftIndent=12)))
elements.append(PageBreak())

# ============================================================
# 1. CONTEXT
# ============================================================
elements.append(Paragraph('1. Contexte et objectif de l\'analyse', s_h1))
elements.append(Paragraph(
    'La fenêtre "Modifier Tag" est le point d\'entrée central pour configurer les tags '
    '(étiquettes) dans VTTApp, une application de table virtuelle pour jeux de rôle. '
    'Les tags permettent d\'attacher des informations (vies, votes, points, utilisations, '
    'ordre d\'appel) aux joueurs ou au plateau, et d\'interagir avec l\'interface smartphone '
    'des joueurs.',
    s_body))
elements.append(Spacer(1, 4))

elements.append(Paragraph('Contexte d\'affichage', s_h2))
elements.append(Paragraph(
    'La fenêtre s\'affiche dans trois contextes distincts :', s_body))
contexts = [
    '<b>Édition du modèle de tag</b> (<i>Modifier Tag: nom</i>) — accessible depuis l\'onglet "Tags" du panneau gauche, '
    'via le bouton "Modifier" sur chaque tag. C\'est la vue la plus complète avec 5 onglets.',
    '<b>Édition d\'une instance de tag sur un joueur</b> (<i>Modifier Tag de [joueur]: [tag]</i>) — '
    'accessible depuis le menu contextuel sur un joueur dans le canevas ou depuis l\'onglet Jeu.',
    '<b>Édition d\'un marqueur</b> (<i>Modifier Marqueur: [tag]</i>) — '
    'accessible depuis le menu contextuel sur un marqueur placé sur le plateau.',
]
for c in contexts:
    elements.append(Paragraph(c, s_bullet, bulletText='\u2022'))
elements.append(Spacer(1, 4))

elements.append(Paragraph('Fonctionnalités couvertes', s_h2))
features = [
    '5 onglets : Général, Apparence, Champs, Smartphone, Container',
    'Configuration complète des métadonnées (nom, catégorie, visibilité)',
    'Sélecteur d\'icône (70+ icônes Lucide) avec upload d\'image personnalisée',
    'Pick de couleur',
    'Champs numériques : Appel Jour/Nuit, Vies, Votes, Points, Utilisations',
    'Configuration smartphone avancée : sélecteur de joueurs, filtres, actions, feedbacks',
    'Système de conteneur hiérarchique (tags parents/enfants)',
    'État "secret" pour invisibilité totale côté joueur',
]
for f in features:
    elements.append(Paragraph(f, s_bullet, bulletText='\u2022'))
elements.append(PageBreak())

# ============================================================
# 2. ARCHITECTURE
# ============================================================
elements.append(Paragraph('2. Architecture de la fenêtre', s_h1))

elements.append(Paragraph('Structure du composant', s_h2))
elements.append(Paragraph(
    'Le code de la fenêtre "Modifier Tag" réside dans <b>EditingModal.tsx</b> (3 455 lignes), '
    'un composant unique qui gère également l\'édition des joueurs, rôles, équipes, '
    'templates, catégories, marqueurs, notes et boutons sonores. Les sections dédiées '
    'aux tags se trouvent aux lignes 1568–2365 (modèle) et 2366–3100+ (instance).',
    s_body))

arch_data = [
    ['Header', 'Titre dynamique + bouton Fermer (X) + barre supérieure'],
    ['Onglets', '5 onglets tabulés : Général, Apparence, Champs, Smartphone, Container'],
    ['Contenu', 'Zone scrollable avec formulaires spécifiques à chaque onglet'],
    ['Footer', 'Bouton "Terminé" pour fermer'],
]
arch_t = Table(arch_data, colWidths=[80, 430])
arch_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,-1), HexColor('#f1f3f4')),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e0e0e0')),
    ('FONTNAME', (0,0), (0,-1), FONT_BOLD),
    ('FONTNAME', (1,0), (1,-1), FONT),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
elements.append(arch_t)
elements.append(Spacer(1, 8))

elements.append(Paragraph('Modèle de données (types)', s_h2))
elements.append(Paragraph(
    'Le type <b>TagModel</b> (ligne 145 de types/index.ts) étend <b>MarkerParameter</b> et contient '
    '35+ propriétés. L\'interface <b>TagInstance</b> étend TagModel avec <i>instanceId</i> et '
    '<i>parentTagInstanceId</i>. Cela signifie qu\'une instance hérite de toutes les propriétés '
    'du modèle, créant une redondance potentielle mais offrant une flexibilité de surcharge.',
    s_body))

flow_data = [
    ['TagsTab', 'Clic "Modifier"', 'Onglet Tags'],
    ['Canvas (menu ctx)', 'Clic "Modifier le tag"', 'Canevas / Joueur'],
    ['RightPanel', 'Clic "Modifier"', 'Panneau droit'],
    ['', 'setEditingEntity()', 'Store Zustand'],
    ['', '', 'EditingModal.tsx'],
]
flow_t = Table(flow_data, colWidths=[100, 140, 160])
flow_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTNAME', (0,0), (-1,0), FONT_BOLD),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e0e0e0')),
    ('FONTNAME', (0,1), (-1,-1), FONT),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('BACKGROUND', (0,1), (0,-1), HexColor('#f8f9fa')),
    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
]))
elements.append(Spacer(1, 6))
elements.append(Paragraph('<i>Diagramme de flux : comment on arrive à la fenêtre "Modifier Tag"</i>', s_small))
elements.append(flow_t)

elements.append(PageBreak())

# ============================================================
# 3. POINTS FORTS
# ============================================================
elements.append(Paragraph('3. Analyse détaillée : points forts', s_h1))

strengths = [
    ('Visibilité multi-canal granulaire',
     'Chaque tag peut être rendu visible ou non dans 4 contextes distincts : info-bulle (tooltip), '
     'onglet Jeu, smartphone et pastille au-dessus du joueur. Un flag "Tag Secret" force l\'invisibilité '
     'totale côté joueur, peu importe les autres réglages. Cette flexibilité est excellente pour un VTT.',
     'medium'),

    ('Configuration smartphone très complète',
     'L\'onglet Smartphone est remarquablement riche : sélecteur de joueurs (unique/multiple), 8 filtres '
     'combinables, retour d\'information configurable (rôle réel, équipe, vu comme...), vérification de rôle, '
     'texte de bouton personnalisé, feedback joueur et MJ, fusion de tags, déclenchement d\'actions '
     'et association d\'aides de jeu. C\'est le cœur de l\'interactivité joueur.',
     'low'),

    ('Sélecteur d\'icône ergonomique',
     'La grille d\'icônes dans l\'onglet Apparence est bien conçue : 70+ icônes affichées dans une '
     'grille scrollable avec highlight visuel de l\'icône active. L\'upload d\'image personnalisée '
     'avec aperçu et suppression est un plus appréciable.',
     'info'),

    ('Système de conteneur hiérarchique',
     'La possibilité de faire d\'un tag un "conteneur" qui applique automatiquement des tags enfants '
     'est puissante pour les jeux de rôle complexes (ex: un tag "Loups-Garous" qui applique '
     '"Morsure", "Transformation", etc.). L\'UI par catégorie avec compteurs est claire.',
     'medium'),

    ('Onglets "Container" disponibles pour les instances',
     'Contrairement à ce qu\'on pourrait attendre, l\'onglet Container est également présent '
     'dans l\'édition d\'instance (et pas seulement dans le modèle). Cela permet de modifier '
     'la composition du conteneur au cas par cas.',
     'info'),

    ('Cohérence visuelle avec le thème Tailwind',
     'Le composant suit un thème CSS cohérent utilisant les variables Tailwind (--primary, --border, '
     '--background, --muted, --card, etc.). Les icônes Lucide sont bien intégrées et la '
     'charte graphique est homogène avec le reste de l\'application.',
     'medium'),
]

for title, desc, sev in strengths:
    elements.append(Paragraph(f'<b>{title}</b>', s_h3))
    elements.append(make_section(title, [(desc, sev)]))
    elements.append(Spacer(1, 4))

elements.append(PageBreak())

# ============================================================
# 4. AXES D'AMÉLIORATION
# ============================================================
elements.append(Paragraph('4. Analyse détaillée : axes d\'amélioration', s_h1))

# 4.1
elements.append(Paragraph('4.1 Problèmes d\'architecture et maintenabilité', s_h2))
issues_arch = [
    ('Composant monolithique de 3 455 lignes — '
     'EditingModal.tsx dépasse 3 400 lignes et gère 10+ types d\'entités différents. '
     'La lisibilité, la testabilité et la maintenance sont gravement impactées. '
     'Un bug dans une section (ex: tag) peut affecter les autres (ex: son, joueur).',
     'critical'),
    ('Duplication massive de code entre modèle et instance — '
     'Les onglets Général, Apparence, Champs et Smartphone sont intégralement dupliqués entre '
     'la section tagModel (~800 lignes) et tagInstance (~800 lignes). Les différences sont '
     'minimes (updateTagModel vs updateTagInstance, préfixes d\'ID).',
     'critical'),
    ('Typage insuffisant : `any` généralisé — '
     'Le paramètre `tag` est typé en `any` (ligne 2367), tout comme `updateTagInstance`. '
     'Aucune vérification statique des propriétés autorisées. Les mutations silencieuses '
     'sont possibles.',
     'high'),
    ('Duplication des listes d\'icônes — '
     'TAG_ICONS (lignes 28-46) et TEAM_ICONS (lignes 8-26) sont deux tableaux quasiment identiques. '
     'Toute modification doit être faite aux deux endroits.',
     'medium'),
    ('Aucune séparation des responsabilités — '
     'Pas de composants enfants : TagGeneralForm, TagAppearanceForm, TagFieldsForm, TagSmartphoneForm, '
     'TagContainerForm. Tout est inline dans le rendu conditionnel géant.',
     'high'),
]
for desc, sev in issues_arch:
    elements.append(make_section(desc, [(desc, sev)]))
    elements.append(Spacer(1, 2))
elements.append(Spacer(1, 6))

# 4.2
elements.append(Paragraph('4.2 Problèmes UX et ergonomie', s_h2))
issues_ux = [
    ('Aucun bouton "Appliquer" ou "Sauvegarder" explicite — '
     'Les modifications sont sauvées immédiatement via le store Zustand (pas de formulaire contrôlé '
     'avec soumission). Il n\'y a pas de confirmation, pas d\'undo, pas de "Annuler". '
     'Les changements sont irréversibles sans le système Zundo (qui n\'est peut-être pas activé pour les tags).',
     'high'),
    ('Pas de validation de saisie — '
     'Les champs "Appel Jour/Nuit", "Vies", "Votes", etc. sont des champs texte libres sans validation. '
     'L\'utilisateur peut saisir n\'importe quoi ("abc", "!@#"). Aucun feedback d\'erreur.',
     'high'),
    ('État d\'effondrement des filtres smartphone réinitialisé inutilement — '
     '`setIsSmartphoneFiltersExpanded(false)` est appelé à chaque changement d\'entité éditée (ligne 124). '
     'Si l\'utilisateur passe d\'un tag à un autre, le panneau de filtres se referme, ce qui est frustrant.',
     'medium'),
    ('Aucune indication de progression ou chargement — '
     'L\'upload d\'image ne montre pas de spinner/barre de progression. L\'utilisateur ne sait pas '
     'si l\'upload a commencé ou est terminé.',
     'medium'),
    ('Pas de retour visuel sur les changements — '
     'Aucune animation ou indicateur lorsqu\'une propriété change. Le formulaire est statique.',
     'low'),
    ('Le bouton "Terminé" est le seul moyen de fermer — '
     'Bien qu\'il y ait un X dans le header, le bouton "Terminé" en bas est redondant avec la croix. '
     'De plus, "Terminé" suggère une validation alors qu\'il ne fait que fermer.',
     'low'),
]
for desc, sev in issues_ux:
    elements.append(make_section(desc, [(desc, sev)]))
    elements.append(Spacer(1, 2))
elements.append(Spacer(1, 6))

# 4.3
elements.append(Paragraph('4.3 Problèmes spécifiques aux onglets', s_h2))
issues_tabs = [
    ('Onglet "Général" surchargé — '
     'Il mélange : nom, catégorie, 6 checkboxes de visibilité, et une section "Tag Secret". '
     'Les checkboxes devraient être regroupées visuellement par thème, et la section secrète '
     'mérite un espace plus distinct.',
     'medium'),
    ('Onglet "Champs" : champs hétérogènes sans contexte — '
     '"Vu comme rôle" et "Vu dans équipe" sont placés dans l\'onglet "Champs" mais relèvent '
     'plutôt de la visibilité/tromperie. "Texte libre" (textarea) est également dans Champs '
     'alors qu\'il pourrait être dans Général.',
     'medium'),
    ('Onglet "Container" accessible dans l\'instance — '
     'Modifier les tags enfants d\'un container au niveau de l\'instance est cohérent, '
     'mais cela crée une confusion : la modification affecte-t-elle le modèle ou seulement l\'instance ? '
     'Le code montre que `updateTagInstance({ childTagIds })` modifie l\'instance uniquement, '
     'mais l\'interface utilisateur ne le précise pas.',
     'high'),
    ('Onglet "Smartphone" très dense — '
     'C\'est l\'onglet le plus long avec le plus d\'options. Les filtres sont repliés par défaut '
     'mais le contenu visible seul fait 2-3 écrans. Un manque de hiérarchie visuelle rend '
     'la navigation difficile.',
     'medium'),
    ('Onglet "Apparence" incohérent entre modèle et instance — '
     'Dans l\'instance, la section "Image personnalisée" a un layout différent (plus simple) '
     'que dans le modèle (avec URL, aperçu détaillé, suppression). Cela crée une incohérence.',
     'low'),
]
for desc, sev in issues_tabs:
    elements.append(make_section(desc, [(desc, sev)]))
    elements.append(Spacer(1, 2))
elements.append(Spacer(1, 6))

# 4.4
elements.append(Paragraph('4.4 Problèmes techniques et performance', s_h2))
issues_tech = [
    ('Re-rendus excessifs — '
     'Le changement de n\'importe quel champ dans un onglet provoque un re-render complet '
     'du composant (pas de memoïsation des sections individuelles). Les listes d\'icônes '
     'sont re-rendues à chaque changement.',
     'high'),
    ('Recalcul du tag dans le rendu — '
     'Le `tags.find(t => t.id === editingEntity.id)` est exécuté à chaque render (ligne 1569). '
     'L\'utilisation d\'un sélecteur mémoïsé serait préférable.',
     'medium'),
    ('Duplication des données d\'icônes en mémoire — '
     'Deux tableaux d\'icônes quasiment identiques (TAG_ICONS, TEAM_ICONS) sont chargés '
     'même quand un seul est nécessaire.',
     'low'),
    ('Manque de virtualisation — '
     'Si l\'utilisateur a beaucoup de tags (50+), le conteneur liste tous les tags sans '
     'virtualisation. L\'onglet Container en particulier pourrait en bénéficier.',
     'low'),
]
for desc, sev in issues_tech:
    elements.append(make_section(desc, [(desc, sev)]))
    elements.append(Spacer(1, 2))
elements.append(Spacer(1, 6))

# 4.5
elements.append(Paragraph('4.5 Problèmes d\'accessibilité', s_h2))
issues_a11y = [
    ('Contraste insuffisant sur certains textes — '
     'Les labels "text-muted-foreground" et les textes en "text-[10px]" peuvent poser problème '
     'de lisibilité, particulièrement sur projecteur en session de jeu.',
     'medium'),
    ('Pas d\'attributs ARIA avancés — '
     'Les onglets n\'utilisent pas role="tablist", role="tab", aria-selected. Les selects '
     'ont des labels mais via htmlFor (bien). Les tabs sont des `<button>` sans rôle ARIA.',
     'medium'),
    ('Focus trap non implémenté — '
     'Le modal n\'emprisonne pas le focus clavier. Un utilisateur au clavier peut tabuler '
     'hors de la modale sans moyen de revenir sans souris.',
     'high'),
    ('Taille des cibles tactiles trop petite — '
     'Certains boutons (ex: sélecteur d\'icônes : 32×32px, checkbox 14×14px) sont en dessous '
     'du seuil recommandé de 44×44px pour le tactile.',
     'medium'),
]
for desc, sev in issues_a11y:
    elements.append(make_section(desc, [(desc, sev)]))
    elements.append(Spacer(1, 2))

elements.append(PageBreak())

# ============================================================
# 5. SYNTHÈSE
# ============================================================
elements.append(Paragraph('5. Synthèse et priorisation', s_h1))

elements.append(Paragraph('Matrice d\'impact', s_h2))

summary_data = [
    ['Catégorie', 'Total', 'Critical', 'High', 'Medium', 'Low'],
    ['Architecture / Maintenabilité', '5', '2', '2', '1', '0'],
    ['UX / Ergonomie', '6', '0', '2', '3', '1'],
    ['Spécifique aux onglets', '5', '0', '1', '3', '1'],
    ['Technique / Performance', '4', '0', '1', '1', '2'],
    ['Accessibilité', '4', '0', '1', '3', '0'],
    ['TOTAL', '24', '2', '7', '11', '4'],
]

summary_t = Table(summary_data, colWidths=[130, 50, 60, 50, 50, 50])
summary_t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), C_DARK),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('BACKGROUND', (0,-1), (-1,-1), HexColor('#e8f0fe')),
    ('FONTNAME', (0,0), (-1,-1), FONT_BOLD),
    ('FONTSIZE', (0,0), (-1,-1), 9),
    ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#dadce0')),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
]))
elements.append(summary_t)
elements.append(Spacer(1, 16))

elements.append(Paragraph('Priorité par quadrant', s_h2))
quadrants = [
    ('<b>🔴 Critique (2) — Action immédiate</b>',
     '• 4.1a Composant monolithique : extraire les formulaires tags dans des sous-composants\n'
     '• 4.1b Duplication modèle/instance : créer un composant partagé TagForm'),
    ('<b>🟠 Haute (7) — Prioritaire</b>',
     '• 4.1c Typage any → types stricts\n'
     '• 4.1e Séparation en composants enfants réutilisables\n'
     '• 4.2a Bouton Annuler + confirmation\n'
     '• 4.2b Validation des champs numériques\n'
     '• 4.3c Feedback clair modèle vs instance pour Container\n'
     '• 4.4a Mémoïsation des sections\n'
     '• 4.5c Focus trap'),
    ('<b>🟡 Moyenne (11) — Amélioration continue</b>',
     '• 4.1d Fusionner TAG_ICONS / TEAM_ICONS\n'
     '• 4.2c Sauvegarde état d\'expansion des filtres\n'
     '• 4.2d Spinner upload image\n'
     '• 4.3a Regroupement des checkboxes Général\n'
     '• 4.3b Réorganisation onglet Champs\n'
     '• 4.3d Hiérarchie visuelle smartphone\n'
     '• 4.4b Sélecteur mémoïsé\n'
     '• 4.5a Contraste des textes\n'
     '• 4.5b ARIA tabs\n'
     '• 4.5d Taille cibles tactiles'),
    ('<b>🟢 Basse (4) — Itération future</b>',
     '• 4.2e Animations feedback\n'
     '• 4.2f Cohérence bouton fermeture\n'
     '• 4.3e Cohérence onglet Apparence modèle/instance\n'
     '• 4.4c Optimisation mémoire icônes'),
]
for title, content in quadrants:
    elements.append(Paragraph(title, s_h3))
    elements.append(Paragraph(content.replace('\n', '<br/>'), s_small))
    elements.append(Spacer(1, 4))

elements.append(PageBreak())

# ============================================================
# 6. RECOMMANDATIONS
# ============================================================
elements.append(Paragraph('6. Recommandations clés', s_h1))

elements.append(Paragraph(
    'Les recommandations sont organisées en 3 phases pour un plan d\'action réaliste.',
    s_body))
elements.append(Spacer(1, 6))

# Phase 1
elements.append(Paragraph('Phase 1 — Refactoring architectural (priorité critique)', s_h2))
phase1 = [
    '<b>Extraire TagModelForm et TagInstanceForm</b> — Créer deux composants séparés avec un '
    'composant partagé TagFormContent pour les onglets communs. Cela divise immédiatement '
    '~1 600 lignes en unités gérables.',
    '<b>Introduire un type TagFormData</b> — Remplacer `any` par une interface stricte qui '
    'contient uniquement les propriétés éditables, avec validation intégrée.',
    '<b>Séparer EditingModal</b> — Créer des fichiers/modules distincts pour chaque type '
    'd\'entité éditable. EditingModal.tsx devient un simple routeur.',
]
for item in phase1:
    elements.append(Paragraph(item, s_bullet, bulletText='\u2022'))
elements.append(Spacer(1, 8))

# Phase 2
elements.append(Paragraph('Phase 2 — Améliorations UX (priorité haute)', s_h2))
phase2 = [
    '<b>Ajouter un mécanisme "Appliquer / Annuler"</b> — Utiliser un état local pour les '
    'modifications et ne les propager au store que sur clic "Appliquer". Ajouter "Annuler" '
    'pour revenir à l\'état précédent.',
    '<b>Validation des champs</b> — Valider les champs numériques (pattern/saisie). Afficher '
    'un message d\'erreur sous le champ en rouge si la valeur est invalide.',
    '<b>Focus trap et navigation clavier</b> — Implémenter un focus trap dans la modale et '
    'rendre les onglets navigables avec flèches gauche/droite.',
    '<b>Feedback de chargement</b> — Ajouter un état "uploading" avec spinner pour les uploads d\'image.',
]
for item in phase2:
    elements.append(Paragraph(item, s_bullet, bulletText='\u2022'))
elements.append(Spacer(1, 8))

# Phase 3
elements.append(Paragraph('Phase 3 — Polissage et accessibilité (priorité moyenne/basse)', s_h2))
phase3 = [
    '<b>Réorganiser l\'onglet Général</b> — Grouper les checkboxes par thème (Tooltip, Jeu, '
    'Smartphone) dans des sous-sections avec bordures légères. Déplacer "Tag Secret" dans '
    'une section destructive claire.',
    '<b>Roles ARIA pour les onglets</b> — Ajouter role="tablist", role="tab", role="tabpanel", '
    'aria-selected, aria-controls, aria-labelledby pour l\'accessibilité.',
    '<b>Augmenter les tailles tactiles</b> — S\'assurer que tous les boutons et inputs '
    'interactifs font au moins 44×44px.',
    '<b>Unifier les listes d\'icônes</b> — Créer une constante partagée ICONS avec un flag '
    'de catégorie (tag/team) plutôt que deux tableaux parallèles.',
    '<b>Optimiser les re-rendus</b> — Utiliser React.memo sur les sections d\'onglets extraites, '
    'et useMemo/useCallback pour les handlers.',
    '<b>Améliorer le feedback de l\'onglet Container</b> — Ajouter un message clair : '
    '"Ces modifications s\'appliquent à <b>cette instance seulement</b>" ou '
    '"Ces modifications s\'appliquent au <b>modèle du tag</b>" selon le contexte.',
]
for item in phase3:
    elements.append(Paragraph(item, s_bullet, bulletText='\u2022'))
elements.append(Spacer(1, 16))

# ---- FINAL NOTE ----
elements.append(HLine())
elements.append(Spacer(1, 8))
elements.append(Paragraph(
    '<i>Rapport généré le 22 mai 2026 — VTTApp v0.709 — '
    'Analyse basée sur les fichiers sources : src/components/EditingModal.tsx, '
    'src/types/index.ts, src/components/layout/tabs/TagsTab.tsx, '
    'src/components/TagDistributorWindow.tsx</i>',
    ParagraphStyle('footer', parent=s_small, textColor=HexColor('#9aa0a6'),
                   alignment=TA_CENTER, spaceBefore=10)))

# ============================================================
# BUILD
# ============================================================
doc.build(elements)
print(f'PDF generated: {OUTPUT}')
