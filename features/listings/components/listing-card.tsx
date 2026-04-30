import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ImageOff, MapPin } from "lucide-react";
import type { Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoney, formatRelativeDate } from "@/lib/utils/format";
import { listingStatusLabel } from "@/lib/utils/labels";
import { STATUS_TONE } from "@/lib/theme";

type ListingCardProps = {
  listing: Listing;
  onFavoriteClick?: (listingId: string) => void;
  onQuickPreview?: (listing: Listing) => void;
};

export function ListingCard({ listing, onFavoriteClick, onQuickPreview }: ListingCardProps) {
  const primaryImage = listing.images[0];

  return (
    <Card className="group overflow-hidden border-white/80 bg-white/92 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/30 to-background text-center text-muted-foreground">
              <div className="grid gap-2">
                <ImageOff className="mx-auto h-8 w-8" />
                <span className="text-sm font-medium">Фото появится после загрузки</span>
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Link href={`/listings/${listing.id}`} className="line-clamp-1 font-semibold hover:text-primary">
              {listing.title}
            </Link>
            <p className="mt-1 text-lg font-bold">{formatMoney(listing.price)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Добавить в избранное"
            onClick={() => onFavoriteClick?.(listing.id)}
          >
            <Heart className={listing.isFavorite ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{listing.location.label}</span>
          <span aria-hidden="true">•</span>
          <span>{formatRelativeDate(listing.createdAt)}</span>
        </div>
        {onQuickPreview ? (
          <Button className="mt-4 w-full" variant="outline" onClick={() => onQuickPreview(listing)}>
            <Eye className="h-4 w-4" />
            Быстрый просмотр
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
