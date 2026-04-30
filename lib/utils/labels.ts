import type {
  Complaint,
  Deal,
  Listing,
  ListingCondition,
  ModerationCase,
  Notification,
  Offer
} from "@/lib/domain";

export const listingStatusLabel: Record<Listing["status"], string> = {
  draft: "Черновик",
  pending: "На модерации",
  published: "Опубликовано",
  needs_changes: "Нужны правки",
  rejected: "Отклонено",
  reserved: "В резерве",
  sold: "Продано"
};

export const conditionLabel: Record<ListingCondition, string> = {
  new: "Новое",
  like_new: "Как новое",
  good: "Хорошее",
  fair: "Заметный износ",
  for_parts: "На запчасти"
};

export const offerStatusLabel: Record<Offer["status"], string> = {
  draft: "Черновик",
  sent: "Ожидает ответа",
  accepted: "Принят",
  declined: "Отклонен",
  countered: "Контр-оффер",
  expired: "Истек"
};

export const dealStatusLabel: Record<Deal["status"], string> = {
  created: "Создана",
  payment_pending: "Ожидает оплаты",
  reserved: "Товар в резерве",
  handoff_planned: "Встреча запланирована",
  in_transit: "В доставке",
  inspection: "Проверка",
  completed: "Завершена",
  cancelled: "Отменена"
};

export const dealTypeLabel: Record<Deal["type"], string> = {
  meetup: "Личная встреча",
  courier: "Доставка",
  pine_check: "Проверка товара"
};

export const complaintStatusLabel: Record<Complaint["status"], string> = {
  submitted: "Отправлена",
  reviewing: "На проверке",
  resolved: "Решена",
  dismissed: "Отклонена"
};

export const complaintReasonLabel: Record<Complaint["reason"], string> = {
  spam: "Спам",
  fraud: "Мошенничество",
  prohibited_item: "Запрещенный товар",
  abuse: "Оскорбления",
  other: "Другое"
};

export const complaintTargetTypeLabel: Record<Complaint["targetType"], string> = {
  listing: "Объявление",
  user: "Пользователь",
  conversation: "Диалог"
};

export const moderationStatusLabel: Record<ModerationCase["status"], string> = {
  open: "Открыта",
  approved: "Одобрено",
  needs_changes: "Нужны правки",
  rejected: "Отклонено"
};

export const notificationTypeLabel: Record<Notification["type"], string> = {
  message: "Сообщение",
  offer_response: "Оффер",
  moderation: "Модерация",
  favorite_price_changed: "Цена изменилась",
  favorite_sold: "Товар продан",
  deal_status: "Сделка"
};
