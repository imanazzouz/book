import {
  Apple,
  Bean,
  Carrot,
  Droplets,
  Hexagon,
  Sprout,
  TreePalm,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryIcon } from '@/config/catalog';

const ICONS: Record<CategoryIcon, LucideIcon> = {
  carrot: Carrot,
  apple: Apple,
  palm: TreePalm,
  wheat: Wheat,
  droplet: Droplets,
  bean: Bean,
  sprout: Sprout,
  hexagon: Hexagon,
};

export function CategoryIcon({ icon, className }: { icon: CategoryIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden strokeWidth={1.6} />;
}
