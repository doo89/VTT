const { jsPDF } = require("jspdf");

const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
let y = 20;

// Colors
const PRIMARY = [124, 58, 237];
const SECONDARY = [59, 130, 246];
const ACCENT = [16, 185, 129];
const DARK = [31, 41, 55];
const MEDIUM = [107, 114, 128];
const LIGHT = [156, 163, 175];
const BG_LIGHT = [249, 250, 251];
const CODE_BG = [245, 243, 255];
const LINE = [229, 231, 235];

function checkPage(needed = 20) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
    return true;
  }
  return false;
}

function drawHeader(title) {
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, 0, PAGE_WIDTH, 10, "F");
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT);
  doc.text("Analyse Connexion Supabase & QR Code Smartphone - VTTApp v0.709", MARGIN, 7);
  doc.text(new Date().toLocaleDateString("fr-FR"), PAGE_WIDTH - MARGIN - 20, 7);
  y = 16;
}

function sectionTitle(text) {
  checkPage(22);
  doc.setFillColor(...PRIMARY);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 9, "F");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 3, y + 6);
  y += 14;
  doc.setTextColor(...DARK);
}

function subsectionTitle(text) {
  checkPage(16);
  doc.setDrawColor(...SECONDARY);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + 4, y);
  doc.setLineWidth(0.3);
  doc.setFontSize(10);
  doc.setTextColor(...SECONDARY);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 6, y + 1);
  y += 7;
  doc.setTextColor(...DARK);
}

function subsubsectionTitle(text) {
  checkPage(12);
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 4, y + 1);
  y += 6;
  doc.setTextColor(...DARK);
}

function bodyText(text, indent = 0) {
  checkPage(6);
  const x = MARGIN + indent * 4;
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent * 4);
  doc.text(lines, x, y + 3);
  y += lines.length * 4 + 2;
}

function bullet(text, indent = 0, bold = false) {
  checkPage(6);
  const x = MARGIN + indent * 4;
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent * 4 - 6);
  doc.text("\u2022", x, y + 3);
  doc.text(lines, x + 4, y + 3);
  y += lines.length * 4 + 2;
}

function codeBlock(lines, indent = 0) {
  checkPage(6 * lines.length + 6);
  const x = MARGIN + indent * 4;
  const blockW = CONTENT_WIDTH - indent * 4;
  doc.setFillColor(...CODE_BG);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  const blockH = lines.length * 3.5 + 4;
  doc.roundedRect(x, y, blockW, blockH, 1, 1, "FD");
  doc.setFontSize(6.5);
  doc.setTextColor(55, 48, 163);
  doc.setFont("courier", "normal");
  lines.forEach((line, i) => {
    doc.text(line, x + 2, y + 3 + i * 3.5);
  });
  y += blockH + 4;
  doc.setTextColor(...DARK);
}

function arrowDiagram(items) {
  checkPage(6 * items.length + 8);
  doc.setFontSize(7);
  doc.setTextColor(...MEDIUM);
  doc.setFont("courier", "normal");
  items.forEach((item, i) => {
    doc.text(item, MARGIN + 4, y + 3 + i * 5);
  });
  y += items.length * 5 + 4;
  doc.setTextColor(...DARK);
}

function infoBox(text) {
  checkPage(12);
  const x = MARGIN;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.3);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 6);
  const h = lines.length * 3.5 + 6;
  doc.roundedRect(x, y, CONTENT_WIDTH, h, 1, 1, "FD");
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "italic");
  doc.text(lines, x + 3, y + 4);
  y += h + 4;
  doc.setTextColor(...DARK);
}

// ==================== PAGE 1: TITLE ====================
doc.setFillColor(...PRIMARY);
doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

doc.setFontSize(28);
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.text("Analyse Technique", PAGE_WIDTH / 2, 90, { align: "center" });

doc.setFontSize(18);
doc.setTextColor(196, 181, 253);
doc.text("Connexion Supabase & QR Code Smartphone", PAGE_WIDTH / 2, 105, { align: "center" });

doc.setFontSize(11);
doc.setTextColor(221, 214, 254);
doc.text("VTTApp - Application de Table de Jeu Virtuelle", PAGE_WIDTH / 2, 125, { align: "center" });

doc.setFontSize(9);
doc.setTextColor(196, 181, 253);
const dateStr = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
doc.text(`Document g\u00e9n\u00e9r\u00e9 le ${dateStr}`, PAGE_WIDTH / 2, 140, { align: "center" });

doc.setFontSize(8);
doc.setTextColor(167, 139, 250);
doc.text("Version de l'application : v0.709", PAGE_WIDTH / 2, 150, { align: "center" });

