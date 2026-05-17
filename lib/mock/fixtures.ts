import type {
  Category,
  Conversation,
  Deal,
  Favorite,
  Listing,
  Message,
  Complaint,
  ModerationCase,
  Notification,
  Offer,
  Review,
  User
} from "@/lib/domain";

const now = "2026-04-12T08:30:00.000Z";

export const mockUsers: User[] = [
  {
    id: "user_seller_mira",
    displayName: "Mira Chen",
    email: "mira@pine.local",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    bio: "Продаю электронику и комплектующие после аккуратного использования.",
    role: "seller",
    verificationStatus: "trusted",
    rating: 4.9,
    reviewsCount: 42,
    completedDealsCount: 38,
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "Hayes Valley, San Francisco"
    },
    createdAt: "2024-05-06T10:00:00.000Z"
  },
  {
    id: "user_buyer_eli",
    displayName: "Eli Parker",
    email: "eli@pine.local",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    role: "buyer",
    verificationStatus: "phone",
    rating: 4.7,
    reviewsCount: 15,
    completedDealsCount: 11,
    createdAt: "2025-01-18T12:00:00.000Z"
  },
  {
    id: "user_seller_noah",
    displayName: "Noah Rivera",
    email: "noah@pine.local",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
    role: "seller",
    verificationStatus: "document",
    rating: 4.8,
    reviewsCount: 28,
    completedDealsCount: 25,
    location: {
      city: "Oakland",
      region: "CA",
      country: "US",
      label: "Downtown Oakland"
    },
    createdAt: "2023-11-08T09:45:00.000Z"
  }
];

export const mockCategories: Category[] = [
  { id: "cat_smartphones", name: "Смартфоны", slug: "smartphones", icon: "Smartphone" },
  { id: "cat_laptops", name: "Ноутбуки", slug: "laptops", icon: "Laptop" },
  { id: "cat_tablets", name: "Планшеты", slug: "tablets", icon: "Tablet" },
  { id: "cat_desktops", name: "Компьютеры", slug: "desktops", icon: "Monitor" },
  { id: "cat_components", name: "Комплектующие ПК", slug: "pc-components", icon: "Cpu" },
  { id: "cat_monitors", name: "Мониторы", slug: "monitors", icon: "MonitorSpeaker" },
  { id: "cat_gaming", name: "Игровые консоли", slug: "gaming-consoles", icon: "Gamepad2" },
  { id: "cat_audio", name: "Аудио", slug: "audio", icon: "Headphones" },
  { id: "cat_cameras", name: "Камеры", slug: "cameras", icon: "Camera" },
  { id: "cat_wearables", name: "Носимые устройства", slug: "wearables", icon: "Watch" },
  { id: "cat_networking", name: "Сеть и роутеры", slug: "networking", icon: "Router" },
  { id: "cat_accessories", name: "Кабели и аксессуары", slug: "accessories", icon: "Cable" }
];

