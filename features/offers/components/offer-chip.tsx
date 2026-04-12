import type { Offer } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/format";

const offerLabel: Record<Offer["status"], string> = {
  draft: "Черновик",
  sent: "Ожидает ответа",
  accepted: "Принят",
  declined: "Отклонен",
  countered: "Контр-оффер",
  expired: "Истек"
};

export function OfferChip({ offer }: { offer: Offer }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2">
      <span className="text-sm font-semibold">{formatMoney(offer.amount)}</span>
      <Badge variant={offer.status === "accepted" ? "success" : offer.status === "declined" ? "danger" : "accent"}>
        {offerLabel[offer.status]}
      </Badge>
    </div>
  );
}