y = 180;
doc.setFontSize(9);
doc.setTextColor(196, 181, 253);
doc.setFont("helvetica", "normal");
doc.text("D\u00e9partement Technique - Analyse d'Architecture", PAGE_WIDTH / 2, y, { align: "center" });

doc.addPage();
y = MARGIN;

// ==================== TABLE OF CONTENTS ====================
sectionTitle("Table des Mati\u00e8res");

const toc = [
  "1. Architecture Globale de la Connexion",
  "   1.1 Vue d'ensemble du syst\u00e8me",
  "   1.2 Sch\u00e9ma de communication",
  "2. Connexion Supabase",
  "   2.1 Initialisation du client",
  "   2.2 Cascade de r\u00e9solution des credentials",
  "   2.3 Bootstrap au d\u00e9marrage",
  "   2.4 Realtime Broadcast (couche de communication)",
  "   2.5 Stockage de fichiers (Storage)",
  "   2.6 Interface utilisateur de configuration",
  "3. G\u00e9n\u00e9ration des QR Codes",
  "   3.1 Biblioth\u00e8que utilis\u00e9e",
  "   3.2 QR Codes disponibles",
  "   3.3 Construction des URLs",
  "4. Flux de Connexion Smartphone",
  "   4.1 \u00c9tape 1 : Cr\u00e9ation de la salle",
  "   4.2 \u00c9tape 2 : Partage via QR Code",
  "   4.3 \u00c9tape 3 : Scan et rejoindre",
  "   4.4 \u00c9tape 4 : Connexion Realtime",
  "   4.5 \u00c9tape 5 : Traitement de la demande",
  "   4.6 \u00c9tape 6 : Interface Smartphone",
  "5. Interactions Smartphone (Tags)",
  "   5.1 Configuration des tags smartphone",
  "   5.2 S\u00e9lection de joueurs",
  "   5.3 Actions d\u00e9clench\u00e9es",
  "6. S\u00e9curit\u00e9 et Gestion des Erreurs",
  "7. D\u00e9pendances et Configuration",
];

doc.setFontSize(8);
doc.setTextColor(...DARK);
doc.setFont("helvetica", "normal");
toc.forEach((line) => {
  const isMain = !line.startsWith("   ");
  doc.setFont("helvetica", isMain ? "bold" : "normal");
  doc.text(line, MARGIN + 4, y + 3);
  y += 4.5;
});

doc.addPage();
y = MARGIN;
drawHeader("Architecture Globale");

// ==================== 1. ARCHITECTURE GLOBALE ====================
sectionTitle("1. Architecture Globale de la Connexion");

subsectionTitle("1.1 Vue d'ensemble du syst\u00e8me");

bodyText("L'application VTTApp repose sur une architecture client-serveur o\u00f9 Supabase agit comme infrastructure de communication en temps r\u00e9el (Realtime Broadcast). Le MJ (Game Master) h\u00e9berge la partie sur son navigateur et les joueurs se connectent via leurs smartphones en scannant un QR Code.");

bodyText("Points cl\u00e9s de l'architecture :");
bullet("Pas de serveur d\u00e9di\u00e9 : la logique m\u00e9tier s'ex\u00e9cute enti\u00e8rement dans le navigateur du MJ");
bullet("Supabase Realtime sert de bus de communication entre le MJ et les smartphones");
bullet("Les joueurs n'ont pas besoin de compte : ils rejoignent via un code de salle et leur pseudo");
bullet("Le State (Zustand) du MJ est la source de v\u00e9rit\u00e9, diffus\u00e9e en全文 aux joueurs");

subsectionTitle("1.2 Sch\u00e9ma de communication");

arrowDiagram([
  "+------------------+         +------------------+         +------------------+",
  "|  PC du MJ (Host) |         |   Supabase        |         | Smartphone Joueur|",
  "|                  |         |   Realtime        |         |                  |",
  "|  GmView.tsx      | -----> | Channel:room:XXXX  | <----- | PlayerView.tsx   |",
  "|  Canvas.tsx      | sync   | Broadcast Layer   | sync    | PlayerJoin.tsx   |",
  "|  realtime-host.ts| state  |                   | state   | PlayerView.tsx   |",
  "+------------------+         +------------------+         +------------------+",
  "       |                            |                            |",
  "       |  initHostRealtime(code)    |                            |",
  "       |  channel('room:XXXX')     |                            |",
  "       |=============================>                            |",
  "       |                            |  channel('room:XXXX')      |",
  "       |                            |<=============================",
  "       |                            |                            |",
  "       |  send: sync_state          |                            |",
  "       |  recv: join_request        |                            |",
  "       |  recv: smartphone_action   |                            |",
  "       |  recv: get_state           |                            |",
]);

