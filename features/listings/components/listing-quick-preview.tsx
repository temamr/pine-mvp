"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, MapPin } from "lucide-react";
import type { Listing } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils/format";
import { conditionLabel, listingStatusLabel } from "@/lib/utils/labels";
import { STATUS_TONE } from "@/lib/theme";

type ListingQuickPreviewProps = {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFavorite: (listingId: string) => void;
  onStartChat: (listingId: string) => void;
};

export function ListingQuickPreview({
  listing,
  open,
  onOpenChange,
  onFavorite,
  onStartChat
}: ListingQuickPreviewProps) {
  const image = listing?.images[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {listing ? (
          <>
            <DialogHeader>
              <DialogTitle>{listing.title}</DialogTitle>
              <DialogDescription>{listing.location.label}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {image ? (
                  <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="320px" />
                ) : null}
              </div>
              <div className="grid content-start gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={STATUS_TONE[listing.status]}>{listingStatusLabel[listing.status]}</Badge>
                  <Badge variant="outline">{conditionLabel[listing.condition]}</Badge>
                </div>
                <p className="text-2xl font-bold">{formatMoney(listing.price)}</p>
                <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">{listing.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {listing.location.label}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onFavorite(listing.id)}>
                <Heart className={listing.isFavorite ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
                В избранное
              </Button>
              <Button variant="secondary" onClick={() => onStartChat(listing.id)}>
                <MessageCircle className="h-4 w-4" />
                Написать
              </Button>
              <Button asChild>
                <Link href={`/listings/${listing.id}`}>Открыть карточку</Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