export const mockListings: Listing[] = [
  {
    id: "listing_fuji_x100v",
    sellerId: "user_seller_mira",
    categoryId: "cat_cameras",
    title: "Fujifilm X100V Silver kit",
    description:
      "Компактная камера в отличном состоянии. В комплекте ремень, батарея, зарядка и защитный фильтр. Использовалась бережно для travel-фото.",
    price: { amount: 1180, currency: "AED" },
    originalPrice: { amount: 1240, currency: "AED" },
    condition: "like_new",
    status: "published",
    images: [
      {
        id: "img_fuji_1",
        url: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=900&q=80",
        alt: "Silver camera on table",
        position: 0
      },
      {
        id: "img_fuji_2",
        url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
        alt: "Camera closeup",
        position: 1
      }
    ],
    attributes: [
      { label: "Матрица", value: "26 MP" },
      { label: "Пробег", value: "8 200 кадров" },
      { label: "Комплект", value: "Коробка, ремень, зарядка" }
    ],
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "Hayes Valley"
    },
    isFavorite: true,
    viewsCount: 318,
    createdAt: "2026-04-09T16:00:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_macbook_air_m2",
    sellerId: "user_seller_noah",
    categoryId: "cat_laptops",
    title: "MacBook Air 13 M2 16/512 Midnight",
    description:
      "Легкий MacBook Air на M2 в конфигурации 16 GB RAM и 512 GB SSD. Батарея держит полный рабочий день, корпус без вмятин, клавиатура и экран в отличном состоянии.",
    price: { amount: 980, currency: "AED" },
    condition: "good",
    status: "reserved",
    images: [
      {
        id: "img_macbook_1",
        url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
        alt: "MacBook on desk",
        position: 0
      }
    ],
    attributes: [
      { label: "Процессор", value: "Apple M2" },
      { label: "Память", value: "16 GB RAM / 512 GB SSD" },
      { label: "Батарея", value: "91% health" }
    ],
    location: {
      city: "Oakland",
      region: "CA",
      country: "US",
      label: "Downtown Oakland"
    },
    viewsCount: 144,
    createdAt: "2026-04-08T11:35:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_rtx_4070_super",
    sellerId: "user_seller_mira",
    categoryId: "cat_components",
    title: "NVIDIA GeForce RTX 4070 Super 12 GB",
    description:
      "Видеокарта в отличном состоянии, использовалась только для игр и 3D-рендера без майнинга. Температуры стабильные, коробка и чек на месте.",
    price: { amount: 610, currency: "AED" },
    condition: "good",
    status: "published",
    images: [
      {
        id: "img_gpu_1",
        url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80",
        alt: "Graphics card",
        position: 0
      }
    ],
    attributes: [
      { label: "Память", value: "12 GB GDDR6X" },
      { label: "Разъемы", value: "HDMI, 3x DisplayPort" },
      { label: "История", value: "Без майнинга" }
    ],
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "Mission District"
    },
    viewsCount: 221,
    createdAt: "2026-04-10T09:10:00.000Z",
    updatedAt: "2026-04-11T18:00:00.000Z"
  },
  {
    id: "listing_iphone_15_pro",
    sellerId: "user_seller_noah",
    categoryId: "cat_smartphones",
    title: "iPhone 15 Pro 256 GB Natural Titanium",
    description:
      "Разблокированный iPhone 15 Pro с 256 GB памяти. Экран без царапин, Face ID работает, батарея 96%. В комплекте USB-C кабель и MagSafe-чехол.",
    price: { amount: 890, currency: "AED" },
    originalPrice: { amount: 940, currency: "AED" },
    condition: "like_new",
    status: "published",
    images: [
      {
        id: "img_iphone_1",
        url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80",
        alt: "iPhone on table",
        position: 0
      }
    ],
    attributes: [
      { label: "Память", value: "256 GB" },
      { label: "Батарея", value: "96%" },
      { label: "Сеть", value: "Unlocked" }
    ],
    location: {
      city: "Oakland",
      region: "CA",
      country: "US",
      label: "Lake Merritt"
    },
    viewsCount: 402,
    createdAt: "2026-04-11T10:30:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_ipad_pro_m4",
    sellerId: "user_seller_mira",
    categoryId: "cat_tablets",
    title: "iPad Pro 11 M4 Wi-Fi 256 GB",
    description:
      "Тонкий iPad Pro 11 на M4, Wi-Fi версия. Использовался для заметок и дизайна, экран OLED без дефектов. В комплекте Apple Pencil Pro.",
    price: { amount: 840, currency: "AED" },
    condition: "like_new",
    status: "published",
    images: [
      {
        id: "img_ipad_1",
        url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80",
        alt: "Tablet on desk",
        position: 0
      }
    ],
    attributes: [
      { label: "Чип", value: "Apple M4" },
      { label: "Память", value: "256 GB" },
      { label: "Комплект", value: "Apple Pencil Pro" }
    ],
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "SoMa"
    },
    viewsCount: 189,
    createdAt: "2026-04-10T15:45:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_sony_wh1000xm5",
    sellerId: "user_seller_noah",
    categoryId: "cat_audio",
    title: "Sony WH-1000XM5 Black",
    description:
      "Беспроводные наушники с активным шумоподавлением. Амбушюры чистые, звук без хрипов, заряд держат отлично. Есть кейс и USB-C кабель.",
    price: { amount: 250, currency: "AED" },
    condition: "good",
    status: "published",
    images: [
      {
        id: "img_sony_1",
        url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=80",
        alt: "Wireless headphones",
        position: 0
      }
    ],
    attributes: [
      { label: "ANC", value: "Да" },
      { label: "Подключение", value: "Bluetooth / USB-C" },
      { label: "Комплект", value: "Кейс, кабель" }
    ],
    location: {
      city: "Berkeley",
      region: "CA",
      country: "US",
      label: "Downtown Berkeley"
    },
    viewsCount: 128,
    createdAt: "2026-04-09T13:25:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_lg_ultragear_27",
    sellerId: "user_seller_mira",
    categoryId: "cat_monitors",
    title: "LG UltraGear 27 QHD 144Hz",
    description:
      "Игровой 27-дюймовый QHD монитор с частотой 144Hz. Матрица без битых пикселей, подставка и DisplayPort кабель в комплекте.",
    price: { amount: 230, currency: "AED" },
    condition: "good",
    status: "published",
    images: [
      {
        id: "img_monitor_1",
        url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
        alt: "Computer monitor",
        position: 0
      }
    ],
    attributes: [
      { label: "Диагональ", value: "27 inches" },
      { label: "Разрешение", value: "2560x1440" },
      { label: "Частота", value: "144Hz" }
    ],
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "Mission Bay"
    },
    viewsCount: 176,
    createdAt: "2026-04-08T18:20:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_ps5_slim",
    sellerId: "user_seller_noah",
    categoryId: "cat_gaming",
    title: "PlayStation 5 Slim Disc Edition",
    description:
      "PS5 Slim с дисководом, двумя DualSense и вертикальной подставкой. Консоль тихая, не вскрывалась, аккаунты отвязаны.",
    price: { amount: 420, currency: "AED" },
    condition: "like_new",
    status: "published",
    images: [
      {
        id: "img_ps5_1",
        url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80",
        alt: "PlayStation console",
        position: 0
      }
    ],
    attributes: [
      { label: "Версия", value: "Slim Disc" },
      { label: "Геймпады", value: "2 DualSense" },
      { label: "Память", value: "1 TB" }
    ],
    location: {
      city: "Oakland",
      region: "CA",
      country: "US",
      label: "Temescal"
    },
    viewsCount: 241,
    createdAt: "2026-04-07T12:05:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_mesh_router",
    sellerId: "user_seller_mira",
    categoryId: "cat_networking",
    title: "Eero Pro 6E mesh router 2-pack",
    description:
      "Комплект из двух mesh-роутеров Eero Pro 6E. Стабильно покрывал квартиру 90 кв.м, сброшен до заводских настроек.",
    price: { amount: 210, currency: "AED" },
    condition: "good",
    status: "published",
    images: [
      {
        id: "img_router_1",
        url: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=900&q=80",
        alt: "Network router",
        position: 0
      }
    ],
    attributes: [
      { label: "Wi-Fi", value: "6E" },
      { label: "Комплект", value: "2 routers" },
      { label: "Состояние", value: "Factory reset" }
    ],
    location: {
      city: "San Francisco",
      region: "CA",
      country: "US",
      label: "Nob Hill"
    },
    viewsCount: 93,
    createdAt: "2026-04-06T16:45:00.000Z",
    updatedAt: now
  },
  {
    id: "listing_usbc_dock",
    sellerId: "user_seller_noah",
    categoryId: "cat_accessories",
    title: "CalDigit USB-C dock with 4K HDMI",
    description:
      "Док-станция для ноутбука с HDMI 4K, Ethernet, USB-A, USB-C и SD card reader. Отлично подходит для MacBook и Windows ноутбуков.",
    price: { amount: 120, currency: "AED" },
    condition: "good",
    status: "published",
    images: [
      {
        id: "img_dock_1",
        url: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80",
        alt: "USB-C dock",
        position: 0
      }
    ],
    attributes: [
      { label: "Порты", value: "HDMI, Ethernet, USB-C, SD" },
      { label: "Видео", value: "4K HDMI" },
      { label: "Питание", value: "Pass-through charging" }
    ],
    location: {
      city: "Oakland",
      region: "CA",
      country: "US",
      label: "Jack London Square"
    },
    viewsCount: 77,
    createdAt: "2026-04-05T09:35:00.000Z",
    updatedAt: now
  }
];