// ==================== 2. CONNEXION SUPABASE ====================
doc.addPage();
y = MARGIN;
drawHeader("Connexion Supabase");

sectionTitle("2. Connexion Supabase");

subsectionTitle("2.1 Initialisation du client");

bodyText("Fichier : src/lib/supabase.ts");
bodyText("Le client Supabase est initialis\u00e9 via createClient() de @supabase/supabase-js. Si les credentials sont invalides ou absents, le client est null et les fonctionnalit\u00e9s n\u00e9cessitant Supabase sont d\u00e9sactiv\u00e9es.");

codeBlock([
  "import { createClient } from '@supabase/supabase-js';",
  "",
  "const supabaseUrl = getEnvUrl() as string;",
  "const supabaseAnonKey = getEnvKey() as string;",
  "",
  "let sbClient = null;",
  "try {",
  "  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {",
  "    sbClient = createClient(supabaseUrl, supabaseAnonKey);",
  "  }",
  "} catch (error) {",
  "  console.error('Invalid Supabase configuration', error);",
  "}",
  "",
  "export const supabase = sbClient; // Peut \u00eatre null",
]);

subsectionTitle("2.2 Cascade de r\u00e9solution des credentials");

bodyText("L'URL et la cl\u00e9 anon sont r\u00e9solues selon une priorit\u00e9 stricte :");

subsubsectionTitle("Pour l'URL Supabase (getEnvUrl) :");
bullet("1. Param\u00e8tre d'URL ?sburl=... (base64, stock\u00e9 en sessionStorage)");
bullet("2. sessionStorage 'VTT_SB_URL_OVERRIDE'");
bullet("3. localStorage 'VTT_SUPABASE_URL'");
bullet("4. import.meta.env.VITE_SUPABASE_URL (fichier .env)");
bullet("5. import.meta.env.NEXT_PUBLIC_SUPABASE_URL");

subsubsectionTitle("Pour la cl\u00e9 anon (getEnvKey) :");
bullet("1. Param\u00e8tre d'URL ?sbkey=... (base64, stock\u00e9 en sessionStorage)");
bullet("2. sessionStorage 'VTT_SB_KEY_OVERRIDE'");
bullet("3. localStorage 'VTT_SUPABASE_ANON_KEY'");
bullet("4. import.meta.env.VITE_SUPABASE_ANON_KEY (fichier .env)");
bullet("5. import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY");

codeBlock([
  "export const getEnvUrl = () => {",
  "  const params = new URLSearchParams(window.location.search);",
  "  let url = params.get('sburl');",
  "  if (url) {",
  "    try { url = atob(decodeURIComponent(url)); } catch(e) {}",
  "    sessionStorage.setItem('VTT_SB_URL_OVERRIDE', url);",
  "    return url;",
  "  }",
  "  const sessionUrl = sessionStorage.getItem('VTT_SB_URL_OVERRIDE');",
  "  if (sessionUrl) return sessionUrl;",
  "  return localStorage.getItem('VTT_SUPABASE_URL') ||",
  "    import.meta.env.VITE_SUPABASE_URL ||",
  "    import.meta.env.NEXT_PUBLIC_SUPABASE_URL;",
  "};",
]);

subsectionTitle("2.3 Bootstrap au d\u00e9marrage");

bodyText("Fichier : src/main.tsx");
bodyText("Au chargement de l'application, le bootstrap v\u00e9rifie les param\u00e8tres d'URL pour injecter les credentials Supabase :");

codeBlock([
  "// Lecture des param\u00e8tres d'URL",
  "const sburl = searchParams.get('sburl');",
  "const sbkey = searchParams.get('sbkey');",
  "",
  "if (sburl && sbkey) {",
  "  localStorage.setItem('VTT_SUPABASE_URL', atob(sburl));",
  "  localStorage.setItem('VTT_SUPABASE_ANON_KEY', atob(sbkey));",
  "  sessionStorage.setItem('VTT_SB_URL_OVERRIDE', atob(sburl));",
  "  sessionStorage.setItem('VTT_SB_KEY_OVERRIDE', atob(sbkey));",
  "  // Redirection propre en conservant ?code=...",
  "  window.location.replace(newUrl);",
  "}",
]);

bullet("Permet aux QR codes d'encoder les credentials pour les nouveaux utilisateurs");
bullet("Une redirection nettoie l'URL des param\u00e8tres sburl/sbkey");
bullet("Fallback : lecture du fichier /env.example si VTT_USE_ENV_EXAMPLE est actif");

// ==================== 2.4 REALTIME ====================
doc.addPage();
y = MARGIN;
drawHeader("Supabase Realtime");

