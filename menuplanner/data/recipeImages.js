/** Plate photos for template cards — color spark, not literal dish photos. */

const TEMPLATE_IMAGES = {
  'chicken-rice-broccoli-soy': 'https://images.unsplash.com/photo-1603133872877-684f208fb84b?w=480&h=320&fit=crop',
  'chicken-rice-broccoli-bbq': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=480&h=320&fit=crop',
  'steak-tortilla-peppers-fajita': 'https://images.unsplash.com/photo-1599974579688-e97571258369?w=480&h=320&fit=crop',
  'chicken-beans-rice': 'https://images.unsplash.com/photo-1603133872877-684f208fb84b?w=480&h=320&fit=crop',
  'steak-tortilla-texas': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=480&h=320&fit=crop',
};

const PLATE_FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&fit=crop';

export function recipeImageUrl(templateId) {
  return TEMPLATE_IMAGES[templateId] || PLATE_FALLBACK;
}
