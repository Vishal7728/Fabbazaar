import { Bath, BedDouble, Cloud, Flower2, LayoutGrid, PanelsTopLeft, Sofa, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const categories: Array<{ name: string; icon: LucideIcon }> = [
  { name: 'Bedsheet', icon: BedDouble },
  { name: 'Comforter', icon: Cloud },
  { name: 'Bedcover', icon: PanelsTopLeft },
  { name: 'Dohar Sets', icon: Flower2 },
  { name: 'Door Mats', icon: LayoutGrid },
  { name: 'Diwan Sets', icon: Sofa },
  { name: 'Towels', icon: Bath },
  { name: 'Home Furnishings', icon: Sparkles }
];