subsectionTitle("2.4 Realtime Broadcast (couche de communication)");

bodyText("Fichier : src/lib/realtime-host.ts");
bodyText("C'est le c\u0153ur de la communication en temps r\u00e9el. Le MJ ouvre un canal Supabase Realtime avec broadcast et presence.");

codeBlock([
  "currentChannel = supabase.channel(`room:${roomCode}`, {",
  "  config: {",
  "    broadcast: { self: true, ack: false },",
  "    presence: { key: 'host' }",
  "  },",
  "});",
]);

bodyText("\u00c9v\u00e9nements g\u00e9r\u00e9s par le canal :");

bullet("join_request : un joueur demande \u00e0 rejoindre");
bullet("get_state : un joueur demande l'\u00e9tat complet");
bullet("smartphone_action : action d'un joueur depuis son t\u00e9l\u00e9phone");
bullet("poll_response : r\u00e9ponse \u00e0 un sondage");
bullet("group_vote_response : vote de groupe");
bullet("soundboard_action / soundboard_stop : contr\u00f4le de la soundboard \u00e0 distance");
bullet("checklist_action : interaction avec la checklist");
bullet("action_trigger : d\u00e9clenchement d'action");

subsubsectionTitle("Diffusion de l'\u00e9tat (sync_state)");

bodyText("L'\u00e9tat complet est diffus\u00e9 avec un syst\u00e8me de retry pour assurer la livraison :");

codeBlock([
  "const doSend = (attempt) => {",
  "  currentChannel.send({",
  "    type: 'broadcast',",
  "    event: 'sync_state',",
  "    payload: buildFullStatePayload()",
  "  }).then(() => console.log(`OK (attempt ${attempt+1})`))",
  "    .catch(err => console.error(`Failed (attempt ${attack+1})`, err));",
  "};",
  "doSend(0);           // Envoi imm\u00e9diat",
  "setTimeout(() => doSend(1), 500);    // +500ms",
  "setTimeout(() => doSend(2), 1200);   // +1.2s",
  "setTimeout(() => doSend(3), 3000);   // +3s (s\u00e9curit\u00e9)",
]);

bodyText("Le broadcast est d\u00e9bounc\u00e9 \u00e0 150ms pour \u00e9viter les envois trop fr\u00e9quents, et la position (pan/zoom) est throttl\u00e9e \u00e0 500ms.");

infoBox("Note : Un syst\u00e8me de diff a \u00e9t\u00e9 impl\u00e9ment\u00e9 puis abandonn\u00e9 car le client smartphone n'\u00e9coute que l'\u00e9v\u00e9nement 'sync_state'. L'\u00e9tat complet est toujours envoy\u00e9.");

subsectionTitle("2.5 Stockage de fichiers (Storage)");

bodyText("Supabase Storage est utilis\u00e9 avec le bucket 'images-all' pour :");
bullet("Upload d'images de joueurs, r\u00f4les, tags, handouts");
bullet("G\u00e9n\u00e9ration de noms de fichier uniques (random + timestamp)");
bullet("Suppression de fichiers via leur URL publique");

codeBlock([
  "export const uploadFileToStorage = async (file: File) => {",
  "  const fileName = `${Math.random().toString(36).substring(2,15)}_${Date.now()}.${fileExt}`;",
  "  const { error: uploadError } = await supabase.storage",
  "    .from('images-all').upload(filePath, file, {",
  "      cacheControl: '3600', upsert: false",
  "    });",
  "  if (uploadError) return null;",
  "  const { data } = supabase.storage.from('images-all').getPublicUrl(filePath);",
  "  return data.publicUrl;",
  "};",
]);

subsectionTitle("2.6 Interface utilisateur de configuration");

bodyText("Fichier : src/components/layout/RightPanel.tsx");
bodyText("Un panneau de configuration permet au MJ de modifier les credentials \u00e0 l'ex\u00e9cution :");

bullet("Champs URL / Cl\u00e9 Anon avec r\u00e9f\u00e9rences vers les inputs");
bullet("Sauvegarde dans localStorage + rechargement de la page");
bullet("Option 'Utiliser .env.example' pour charger depuis le fichier serveur");
bullet("Bouton de validation avec appel \u00e0 window.location.reload()");

codeBlock([
  "const saveSupabaseConfig = () => {",
  "  localStorage.setItem('VTT_SUPABASE_URL', urlRef.current.value);",
  "  localStorage.setItem('VTT_SUPABASE_ANON_KEY', keyRef.current.value);",
  "  window.location.reload();",
  "};",
]);