export const mockConversations: Conversation[] = [
  {
    id: "conversation_fuji",
    listingId: "listing_fuji_x100v",
    buyerId: "user_buyer_eli",
    sellerId: "user_seller_mira",
    status: "active",
    unreadCount: 2,
    lastMessageAt: "2026-04-12T08:12:00.000Z",
    createdAt: "2026-04-11T17:30:00.000Z"
  }
];

export const mockMessages: Message[] = [
  {
    id: "message_1",
    conversationId: "conversation_fuji",
    senderId: "user_buyer_eli",
    type: "text",
    text: "Камера еще доступна? Могу подъехать сегодня вечером.",
    status: "read",
    createdAt: "2026-04-11T17:32:00.000Z"
  },
  {
    id: "message_2",
    conversationId: "conversation_fuji",
    senderId: "user_seller_mira",
    type: "text",
    text: "Да, доступна. Сегодня после 18:30 удобно.",
    status: "delivered",
    createdAt: "2026-04-11T17:41:00.000Z"
  },
  {
    id: "message_3",
    conversationId: "conversation_fuji",
    senderId: "system",
    type: "system",
    text: "Pine рекомендует фиксировать цену через оффер перед встречей.",
    status: "sent",
    createdAt: "2026-04-11T17:42:00.000Z"
  }
];

