import { z } from "zod";

export const listingDraftSchema = z.object({
  categoryId: z.string().min(1, "Выберите категорию"),
  title: z.string().min(8, "Название должно быть понятнее").max(90),
  description: z.string().min(30, "Добавьте больше деталей").max(2000),
  price: z.coerce.number().positive("Укажите цену"),
  condition: z.enum(["new", "like_new", "good", "fair", "for_parts"]),
  locationLabel: z.string().min(2, "Укажите город"),
  imageUrls: z.array(z.string()).min(1, "Добавьте хотя бы одну фотографию.")
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;