// ==================== 3. QR CODE ====================
doc.addPage();
y = MARGIN;
drawHeader("G\u00e9n\u00e9ration QR Code");

sectionTitle("3. G\u00e9n\u00e9ration des QR Codes");

subsectionTitle("3.1 Biblioth\u00e8que utilis\u00e9e");

bodyText("La biblioth\u00e8que 'qrcode.react' (version ^4.2.0) est utilis\u00e9e pour g\u00e9n\u00e9rer les QR codes. Elle produit des SVG que l'utilisateur peut scanner avec n'importe quelle application de lecture de QR Code.");

codeBlock([
  "import { QRCodeSVG } from 'qrcode.react';",
  "",
  "<QRCodeSVG value={url} size={150} />",
]);

subsectionTitle("3.2 QR Codes disponibles");

bodyText("Fichier : src/components/layout/Canvas.tsx (lignes 855-965)");
bodyText("Un popup de connexion affiche deux QR Codes distincts :");

subsubsectionTitle("QR Code 1 : Connexion Joueurs (Smartphone)");
bullet("URL g\u00e9n\u00e9r\u00e9e : /join?sburl=...&sbkey=...&code=ROOMCODE");
bullet("Ic\u00f4ne : Smartphone (lucide-react)");
bullet("Couleur : bleue");
bullet("Permet aux joueurs de rejoindre la partie en scannant");
bullet("Taille du QR Code : 150x150px");

subsubsectionTitle("QR Code 2 : T\u00e9l\u00e9commande MJ (Soundboard)");
bullet("URL g\u00e9n\u00e9r\u00e9e : /remote?sburl=...&sbkey=...&code=ROOMCODE");
bullet("Ic\u00f4ne : Radio (lucide-react)");
bullet("Couleur : rose");
bullet("Permet de contr\u00f4ler la soundboard \u00e0 distance");
bullet("N\u00e9cessite le code de configuration (passcode)");

subsectionTitle("3.3 Construction des URLs");

bodyText("Les URLs sont construites dynamiquement en fonction des credentials disponibles :");

codeBlock([
  "let sbParams = '';",
  "const sbUrl = getEnvUrl();",
  "const sbKey = getEnvKey();",
  "",
  "// N'ajoute les params que si on utilise localStorage (pas Vite env vars)",
  "if (!import.meta.env.VITE_SUPABASE_URL && sbUrl && sbKey) {",
  "  sbParams = `?sburl=${encodeURIComponent(btoa(sbUrl))}`",
  "          + `&sbkey=${encodeURIComponent(btoa(sbKey))}`;",
  "}",
  "",
  "// Ajout du code de salle si activ\u00e9",
  "if (displaySettings.includeRoomCodeInLinks && roomCode) {",
  "  const codeParam = `code=${encodeURIComponent(roomCode)}`;",
  "  joinParams += (joinParams ? '&' : '?') + codeParam;",
  "}",
  "",
  "const joinHref = `${window.location.origin}/join${joinParams}`;",
  "const sbHref = `${window.location.origin}/remote${remoteParams}`;",
]);

bodyText("Les credentials sont encod\u00e9s en base64 (via btoa) pour \u00eatre pass\u00e9s en param\u00e8tres d'URL. Si l'application utilise les variables d'environnement Vite, les credentials ne sont pas inclus dans l'URL.");

// ==================== 4. FLUX DE CONNEXION ====================
doc.addPage();
y = MARGIN;
drawHeader("Flux de Connexion Smartphone");

sectionTitle("4. Flux de Connexion Smartphone");

subsectionTitle("4.1 \u00c9tape 1 : Cr\u00e9ation de la salle");

bodyText("Le MJ g\u00e9n\u00e8re un code de salle unique (6 lettres majuscules) et initialise le canal Realtime :");

codeBlock([
  "// G\u00e9n\u00e9ration du code (dans le store Zustand)",
  "generateRoomCode() -> 'ABCDEF'",
  "",
  "// Initialisation du canal host",
  "initHostRealtime('ABCDEF')",
  "// -> ouvre supabase.channel('room:ABCDEF')",
]);

subsectionTitle("4.2 \u00c9tape 2 : Partage via QR Code");

bodyText("Le MJ clique sur le bouton QR Code dans la barre d'outils du Canvas. Un popup s'affiche avec les deux QR codes.");

bodyText("Le joueur scanne le QR Code avec son smartphone. L'URL encod\u00e9e contient :");
bullet("Les credentials Supabase (URL + cl\u00e9 anon) en base64");
bullet("Le code de la salle");
bullet("Le chemin /join pour la page de connexion");

subsectionTitle("4.3 \u00c9tape 3 : Scan et rejoindre");

