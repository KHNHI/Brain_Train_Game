export interface CatalogGame {
  id: string;
  title: string;
  description: string;
  category: string;
  available: boolean;
  instructions: readonly string[];
}
