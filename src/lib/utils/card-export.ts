import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Exporte un élément DOM sous forme d'image PNG ou JPEG et déclenche le téléchargement.
 */
export const exportCardAsImage = async (
  element: HTMLElement,
  fileName: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<string | null> => {
  try {
    const options = {
      quality: 0.95,
      pixelRatio: 2, // Augmente la résolution pour l'impression
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      },
    };

    let dataUrl: string;
    if (format === 'jpeg') {
      dataUrl = await toJpeg(element, options);
    } else {
      dataUrl = await toPng(element, options);
    }

    // Déclencher le téléchargement dans le navigateur
    const link = document.createElement('a');
    link.download = `${fileName.replace(/\s+/g, '_')}.${format}`;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error("Erreur lors de l'exportation de l'image :", error);
    return null;
  }
};

/**
 * Capture un élément DOM de carte et retourne sa représentation base64
 */
export const captureCardBase64 = async (element: HTMLElement): Promise<string | null> => {
  try {
    return await toPng(element, { quality: 0.95, pixelRatio: 2 });
  } catch (error) {
    console.error("Erreur lors de la capture de la carte :", error);
    return null;
  }
};

/**
 * Génère un PDF prêt pour l'impression A4 contenant une grille de cartes (3x3 par page).
 * Chaque carte respecte idéalement le format Standard (63.5 mm x 88.9 mm).
 */
export const exportCardsToPdfGrid = async (
  cardBase64Images: string[],
  pdfName: string = 'planche_roles.pdf'
): Promise<void> => {
  try {
    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cardWidth = 63; // mm
    const cardHeight = 88; // mm
    const marginX = 7; // mm
    const marginY = 15; // mm
    const gapX = 3; // mm
    const gapY = 3; // mm

    let cardsPerPage = 9; // Grille 3x3

    for (let i = 0; i < cardBase64Images.length; i++) {
      if (i > 0 && i % cardsPerPage === 0) {
        pdf.addPage();
      }

      const indexOnPage = i % cardsPerPage;
      const col = indexOnPage % 3;
      const row = Math.floor(indexOnPage / 3);

      const x = marginX + col * (cardWidth + gapX);
      const y = marginY + row * (cardHeight + gapY);

      // Dessiner des traits de coupe ou un léger contour de carte pour aider à la découpe
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.rect(x - 0.2, y - 0.2, cardWidth + 0.4, cardHeight + 0.4);

      // Ajouter l'image de la carte
      pdf.addImage(cardBase64Images[i], 'PNG', x, y, cardWidth, cardHeight);
    }

    pdf.save(pdfName);
  } catch (error) {
    console.error("Erreur lors de l'exportation du PDF :", error);
  }
};