bodyText("Fichier : src/pages/PlayerJoin.tsx");
bodyText("Le joueur arrive sur la page de connexion avec le code de salle pr\u00e9-rempli :");

codeBlock([
  "// \u00c0 l'arriv\u00e9e : r\u00e9cup\u00e9ration du code depuis l'URL",
  "const urlCode = searchParams.get('code')?.toUpperCase() || '';",
  "sessionStorage.setItem('VTT_JOIN_ROOM_CODE', urlCode);",
  "",
  "// Le joueur entre son pseudo et clique sur 'Rejoindre'",
  "const handleJoin = (e) => {",
  "  e.preventDefault();",
  "  navigate(`/player/${roomCode}/${encodeURIComponent(playerName)}`);",
  "};",
]);

subsectionTitle("4.4 \u00c9tape 4 : Connexion Realtime");

bodyText("Fichier : src/pages/PlayerView.tsx");
bodyText("Le composant PlayerView se monte avec le roomId et le playerName dans l'URL. Il cr\u00e9e son propre canal Realtime :");

codeBlock([
  "const channel = supabase.channel(`room:${roomId}`, {",
  "  config: { broadcast: { ack: false }, presence: { key: playerName } },",
  "});",
  "",
  "channel",
  "  .on('broadcast', { event: 'feedback_popup' }, ...)",
  "  .on('broadcast', { event: 'sync_state' }, async ({ payload }) => {",
  "    // Traitement de l'\u00e9tat re\u00e7u",
  "    setRoomPlayers(data.players || []);",
  "    setAllRoles(data.roles || []);",
  "    // ...",
  "  })",
  "  .subscribe();",
]);

bodyText("Le joueur envoie deux messages imm\u00e9diatement apr\u00e8s connexion :");
bullet("join_request { playerName } -> annonce sa pr\u00e9sence");
bullet("get_state -> demande l'\u00e9tat actuel du jeu");

bodyText("Un m\u00e9canisme de retry toutes les 2 secondes relance la demande si non reconnu.");

subsectionTitle("4.5 \u00c9tape 5 : Traitement de la demande");

bodyText("Fichier : src/lib/realtime-host.ts");
bodyText("Le MJ re\u00e7oit la demande et r\u00e9agit selon le mode de la salle :");

codeBlock([
  "currentChannel.on('broadcast', { event: 'join_request' }, ({ payload }) => {",
  "  const existingPlayer = getPlayerByName(players, payload.playerName);",
  "",
  "  if (!existingPlayer) {",
  "    if (state.isRoomPublic) {",
  "      // Mode public : ajout automatique du joueur",
  "      state.addPlayer({ name, color, x, y, ... });",
  "      sendFullStateWithRetry();",
  "    } else {",
  "      // Mode priv\u00e9 : mise en file d'attente",
  "      state.addJoinRequest(playerName);",
  "      sendFullStateWithRetry();",
  "    }",
  "  } else {",
  "    // Joueur existant : renvoi de l'\u00e9tat",
  "    sendFullStateWithRetry();",
  "  }",
  "});",
]);

bodyText("Mode public : le joueur est automatiquement ajout\u00e9 au plateau de jeu.");
bodyText("Mode priv\u00e9 : le MJ doit approuver chaque demande via une liste d'attente.");

// ==================== 4.6 INTERFACE SMARTPHONE ====================
doc.addPage();
y = MARGIN;
drawHeader("Interface Smartphone");

subsectionTitle("4.6 \u00c9tape 6 : Interface Smartphone");

bodyText("Une fois connect\u00e9, le joueur voit l'interface smartphone avec les onglets configurables par le MJ :");

subsubsectionTitle("Onglets disponibles :");
bullet("Game (jeu) : tags interactifs, actions, chronom\u00e8tre");
bullet("Players : liste des joueurs avec leurs infos");
bullet("Room : fiche de la salle (background, description)");
bullet("Wiki : documentation de la partie");
bullet("Handouts : documents partag\u00e9s par le MJ");
bullet("Logs : historique des actions");

subsubsectionTitle("Fonctionnalit\u00e9s de l'interface :");
bullet("Affichage en temps r\u00e9el des tags avec showOnSmartphone: true");
bullet("S\u00e9lecteur de joueurs (simple ou multiple) avec filtres (vivant/mort/r\u00f4le/\u00e9quipe/soi-m\u00eame)");
bullet("Boutons d'action avec feedback visuel");
bullet("Popup de r\u00e9v\u00e9lation de r\u00f4le avec animation");
bullet("Notifications de jets de d\u00e9s");
bullet("Effets de particules (confettis, sang, magie, feu, poison)");
bullet("Compteur de temps partag\u00e9");
bullet("Notes priv\u00e9es sur les joueurs (localStorage)");
bullet("Vibration du t\u00e9l\u00e9phone (via l'API Vibration)");
bullet("Sondages et votes de groupe");

