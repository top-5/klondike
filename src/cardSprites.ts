/**
 * Utility to load deck.png spritesheet and extract individual card images
 * Spritesheet layout: 4 rows (suits) × 13 columns (ranks A-K)
 * Row 0: Clubs, Row 1: Hearts, Row 2: Spades, Row 3: Diamonds
 * Columns: 0=A, 1=2, 2=3, ..., 9=10, 10=J, 11=Q, 12=K
 */

export interface CardImageMap {
  get(suit: string, rank: string): string | undefined;
  cardBack: string;
  isLoaded: boolean;
}

const SPRITESHEET_PATH = '/deck.png';
const CARD_BACK_PATH = '/back.jpg';
const ROWS = 4;
const COLS = 13;

// Map suit names to row indices
const SUIT_TO_ROW: Record<string, number> = {
  'clubs': 0,
  'hearts': 1,
  'spades': 2,
  'diamonds': 3,
};

// Map rank names to column indices
const RANK_TO_COL: Record<string, number> = {
  'A': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
  '10': 9,
  'J': 10,
  'Q': 11,
  'K': 12,
};

let cachedCardImages: CardImageMap | null = null;

/**
 * Load the spritesheet and extract individual card images
 * Returns a Promise that resolves to a CardImageMap
 */
export async function loadCardSprites(): Promise<CardImageMap> {
  if (cachedCardImages?.isLoaded) {
    return cachedCardImages;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const backImg = new Image();
    let spritesheetLoaded = false;
    let cardBackLoaded = false;
    let cardBackDataUrl = '';
    
    const checkComplete = () => {
      if (spritesheetLoaded && cardBackLoaded) {
        cachedCardImages = {
          get: (suit: string, rank: string) => imageMap.get(`${suit}-${rank}`),
          cardBack: cardBackDataUrl,
          isLoaded: true,
        };
        resolve(cachedCardImages);
      }
    };
    
    const imageMap = new Map<string, string>();
    
    // Load card back image
    backImg.onload = () => {
      try {
        // Get the frame dimensions from the spritesheet (assuming it loads first or we wait)
        // We'll scale the back image to match card dimensions
        const canvas = document.createElement('canvas');
        canvas.width = backImg.width;
        canvas.height = backImg.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context for card back'));
          return;
        }
        
        ctx.drawImage(backImg, 0, 0);
        cardBackDataUrl = canvas.toDataURL('image/jpeg');
        cardBackLoaded = true;
        checkComplete();
      } catch (error) {
        reject(error);
      }
    };
    
    backImg.onerror = () => {
      reject(new Error(`Failed to load card back: ${CARD_BACK_PATH}`));
    };
    
    // Load spritesheet
    img.onload = () => {
      try {
        const frameWidth = img.width / COLS;
        const frameHeight = img.height / ROWS;
        
        // Create hidden canvas for extraction
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Extract each card sprite
        for (const [suitName, row] of Object.entries(SUIT_TO_ROW)) {
          for (const [rankName, col] of Object.entries(RANK_TO_COL)) {
            // Clear canvas
            ctx.clearRect(0, 0, frameWidth, frameHeight);
            
            // Draw the specific card frame
            ctx.drawImage(
              img,
              col * frameWidth,  // source x
              row * frameHeight, // source y
              frameWidth,        // source width
              frameHeight,       // source height
              0,                 // dest x
              0,                 // dest y
              frameWidth,        // dest width
              frameHeight        // dest height
            );
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            imageMap.set(`${suitName}-${rankName}`, dataUrl);
          }
        }
        
        spritesheetLoaded = true;
        checkComplete();
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load spritesheet: ${SPRITESHEET_PATH}`));
    };
    
    // Start loading both images
    img.src = SPRITESHEET_PATH;
    backImg.src = CARD_BACK_PATH;
  });
}

/**
 * Get the cached card images (returns null if not loaded yet)
 */
export function getCardImages(): CardImageMap | null {
  return cachedCardImages;
}