export const mockOffers: Offer[] = [
  {
    id: "offer_fuji_1",
    conversationId: "conversation_fuji",
    listingId: "listing_fuji_x100v",
    buyerId: "user_buyer_eli",
    sellerId: "user_seller_mira",
    amount: { amount: 1100, currency: "AED" },
    status: "sent",
    message: "Готов забрать сегодня.",
    expiresAt: "2026-04-13T08:00:00.000Z",
    createdAt: "2026-04-12T08:08:00.000Z",
    updatedAt: "2026-04-12T08:08:00.000Z"
  }
];

export const mockFavorites: Favorite[] = [
  {
    id: "favorite_fuji",
    userId: "user_buyer_eli",
    listingId: "listing_fuji_x100v",
    priceChangedAt: "2026-04-12T07:30:00.000Z",
    createdAt: "2026-04-10T12:20:00.000Z"
  }
];

export const mockDeals: Deal[] = [
  {
    id: "deal_macbook_air",
    listingId: "listing_macbook_air_m2",
    conversationId: "conversation_macbook",
    buyerId: "user_buyer_eli",
    sellerId: "user_seller_noah",
    type: "pine_check",
    status: "inspection",
    amount: { amount: 940, currency: "AED" },
    timeline: [
      {
        id: "deal_event_1",
        label: "Оффер принят",
        description: "Ноутбук зарезервирован до завершения проверки.",
        createdAt: "2026-04-11T11:00:00.000Z"
      },
      {
        id: "deal_event_2",
        label: "Проверка Pine",
        description: "MacBook ожидает подтверждения состояния, батареи и комплекта.",
        createdAt: "2026-04-12T08:00:00.000Z"
      }
    ],
    createdAt: "2026-04-11T11:00:00.000Z",
    updatedAt: now
  }
];

export const mockModerationCases: ModerationCase[] = [
  {
    id: "moderation_gpu",
    listingId: "listing_rtx_4070_super",
    status: "approved",
    note: "Описание и фото соответствуют правилам.",
    createdAt: "2026-04-10T09:20:00.000Z",
    updatedAt: "2026-04-10T10:00:00.000Z"
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: "complaint_fuji_price",
    targetType: "listing",
    targetId: "listing_fuji_x100v",
    reporterId: "user_buyer_eli",
    reason: "other",
    details: "Попросил больше фото серийного номера перед встречей.",
    status: "reviewing",
    createdAt: "2026-04-12T07:45:00.000Z",
    updatedAt: "2026-04-12T08:00:00.000Z"
  }
];

export const mockReviews: Review[] = [
  {
    id: "review_1",
    dealId: "deal_macbook_air",
    authorId: "user_buyer_eli",
    recipientId: "user_seller_noah",
    rating: 5,
    text: "Быстро договорились, состояние совпало с описанием.",
    createdAt: "2026-03-18T14:00:00.000Z"
  }
];

export const mockNotifications: Notification[] = [
  {
    id: "notification_offer",
    userId: "user_seller_mira",
    type: "offer_response",
    title: "Новый оффер по Fujifilm X100V",
    body: "Eli предложил $1,100 и готов забрать сегодня.",
    href: "/chat/conversation_fuji",
    createdAt: "2026-04-12T08:08:00.000Z"
  },
  {
    id: "notification_moderation",
    userId: "user_seller_mira",
    type: "moderation",
    title: "Объявление опубликовано",
    body: "NVIDIA GeForce RTX 4070 Super прошла модерацию.",
    href: "/listings/listing_rtx_4070_super",
    readAt: "2026-04-10T10:30:00.000Z",
    createdAt: "2026-04-10T10:00:00.000Z"
  }
];