bodyText("Le MJ peut contr\u00f4ler \u00e0 distance l'interface du joueur :");
bullet("Verrouiller l'\u00e9cran (isSmartphoneLocked)");
bullet("Forcer un onglet sp\u00e9cifique (forceSmartphoneTab)");
bullet("D\u00e9clencher des popups d'information");
bullet("Faire vibrer le t\u00e9l\u00e9phone");

// ==================== 5. INTERACTIONS SMARTPHONE ====================
subsectionTitle("5.1 Configuration des tags smartphone");

bodyText("Fichier : src/components/tags/TagSmartphoneTab.tsx");
bodyText("Le MJ configure les interactions smartphone via un onglet d\u00e9di\u00e9 dans l'\u00e9dition des tags :");

codeBlock([
  "const RETURN_INFO_OPTIONS = [",
  "  { key: 'none', label: 'Aucun' },",
  "  { key: 'real_role', label: 'R\u00f4le r\u00e9el' },",
  "  { key: 'real_team', label: '\u00c9quipe r\u00e9elle' },",
  "  { key: 'seen_role', label: 'Vu comme r\u00f4le' },",
  "  { key: 'seen_team', label: 'Vu dans l\'\u00e9quipe' },",
  "];",
]);

bodyText("Options de configuration disponibles :");
bullet("Mode de s\u00e9lection : aucun / simple / multiple");
bullet("Filtres de s\u00e9lection : vivant, mort, r\u00f4le, \u00e9quipe, soi-m\u00eame, pas soi-m\u00eame");
bullet("Texte du bouton et message de feedback");
bullet("V\u00e9rification de r\u00f4le avec comptage ou r\u00e9ponse vague");
bullet("Retour d'information (r\u00f4le r\u00e9el/vu, \u00e9quipe r\u00e9elle/vue)");
bullet("Fusion de tag (auto-assigner un tag aux joueurs s\u00e9lectionn\u00e9s)");
bullet("Auto-suppression du tag apr\u00e8s utilisation");
bullet("D\u00e9clenchement d'action du moteur de jeu");
bullet("Association \u00e0 un handout");

subsectionTitle("5.2 S\u00e9lection de joueurs");

bodyText("Le joueur peut s\u00e9lectionner des cibles sur son smartphone :");

codeBlock([
  "const togglePlayerSelection = (tagInstanceId, targetPlayerId) => {",
  "  setSelectedPlayersByTag(prev => {",
  "    const current = prev[tagInstanceId] || [];",
  "    if (current.includes(targetPlayerId)) {",
  "      return { ...prev, [tagInstanceId]: current.filter(id => id !== targetPlayerId) };",
  "    } else {",
  "      return { ...prev, [tagInstanceId]: [...current, targetPlayerId] };",
  "    }",
  "  });",
  "};",
]);

subsectionTitle("5.3 Actions d\u00e9clench\u00e9es");

bodyText("Fichier : src/lib/realtime-host.ts");
bodyText("Le MJ traite les actions smartphone et peut effectuer :");

bullet("Affichage de pastilles de s\u00e9lection sur les joueurs cibl\u00e9s");
bullet("R\u00e9v\u00e9lation d'info (r\u00f4le/\u00e9quipe) via feedback_popup");
bullet("V\u00e9rification de r\u00f4le avec r\u00e9ponse personnalis\u00e9e");
bullet("Fusion de tags sur les joueurs s\u00e9lectionn\u00e9s ou sur le joueur source");
bullet("D\u00e9clenchement d'actions du moteur de jeu avec contexte ($Joueur, $Cible)");
bullet("Suppression automatique du tag de l'interface smartphone");

codeBlock([
  "// Exemple : traitement du retour d'information",
  "if (payload.smartphoneReturnInfo === 'real_role') {",
  "  const role = state.roles.find(r => r.id === target.roleId);",
  "  val = role?.name || 'Sans R\u00f4le';",
  "}",
  "",
  "// Envoi du message au joueur",
  "currentChannel.send({",
  "  type: 'broadcast',  event: 'feedback_popup',",
  "  payload: { playerId: payload.playerId, message: infoMsg }",
  "});",
]);

// ==================== 6. SECURITE ====================
doc.addPage();
y = MARGIN;
drawHeader("S\u00e9curit\u00e9");

sectionTitle("6. S\u00e9curit\u00e9 et Gestion des Erreurs");

subsectionTitle("6.1 S\u00e9curit\u00e9");
bullet("Les credentials Supabase sont stock\u00e9s c\u00f4t\u00e9 client (localStorage/sessionStorage)");
bullet("Les cl\u00e9s sont des cl\u00e9s anon (publiques, s\u00e9curis\u00e9es par les RLS policies c\u00f4t\u00e9 Supabase)");
bullet("Le passcode de la soundboard distante est v\u00e9rifi\u00e9 c\u00f4t\u00e9 MJ avant ex\u00e9cution");
bullet("Les credentials sont encod\u00e9s en base64 dans les URLs (non s\u00e9curis\u00e9 mais obfusqu\u00e9)");
bullet("Aucune authentification utilisateur n'est requise (pas de compte)");

subsectionTitle("6.2 Gestion des erreurs");
bullet("Client Supabase null si credentials invalides -> gra\u00adceful degradation");
bullet("Retry sur les broadcasts (0, 500ms, 1.2s, 3s) pour fiabilit\u00e9");
bullet("Timeout de connexion : retry toutes les 2s pour les joueurs");
bullet("Protection contre les payloads > 200KB (avertissement console)");
bullet("Strip des images data: URI trop grandes dans les broadcasts");
bullet("Pr\u00e9servation du param\u00e8tre ?code= lors du nettoyage des credentials d'URL");

subsectionTitle("6.3 Limites et consid\u00e9rations");
bullet("Pas de serveur relais : le navigateur du MJ est le point central");
bullet("Si le MJ ferme son navigateur, tous les joueurs sont d\u00e9connect\u00e9s");
bullet("Les images volumineuses sont retir\u00e9es du broadcast pour \u00e9viter les probl\u00e8mes de taille");
bullet("Le syst\u00e8me de diff a \u00e9t\u00e9 abandonn\u00e9 : l'\u00e9tat complet est toujours envoy\u00e9");

// ==================== 7. DEPENDANCES ====================
sectionTitle("7. D\u00e9pendances et Configuration");

subsectionTitle("Package.json");
codeBlock([
  "D\u00e9pendances Supabase :",
  "  \"@supabase/supabase-js\": \"^2.99.3\"",
  "",
  "D\u00e9pendances QR Code :",
  "  \"qrcode.react\": \"^4.2.0\"",
  "",
  "D\u00e9pendances associ\u00e9es :",
  "  \"zustand\": \"^5.0.11\"      (gestion d'\u00e9tat)",
  "  \"react-router-dom\": \"^7.13.1\" (routage)",
  "  \"lucide-react\": \"^0.577.0\"   (ic\u00f4nes)",
  "  \"uuid\": \"^13.0.0\"        (g\u00e9n\u00e9ration d'IDs)",
]);

subsectionTitle("Fichier .env");
codeBlock([
  "VITE_SUPABASE_URL=https://qxtnkhwjvhorvadjwmfh.supabase.co",
  "VITE_SUPABASE_ANON_KEY=sb_publishable_lyk52r8Cy5Y_F8K14OrCRw_51yurkaD",
]);

subsectionTitle("Architecture des fichiers cl\u00e9s");
codeBlock([
  "src/",
  "  lib/",
  "    supabase.ts         # Client Supabase + Storage",
  "    realtime-host.ts    # Canal Realtime c\u00f4t\u00e9 MJ",
  "  pages/",
  "    PlayerJoin.tsx      # Page de connexion smartphone",
  "    PlayerView.tsx      # Interface smartphone compl\u00e8te",
  "  components/",
  "    layout/",
  "      Canvas.tsx        # QR Code popup (ligne 855)",
  "      RightPanel.tsx    # Configuration Supabase",
  "    tags/",
  "      TagSmartphoneTab.tsx  # Config des tags smartphone",
  "  main.tsx              # Bootstrap credentials",
  "  store/",
  "    index.ts            # Zustand store (\u00e9tat global)",
]);

// ==================== FOOTER ====================
checkPage(10);
doc.setDrawColor(...LINE);
doc.setLineWidth(0.3);
doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
y += 6;
doc.setFontSize(7);
doc.setTextColor(...LIGHT);
doc.setFont("helvetica", "italic");
doc.text("Document confidentiel - VTTApp - Analyse technique de l'architecture de connexion", MARGIN, y);
doc.text(`Page ${doc.internal.getNumberOfPages()}`, PAGE_WIDTH - MARGIN - 10, y);

// Save
const outputPath = "scratch/analyse-supabase-qr.pdf";
doc.save(outputPath);
console.log(`PDF g\u00e9n\u00e9r\u00e9 avec succ\u00e8s : ${outputPath}`);
console.log(`Nombre de pages : ${doc.internal.getNumberOfPages()}`);
