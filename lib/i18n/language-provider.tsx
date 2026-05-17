"use client";

import * as React from "react";

export type PineLanguage = "ru" | "en";

const STORAGE_KEY = "pine-language";

const ruToEn: Record<string, string> = {
  "Pine. All rights reserved.": "Pine. All rights reserved.",
  "Pine": "Pine",
  "P": "P",
  "RU": "RU",
  "EN": "EN",

  // Shell and navigation
  "Каталог": "Catalog",
  "Каталог Pine": "Pine catalog",
  "Создать объявление": "Create listing",
  "Мои объявления": "My listings",
  "Чат": "Chat",
  "Избранное": "Favorites",
  "Профиль": "Profile",
  "Модерация": "Moderation",
  "Сделки": "Deals",
  "Метрики": "Analytics",
  "Управление": "Operations",
  "Войти": "Sign in",
  "Выйти": "Sign out",
  "Создать": "Create",
  "Нужен вход": "Sign in required",
  "Пользователь Pine": "Pine user",
  "Marketplace для электроники": "Electronics marketplace",
  "Развернуть меню": "Expand menu",
  "Свернуть меню": "Collapse menu",
  "Открыть меню": "Open menu",
  "Редактировать профиль": "Edit profile",
  "Поиск телефонов, ноутбуков, видеокарт": "Search phones, laptops, graphics cards",
  "Включить светлую тему": "Enable light theme",
  "Включить темную тему": "Enable dark theme",
  "Демо-режим": "Demo mode",
  "Вход станет доступен после настройки проекта.": "Sign-in will be available after the project is configured.",
  "Вы вышли": "You have signed out",
  "До встречи.": "See you soon.",

  // Common actions and states
  "Все": "All",
  "Назад": "Back",
  "Далее": "Next",
  "Отмена": "Cancel",
  "Открыть": "Open",
  "Редактировать": "Edit",
  "Удалить": "Delete",
  "Сохранить": "Save",
  "Сохранить изменения": "Save changes",
  "Сбросить": "Reset",
  "Отправить": "Send",
  "Подробнее": "Details",
  "Скрыть детали": "Hide details",
  "Попробуйте еще раз.": "Please try again.",
  "Попробуйте обновить страницу.": "Try refreshing the page.",
  "Supabase вернул ошибку.": "The server returned an error.",
  "Загрузка": "Loading",
  "Загружаю": "Loading",
  "Пока пусто": "Nothing here yet",
  "Архив пуст": "Archive is empty",
  "Любое": "Any",
  "Фильтры": "Filters",
  "Максимальная цена": "Maximum price",
  "Сортировка": "Sort",
  "Релевантность": "Relevance",
  "Сначала новые": "Newest first",
  "Цена ниже": "Lowest price",
  "Цена выше": "Highest price",
  "Недавно смотрели": "Recently viewed",
  "Рекомендации": "Recommendations",
  "Найдите вещь и договоритесь в чате": "Find an item and agree in chat",
  "Поиск, фильтры, быстрый просмотр и избранное работают на реальных данных.": "Search, filters, quick preview, and favorites work with live data.",
  "Поиск, фильтры, быстрый просмотр и переход к диалогу уже готовы для сценариев каталога.": "Search, filters, quick preview, and chat handoff are ready for catalog scenarios.",
  "Откройте объявление": "Open the listing",
  "Из карточки товара можно перейти в диалог с продавцом.": "You can start a conversation with the seller from the listing page.",
  "Не удалось загрузить каталог": "Could not load catalog",
  "Не удалось обновить избранное": "Could not update favorites",
  "Смартфоны": "Smartphones",
  "Ноутбуки": "Laptops",
  "Планшеты": "Tablets",
  "Компьютеры": "Desktop PCs",
  "Комплектующие ПК": "PC components",
  "Мониторы": "Monitors",
  "Игровые консоли": "Game consoles",
  "Аудио": "Audio",
  "Камеры": "Cameras",
  "Носимые устройства": "Wearables",
  "Сеть и роутеры": "Networking and routers",
  "Кабели и аксессуары": "Cables and accessories",
  "Продаю электронику и комплектующие после аккуратного использования.": "I sell electronics and components after careful personal use.",
  "Компактная камера в отличном состоянии. В комплекте ремень, батарея, зарядка и защитный фильтр. Использовалась бережно для travel-фото.": "Compact camera in excellent condition. Includes strap, battery, charger, and protective filter. Used carefully for travel photos.",
  "Легкий MacBook Air на M2 в конфигурации 16 GB RAM и 512 GB SSD. Батарея держит полный рабочий день, корпус без вмятин, клавиатура и экран в отличном состоянии.": "Lightweight M2 MacBook Air with 16 GB RAM and 512 GB SSD. Battery lasts a full workday, the body has no dents, and the keyboard plus screen are in excellent condition.",
  "Видеокарта в отличном состоянии, использовалась только для игр и 3D-рендера без майнинга. Температуры стабильные, коробка и чек на месте.": "Graphics card in excellent condition, used only for gaming and 3D rendering with no mining. Stable temperatures, box and receipt included.",
  "Разблокированный iPhone 15 Pro с 256 GB памяти. Экран без царапин, Face ID работает, батарея 96%. В комплекте USB-C кабель и MagSafe-чехол.": "Unlocked iPhone 15 Pro with 256 GB storage. Scratch-free screen, Face ID works, 96% battery. Includes USB-C cable and MagSafe case.",
  "Тонкий iPad Pro 11 на M4, Wi-Fi версия. Использовался для заметок и дизайна, экран OLED без дефектов. В комплекте Apple Pencil Pro.": "Slim 11-inch M4 iPad Pro, Wi-Fi version. Used for notes and design, OLED screen has no defects. Includes Apple Pencil Pro.",
  "Беспроводные наушники с активным шумоподавлением. Амбушюры чистые, звук без хрипов, заряд держат отлично. Есть кейс и USB-C кабель.": "Wireless headphones with active noise cancellation. Clean ear pads, clear sound, excellent battery life. Case and USB-C cable included.",
  "Игровой 27-дюймовый QHD монитор с частотой 144Hz. Матрица без битых пикселей, подставка и DisplayPort кабель в комплекте.": "27-inch QHD gaming monitor at 144Hz. No dead pixels, stand and DisplayPort cable included.",
  "PS5 Slim с дисководом, двумя DualSense и вертикальной подставкой. Консоль тихая, не вскрывалась, аккаунты отвязаны.": "PS5 Slim with disc drive, two DualSense controllers, and vertical stand. Quiet console, never opened, accounts removed.",
  "Комплект из двух mesh-роутеров Eero Pro 6E. Стабильно покрывал квартиру 90 кв.м, сброшен до заводских настроек.": "Set of two Eero Pro 6E mesh routers. Stable coverage for a 90 sq.m apartment, reset to factory settings.",
  "Док-станция для ноутбука с HDMI 4K, Ethernet, USB-A, USB-C и SD card reader. Отлично подходит для MacBook и Windows ноутбуков.": "Laptop dock with 4K HDMI, Ethernet, USB-A, USB-C, and SD card reader. Works great with MacBook and Windows laptops.",

  // Auth and onboarding
  "Вход": "Sign in",
  "Новый аккаунт": "New account",
  "Телефон": "Phone",
  "Вход в Pine": "Sign in to Pine",
  "Вход по телефону": "Phone sign-in",
  "Создать профиль Pine": "Create a Pine profile",
  "Войдите по email и паролю, чтобы управлять профилем, объявлениями и сделками.": "Sign in with email and password to manage your profile, listings, and deals.",
  "После регистрации вы сможете заполнить имя, фото и город.": "After registration, you can add your name, photo, and city.",
  "Введите номер в международном формате, и мы отправим код подтверждения.": "Enter your number in international format and we will send a verification code.",
  "Нет аккаунта?": "No account?",
  "Уже есть аккаунт?": "Already have an account?",
  "Предпочитаете email?": "Prefer email?",
  "Войти по email": "Sign in with email",
  "Войти по телефону": "Sign in with phone",
  "Загрузка формы входа...": "Loading sign-in form...",
  "Загрузка формы регистрации...": "Loading sign-up form...",
  "Вернуться в каталог": "Back to catalog",
  "Вход пока недоступен. Проверьте настройки проекта и попробуйте снова.": "Sign-in is not available yet. Check project settings and try again.",
  "Нужно согласие": "Consent required",
  "Подтвердите согласие на обработку персональных данных, чтобы продолжить.": "Confirm your consent to personal data processing to continue.",
  "Аккаунт уже существует": "Account already exists",
  "Попробуйте войти с этим email.": "Try signing in with this email.",
  "Не удалось выполнить вход": "Could not sign in",
  "Аккаунт создан": "Account created",
  "Подтвердите email, если это требуется, затем войдите в аккаунт.": "Confirm your email if required, then sign in.",
  "Для этого email уже есть аккаунт. Выполните вход.": "An account already exists for this email. Sign in instead.",
  "Вход выполнен": "Signed in",
  "Перенаправляю в профиль.": "Redirecting to profile.",
  "Проверьте email, если включено подтверждение.": "Check your email if confirmation is enabled.",
  "Я соглашаюсь с обработкой персональных данных и принимаю": "I agree to personal data processing and accept the",
  "политику конфиденциальности": "privacy policy",
  "и": "and",
  "условия использования": "terms of use",
  "Создать аккаунт": "Create account",
  "Завершите профиль": "Complete your profile",
  "Профиль еще не заполнен.": "Your profile is not complete yet.",
  "Заполнить профиль": "Complete profile",
  "Профиль готов к объявлениям, чатам и сделкам.": "Your profile is ready for listings, chats, and deals.",
  "Город профиля обновится в карточках и сделках.": "Your profile city will update in listings and deals.",
  "Профиль сохранен": "Profile saved",
  "Не удалось сохранить профиль": "Could not save profile",
  "Отображаемое имя": "Display name",
  "О себе": "Bio",
  "Аватар": "Avatar",
  "Ссылка на аватар": "Avatar URL",
  "Проект еще не настроен": "Project is not configured yet",
  "Сохранение профиля станет доступно после подключения базы.": "Profile saving will be available after the database is connected.",
  "Сначала войдите или создайте аккаунт.": "Sign in or create an account first.",
  "Подтвердите согласие на обработку персональных данных.": "Confirm consent to personal data processing.",
  "Имя не подходит": "Name is not allowed",
  "Можно управлять объявлениями и сделками.": "You can now manage listings and deals.",
  "Не удалось сохранить": "Could not save",
  "Заполните данные профиля": "Complete your profile details",
  "Укажите имя, фото и ваш город, чтобы покупателям было проще вам доверять.": "Add your name, photo, and city so buyers can trust you more easily.",
  "Загрузить фото профиля": "Upload profile photo",
  "PNG или JPG": "PNG or JPG",
  "Имя": "Name",
  "Например: быстро отвечаю, бережно упаковываю технику, могу показать тесты устройства.": "For example: I reply quickly, pack devices carefully, and can show device tests.",
  "Подтверждаю согласие на обработку персональных данных и публикацию контактной информации в рамках сделок Pine.": "I consent to personal data processing and publication of contact information within Pine deals.",
  "Сохранить профиль": "Save profile",

  // Domain labels
  "Черновик": "Draft",
  "Черновики": "Drafts",
  "На модерации": "In moderation",
  "Опубликовано": "Published",
  "Опубликованные": "Published",
  "Нужны правки": "Needs changes",
  "Отклонено": "Rejected",
  "Отклонен": "Declined",
  "Отклонена": "Dismissed",
  "В резерве": "Reserved",
  "Продано": "Sold",
  "Проданные": "Sold",
  "Новое": "New",
  "Как новое": "Like new",
  "Хорошее": "Good",
  "Заметный износ": "Visible wear",
  "На запчасти": "For parts",
  "Ожидает ответа": "Awaiting response",
  "Принят": "Accepted",
  "Контр-оффер": "Counter-offer",
  "Истек": "Expired",
  "Создана": "Created",
  "Ожидает оплаты": "Awaiting payment",
  "Товар в резерве": "Item reserved",
  "Встреча запланирована": "Meetup planned",
  "В доставке": "In delivery",
  "Проверка": "Review",
  "Завершена": "Completed",
  "Отменена": "Cancelled",
  "Личная встреча": "Meetup",
  "Доставка": "Delivery",
  "Проверка товара": "Item check",
  "Отправлена": "Submitted",
  "На проверке": "Under review",
  "Решена": "Resolved",
  "Спам": "Spam",
  "Мошенничество": "Fraud",
  "Запрещенный товар": "Prohibited item",
  "Оскорбления": "Abuse",
  "Другое": "Other",
  "Пользователь": "User",
  "Диалог": "Conversation",
  "Открыта": "Open",
  "Одобрено": "Approved",
  "Сообщение": "Message",
  "Оффер": "Offer",
  "Цена изменилась": "Price changed",
  "Товар продан": "Item sold",
  "Сделка": "Deal",

  // Listings
  "Уведомления": "Notifications",
  "Описание": "Description",
  "Продавец": "Seller",
  "Локация": "Location",
  "Похожие товары": "Similar items",
  "Написать": "Message",
  "Предложить цену": "Make an offer",
  "Пожаловаться": "Report",
  "Редактировать объявление": "Edit listing",
  "Просмотры": "Views",
  "В избранном": "Favorites",
  "Готовность": "Readiness",
  "Характеристики": "Specs",
  "Источник": "Source",
  "Веб-публикация": "Web listing",
  "Матрица": "Sensor",
  "Пробег": "Shutter count",
  "Комплект": "Bundle",
  "Процессор": "Processor",
  "Память": "Storage",
  "Батарея": "Battery",
  "Разъемы": "Ports",
  "История": "History",
  "Сеть": "Network",
  "Чип": "Chip",
  "Коробка, ремень, зарядка": "Box, strap, charger",
  "Без майнинга": "No mining",
  "Да": "Yes",
  "Подключение": "Connection",
  "Кейс, кабель": "Case, cable",
  "Диагональ": "Diagonal",
  "Разрешение": "Resolution",
  "Частота": "Refresh rate",
  "Версия": "Version",
  "Геймпады": "Controllers",
  "Порты": "Ports",
  "Видео": "Video",
  "Питание": "Power",
  "Фото появится после загрузки": "Photo will appear after upload",
  "Добавить в избранное": "Add to favorites",
  "Быстрый просмотр": "Quick preview",
  "В избранное": "Add to favorites",
  "Открыть карточку": "Open listing page",
  "Рейтинг": "Rating",
  "отзывов": "reviews",
  "сделок": "deals",
  "Объявление не найдено": "Listing not found",
  "Загружаю объявление...": "Loading listing...",
  "Не удалось загрузить объявление": "Could not load listing",
  "Чат не создан": "Chat was not created",
  "Оффер отправлен": "Offer sent",
  "Продавец увидит предложение в диалоге.": "The seller will see the offer in the conversation.",
  "Оффер не отправлен": "Offer was not sent",
  "Добавьте детали": "Add details",
  "Модерации нужен короткий контекст.": "Moderation needs a short context.",
  "Жалоба отправлена": "Report sent",
  "Мы проверим обращение.": "We will review the report.",
  "Жалоба не отправлена": "Report was not sent",
  "Укажите цену": "Enter a price",
  "Оффер должен быть положительным числом.": "The offer must be a positive number.",
  "Готов забрать сегодня, если цена подойдет.": "I can pick it up today if the price works.",
  "Диалог не найден после создания.": "Conversation was not found after creation.",
  "Статус появится в разделе модерации.": "The status will appear in moderation.",
  "Изображение объявления пока недоступно": "Listing image is not available yet",
  "Оффер продавцу": "Offer to seller",
  "Предложение появится в диалоге, где продавец сможет принять его, отклонить или ответить встречной ценой.": "The offer will appear in chat, where the seller can accept, decline, or counter it.",
  "Ваша цена": "Your price",
  "Предложение заметно ниже цены. Мягкий старт часто повышает шанс ответа.": "This offer is noticeably below the price. A softer start often improves the chance of a reply.",
  "Отправить оффер": "Send offer",
  "Продавец Pine": "Pine seller",
  "Проверенный продавец": "Verified seller",
  "Профиль подтвержден": "Profile verified",
  "Жалоба": "Report",
  "На что жалуетесь": "What are you reporting?",
  "На объявление": "The listing",
  "На продавца": "The seller",
  "Что стоит проверить модерации?": "What should moderation check?",
  "не указан": "not specified",
  "не указана": "not specified",
  "Объявление": "Listing",
  "Категория": "Category",
  "Фото": "Photo",
  "Название": "Title",
  "Цена": "Price",
  "Состояние": "Condition",
  "Город": "City",
  "Регион": "Region",
  "Страна": "Country",
  "Загрузить фото": "Upload photos",
  "Сохранить черновик": "Save draft",
  "Отправить на модерацию": "Send to moderation",
  "Подсказать описание": "Suggest description",
  "Подсказки качества": "Quality tips",
  "На модерацию": "To moderation",
  "Создание объявления": "Create listing",
  "Редактирование объявления": "Edit listing",
  "Соберите карточку для модерации": "Prepare the listing for review",
  "Качество": "Quality",
  "До 10 изображений, можно менять порядок": "Up to 10 images, order can be changed",
  "Описание появится здесь.": "The description will appear here.",
  "Название объявления": "Listing title",
  "Проверьте карточку перед отправкой": "Review the listing before sending",
  "Добавьте 2-4 фото с разными ракурсами.": "Add 2-4 photos from different angles.",
  "Укажите состояние честно: это снижает жалобы после встречи.": "Describe the condition honestly: it reduces reports after the meetup.",
  "Цена около рыночной чаще приводит к первому сообщению в течение дня.": "A market-level price usually gets the first message within a day.",
  "Покажите серийный номер, комплект и следы использования на фото.": "Show the serial number, bundle, and signs of use in photos.",
  "Не удалось загрузить категории": "Could not load categories",
  "Не удалось открыть объявление для редактирования": "Could not open listing for editing",
  "Добавьте хотя бы одну фотографию.": "Add at least one photo.",
  "Выберите категорию": "Choose a category",
  "Укажите локацию": "Enter a location",
  "Проверьте поля": "Check the fields",
  "Подсказки уже отмечены в форме.": "The hints are already marked in the form.",
  "Описание предложено": "Description suggested",
  "Черновик текста готов, его можно отредактировать.": "The draft text is ready and can be edited.",
  "Изменения отправлены на модерацию": "Changes sent to moderation",
  "Отправлено на модерацию": "Sent to moderation",
  "Изменения сохранены": "Changes saved",
  "Черновик сохранен": "Draft saved",
  "Объявление отправлено на проверку.": "Listing sent for review.",
  "Не удалось сохранить объявление": "Could not save listing",
  "Статус можно смотреть в моих объявлениях.": "You can track the status in My listings.",
  "Можно продолжить позже.": "You can continue later.",
  "Следите за статусом публикации, правками после проверки и продажами.": "Track publication status, review notes, and sales.",
  "Не удалось загрузить объявления": "Could not load listings",
  "Не удалось отправить": "Could not send",
  "Модерация не создана": "Moderation case was not created",
  "Повторно отправлено": "Sent again",
  "Объявление ожидает проверки.": "Listing is waiting for review.",
  "Не удалось отметить проданным": "Could not mark as sold",
  "Статус обновлен": "Status updated",
  "Объявление отмечено как проданное.": "Listing marked as sold.",
  "Загружаю ваши объявления": "Loading your listings",
  "Войдите, чтобы открыть профиль Pine.": "Sign in to open your Pine profile.",

  // Chat and offers
  "Диалоги": "Conversations",
  "Выберите диалог": "Select a conversation",
  "Напишите сообщение": "Write a message",
  "Офферы": "Offers",
  "Создать оффер": "Create offer",
  "Отправить контр-оффер": "Send counter-offer",
  "Товар отправлен": "Item shipped",
  "Сделка состоялась": "Deal completed",
  "Написать в модерацию": "Contact moderation",
  "Удалить чат": "Delete chat",
  "Удалить чат?": "Delete chat?",
  "Диалог исчезнет только из вашего списка.": "The conversation will disappear only from your list.",
  "Чат скрыт": "Chat hidden",
  "Диалог убран из вашего списка.": "The conversation was removed from your list.",
  "Не удалось скрыть чат": "Could not hide chat",
  "Не удалось загрузить диалоги": "Could not load conversations",
  "Не удалось загрузить переписку": "Could not load thread",
  "Сообщение не отправлено": "Message was not sent",
  "Фото отправлено": "Photo sent",
  "Фото не отправлено": "Photo was not sent",
  "Контр-оффер должен быть положительным числом.": "The counter-offer must be a positive number.",
  "Контр-оффер отправлен": "Counter-offer sent",
  "Покупатель увидит новую цену в диалоге.": "The buyer will see the new price in the conversation.",
  "Контр-оффер не отправлен": "Counter-offer was not sent",
  "Оффер принят": "Offer accepted",
  "Сделка создана автоматически, товар переведен в резерв.": "The deal was created automatically and the item is reserved.",
  "Оффер отклонен": "Offer declined",
  "Статус оффера не обновлен": "Offer status was not updated",
  "Покупатель увидит обновление прямо в чате.": "The buyer will see the update right in chat.",
  "Статус не обновлен": "Status was not updated",
  "Сделка завершена": "Deal completed",
  "Товар отмечен как проданный, можно оставить отзыв.": "The item is marked as sold, and you can leave a review.",
  "Не удалось завершить сделку": "Could not complete the deal",
  "Нужна помощь модерации по текущей сделке.": "Need moderation help with the current deal.",
  "Обращение отправлено": "Request sent",
  "Модерация подключится к спорной ситуации.": "Moderation will join the dispute.",
  "Не удалось отправить обращение": "Could not send request",
  "Войдите, чтобы открыть чат": "Sign in to open chat",
  "Диалоги, офферы и резерв товара доступны авторизованным пользователям.": "Conversations, offers, and item reservation are available to signed-in users.",
  "Диалогов пока нет": "No conversations yet",
  "Откройте объявление и нажмите «Написать», чтобы начать диалог с продавцом.": "Open a listing and tap “Message” to start a conversation with the seller.",
  "В каталог": "To catalog",
  "без названия": "untitled",
  "Слишком низкая цена может снизить шанс ответа.": "A very low price may reduce the chance of a reply.",
  "Покупатель предложил цену": "Buyer offered a price",
  "Продавец предложил новую цену": "Seller proposed a new price",
  "Принять": "Accept",
  "Отклонить": "Decline",
  "Сделка уже создана": "Deal already created",
  "Проверка Pine": "Pine check",
  "Ноутбук зарезервирован до завершения проверки.": "The laptop is reserved until the check is complete.",
  "MacBook ожидает подтверждения состояния, батареи и комплекта.": "The MacBook is waiting for condition, battery, and bundle confirmation.",
  "Сделка активна: все ключевые обновления и подтверждения происходят внутри этого чата.": "The deal is active: all key updates and confirmations happen in this chat.",
  "Оффер принят. Сделка создана автоматически, можно согласовать отправку и подтверждение.": "The offer is accepted. The deal was created automatically, and shipping plus confirmation can now be coordinated.",
  "Напишите первое сообщение по этому объявлению.": "Write the first message about this listing.",
  "Если после завершения сделки возник спор, можно подключить модерацию.": "If a dispute appears after the deal is completed, you can involve moderation.",
  "Это слишком низкое предложение. Лучше коротко пояснить причину своей цены.": "This offer is too low. It is better to briefly explain your price.",
  "Покупатель прислал оффер. Можно принять его, отклонить или отправить контр-оффер с новой ценой.": "The buyer sent an offer. You can accept it, decline it, or send a counter-offer with a new price.",
  "Например: готов отдать чуть дешевле, если заберете сегодня.": "For example: I can sell a bit cheaper if you pick it up today.",
  "История офферов ниже. Если нужно обсудить детали, продолжайте переписку в чате.": "Offer history is below. If you need to discuss details, continue in chat.",
  "Здесь появится контр-оффер, когда покупатель предложит свою цену.": "A counter-offer will appear here when the buyer suggests a price.",
  "Офферов пока нет. Как только кто-то предложит цену, история появится здесь.": "No offers yet. Once someone suggests a price, the history will appear here.",
  "Откройте диалог слева, чтобы увидеть переписку, офферы и статус сделки.": "Open a conversation on the left to see messages, offers, and deal status.",
  "Вы": "You",
  "Собеседник": "Participant",
  "Товар переведен в резерв, остальные sent-офферы в этом диалоге отклоняются.": "The item is reserved, and other sent offers in this conversation are declined.",

  // Favorites and notifications
  "Сохраненные": "Saved",
  "Архив": "Archive",
  "Сохраненные объявления, архив и сигналы об изменении цены или продаже.": "Saved listings, archive, and alerts about price changes or sales.",
  "Следите за ценой, наличием и статусом продажи по сохраненным товарам.": "Track price, availability, and sale status for saved items.",
  "Сохраняйте объявления из каталога, чтобы вернуться к ним позже.": "Save listings from the catalog to return to them later.",
  "Открыть каталог": "Open catalog",
  "В архиве": "In archive",
  "Архив пригодится для товаров, за которыми уже не нужно следить.": "Archive is useful for items you no longer need to track.",
  "Загружаю избранное": "Loading favorites",
  "Войдите, чтобы открыть избранное": "Sign in to open favorites",
  "Избранное доступно после входа.": "Favorites are available after sign-in.",
  "Новых уведомлений нет": "No new notifications",
  "Новые уведомления": "New notifications",
  "Прочитано": "Read",
  "Отметить прочитанным": "Mark as read",
  "Отметить все прочитанным": "Mark all as read",
  "Загружаю уведомления": "Loading notifications",
  "Войдите, чтобы открыть уведомления": "Sign in to open notifications",
  "Уведомления доступны после входа.": "Notifications are available after sign-in.",
  "Уведомления не загрузились": "Notifications did not load",
  "Все уведомления прочитаны": "All notifications marked as read",
  "Не удалось прочитать все": "Could not mark all as read",
  "Прочитать все": "Mark all as read",
  "Уведомления о сообщениях, офферах и сделках доступны после входа.": "Notifications about messages, offers, and deals are available after sign-in.",
  "Уведомлений пока нет": "No notifications yet",
  "Ответы на офферы, модерация, избранное и статусы сделок появятся здесь.": "Offer replies, moderation, favorites, and deal statuses will appear here.",

  // Profile and reviews
  "Аккаунт": "Account",
  "Безопасность": "Security",
  "Отзывы": "Reviews",
  "Настройки": "Settings",
  "ID пользователя": "User ID",
  "Роль": "Role",
  "Подтвержденный профиль, история сделок и отзывы помогают быстрее договариваться о покупке и продаже.": "A verified profile, deal history, and reviews help people agree faster.",
  "Загружаю профиль": "Loading profile",
  "Загружаю отзывы": "Loading reviews",
  "Отзывы не загрузились": "Reviews did not load",
  "Добавьте текст отзыва": "Add review text",
  "Отзыв сохранен": "Review saved",
  "Спасибо, ваша оценка уже учтена.": "Thank you, your rating has been counted.",
  "Отзыв не сохранен": "Review was not saved",
  "Отзывов пока нет. Оставить отзыв можно только после завершенной сделки с другим участником.": "No reviews yet. You can leave a review only after completing a deal with another participant.",
  "Оставить отзыв после сделки": "Leave a review after a deal",
  "Оценка": "Rating",
  "Что понравилось": "What went well",
  "Комментарий": "Comment",
  "Кратко расскажите, как прошла сделка.": "Briefly describe how the deal went.",
  "Сохранить отзыв": "Save review",
  "Оценку по сделке можно оставить из раздела «Сделки» после ее завершения.": "You can leave a deal rating from Deals after it is completed.",
  "Здесь собраны ваши базовые настройки профиля и уведомлений.": "Your basic profile and notification settings are here.",
  "Вежливое общение": "Polite communication",
  "Быстрый выход на связь": "Quick response",
  "Честное описание": "Honest description",
  "Аккуратная упаковка": "Careful packaging",
  "Пунктуальность": "Punctuality",
  "Быстро договорились, сделка прошла спокойно.": "We agreed quickly, and the deal went smoothly.",
  "Публичный профиль": "Public profile",
  "Пользователь не найден": "User not found",
  "Профиль продавца": "Seller profile",

  // Deals
  "Сделок пока нет": "No deals yet",
  "Safe deal создается из чата после договоренности по товару.": "A safe deal is created from chat after both sides agree on the item.",
  "Сделка появляется после принятого оффера в чате.": "A deal appears after an accepted offer in chat.",
  "Открыть чат": "Open chat",
  "Сделки не загрузились": "Deals did not load",
  "Войдите, чтобы открыть сделки": "Sign in to open deals",
  "Отслеживание сделки доступно только авторизованным пользователям.": "Deal tracking is available only to signed-in users.",
  "Загружаю сделки": "Loading deals",
  "Здесь можно следить за ходом сделки и быстро возвращаться в чат.": "You can track deal progress here and quickly return to chat.",
  "Все ключевые этапы фиксируются в истории, а действия сторон выполняются прямо из чата.": "All key steps are recorded in history, while buyer and seller actions happen directly in chat.",
  "Сделка Pine": "Pine deal",
  "Сделка завершена. Если все прошло хорошо, можно оставить отзыв.": "The deal is complete. If everything went well, you can leave a review.",
  "Следите за обновлениями в чате: продавец подтверждает отправку, покупатель подтверждает завершение.": "Watch updates in chat: the seller confirms shipment, and the buyer confirms completion.",
  "Открыть товар": "Open item",
  "Оставить отзыв": "Leave review",
  "История и статусы": "History and statuses",

  // Moderation and analytics
  "Жалобы": "Reports",
  "Модерация объявлений": "Listing moderation",
  "Создать жалобу": "Create report",
  "Инструменты": "Tools",
  "Открыть диалог": "Open conversation",
  "Открыть объявление": "Open listing",
  "Открыть профиль": "Open profile",
  "Отклонить жалобу": "Dismiss report",
  "Взять в работу": "Start review",
  "Одобрить и опубликовать": "Approve and publish",
  "Комментарий модератора": "Moderator comment",
  "Например: фото и описание соответствуют правилам.": "For example: photos and description follow the rules.",
  "Новая жалоба": "New report",
  "Причина": "Reason",
  "Детали": "Details",
  "ID объявления": "Listing ID",
  "UUID профиля": "Profile UUID",
  "Инструменты модератора": "Moderator tools",
  "Статус верификации": "Verification status",
  "Обновить верификацию": "Update verification",
  "Причина блокировки": "Block reason",
  "Заблокировать пользователя": "Block user",
  "Раздел модерации не загрузился": "Moderation section did not load",
  "Укажите ID объявления": "Enter listing ID",
  "Например, возьмите его из карточки товара или списка модерации.": "For example, copy it from the listing page or moderation queue.",
  "Жалоба создана": "Report created",
  "Обращение зарегистрировано.": "The request has been registered.",
  "Жалоба не создана": "Report was not created",
  "Объявление опубликовано": "Listing published",
  "Объявление опубликовано в каталоге.": "The listing is published in the catalog.",
  "Объявление отклонено и скрыто из публикации.": "The listing was rejected and hidden from publication.",
  "Статус модерации обновлен": "Moderation status updated",
  "Объявление появилось в каталоге.": "The listing is now visible in the catalog.",
  "Комментарий продавцу сохранен.": "The seller note has been saved.",
  "Модерация не сохранена": "Moderation was not saved",
  "Статус жалобы обновлен": "Report status updated",
  "Жалоба не обновлена": "Report was not updated",
  "Пользователь заблокирован": "User blocked",
  "Доступ к площадке ограничен.": "Marketplace access has been restricted.",
  "Пользователь не заблокирован": "User was not blocked",
  "Для этого действия нужны права администратора.": "Admin rights are required for this action.",
  "Укажите ID пользователя": "Enter user ID",
  "Верификация обновлена": "Verification updated",
  "Верификация не обновлена": "Verification was not updated",
  "Загружаю модерацию": "Loading moderation",
  "Войдите, чтобы открыть модерацию": "Sign in to open moderation",
  "Жалобы и очередь модерации доступны после входа.": "Reports and the moderation queue are available after sign-in.",
  "Модерация и жалобы": "Moderation and reports",
  "Здесь обрабатываются жалобы, очередь модерации и действия по безопасности площадки.": "Reports, listing review, and safety actions are handled here.",
  "Для работы с очередью модерации нужна роль moderator или admin.": "A moderator or admin role is required to work with the moderation queue.",
  "Для этой жалобы нет связанного объявления.": "There is no listing connected to this report.",
  "Другие объявления продавца": "Other seller listings",
  "Жалоб пока нет": "No reports yet",
  "Новые обращения появятся здесь.": "New requests will appear here.",
  "Нужна роль moderator или admin": "Moderator or admin role required",
  "Обычному пользователю этот раздел недоступен.": "This section is not available to regular users.",
  "Ожидает решения модератора.": "Waiting for a moderator decision.",
  "Детали объявления": "Listing details",
  "Очередь модерации пуста": "Moderation queue is empty",
  "Новые объявления для проверки появятся здесь после отправки на модерацию.": "New listings will appear here after they are submitted for review.",
  "Блокировка доступна только администратору. Верификация доступна модератору и администратору.": "Blocking is admin-only. Verification is available to moderators and admins.",
  "Метрики не загрузились": "Metrics did not load",
  "Загружаю продуктовые метрики": "Loading product metrics",
  "Нужна роль модератора или администратора": "Moderator or admin role required",
  "Раздел с метриками доступен только команде площадки.": "Metrics are available only to the marketplace team.",
  "Продуктовые метрики": "Product metrics",
  "Воронка": "Funnel",
  "Конверсия": "Conversion",
  "Завершенные сделки": "Completed deals",
  "Начатые диалоги": "Started conversations",
  "Принятые офферы": "Accepted offers",
  "Офферов всего": "Total offers",
  "Среднее время до первой реакции": "Average time to first response",
  "Модерация с первого раза": "First-pass moderation",

  // Maps
  "Ищу место на карте": "Finding the place on the map",
  "Яндекс Карты": "Yandex Maps",
  "Карта: Яндекс Карты": "Map: Yandex Maps",
  "· загружается": "· loading",
  "· готово": "· ready",
  "· не удалось загрузить": "· failed to load",
  "Открыть на карте": "Open on map",
  "Яндекс.Карты не загрузились. Проверь, что ключ активировался, прошло хотя бы 15 минут после выпуска и для ключа разрешен HTTP Referer для `localhost`.": "Yandex Maps did not load. Check that the key is active, at least 15 minutes have passed since it was issued, and HTTP Referer for `localhost` is allowed.",
  "Укажите город или адрес": "Enter a city or address",
  "Не удалось точно найти точку. Попробуйте указать город, улицу или район.": "Could not find the exact point. Try entering a city, street, or district.",
  "Карта появится после ввода локации.": "The map will appear after you enter a location.",
  "Карта: OpenStreetMap": "Map: OpenStreetMap",

  // Legal/footer pages
  "Политика конфиденциальности": "Privacy policy",
  "Условия использования": "Terms of use",
  "Файлы cookie": "Cookies",
  "Контакты": "Contact",
  "Помощь": "Help",
  "Все права защищены.": "All rights reserved.",
  "Здесь кратко описано, какие данные Pine хранит для работы объявлений, чатов и сделок.": "A short overview of what data Pine stores to run listings, chats, and deals.",
  "Мы используем данные профиля, объявлений, переписки и сделок только для работы сервиса, поддержки безопасности и улучшения качества платформы.": "We use profile, listing, conversation, and deal data only to operate the service, support safety, and improve platform quality.",
  "Контактные данные, история действий и технические события могут обрабатываться для защиты пользователей, разбора жалоб и предотвращения мошенничества.": "Contact details, activity history, and technical events may be processed to protect users, review reports, and prevent fraud.",
  "Если потребуется удалить данные или уточнить, как они используются, свяжитесь с нами через раздел контактов.": "If you need to delete data or clarify how it is used, contact us through the Contact page.",
  "Эти правила помогают поддерживать честную и безопасную торговлю на Pine.": "These rules help keep trading on Pine fair and safe.",
  "Пользователь обязан публиковать достоверные объявления, корректно описывать состояние товара и не размещать запрещенные товары или мошеннические предложения.": "Users must publish accurate listings, describe item condition correctly, and avoid prohibited items or fraudulent offers.",
  "Переписка, офферы и статусы сделки внутри Pine считаются частью истории взаимодействия и могут использоваться при разборе жалоб.": "Messages, offers, and deal statuses inside Pine are part of the interaction history and may be used when reviewing reports.",
  "Мы можем ограничить доступ к платформе при нарушении правил, злоупотреблении сервисом или угрозе безопасности других пользователей.": "We may restrict access to the platform for rule violations, service abuse, or threats to other users' safety.",
  "Короткие ответы по публикации объявлений, диалогам, офферам и безопасным сделкам.": "Short answers about publishing listings, chats, offers, and safe deals.",
  "Чтобы продать товар, создайте объявление, добавьте реальные фотографии, укажите цену и отправьте карточку на модерацию.": "To sell an item, create a listing, add real photos, set a price, and submit it for review.",
  "Чтобы купить товар, откройте объявление, напишите продавцу или отправьте оффер прямо из карточки товара.": "To buy an item, open a listing, message the seller, or send an offer from the listing page.",
  "После принятия оффера можно оформить сделку и отслеживать ее этапы в разделе сделок.": "After an offer is accepted, the deal is created and can be tracked in Deals.",
  "Если нужна помощь по сделке, жалобе или аккаунту, свяжитесь с командой Pine.": "If you need help with a deal, report, or account, contact the Pine team.",
  "Email поддержки: support@pine.local": "Support email: support@pine.local",
  "По вопросам безопасности и жалоб: safety@pine.local": "For safety and reports: safety@pine.local",
  "Мы стараемся отвечать как можно быстрее, особенно по вопросам активных сделок и жалоб.": "We try to respond as quickly as possible, especially for active deals and reports.",
  "Файлы cookie помогают сохранять вход, тему оформления и базовые настройки интерфейса.": "Cookies help keep sign-in, theme, and basic interface settings.",
  "Мы используем технические cookie и локальное хранилище для авторизации, работы темы, уведомлений и стабильной навигации по платформе.": "We use technical cookies and local storage for authentication, theme behavior, notifications, and stable platform navigation.",
  "Также могут использоваться технические идентификаторы для аналитики действий, например просмотров объявлений или начала диалога.": "Technical identifiers may also be used for action analytics, such as listing views or started conversations.",
  "Отключение cookie может повлиять на вход в аккаунт, работу уведомлений и сохранение пользовательских настроек.": "Disabling cookies may affect account sign-in, notifications, and saved user settings.",
  "Pine использует только необходимые cookie и локальное хранилище для темы, языка и пользовательской сессии.": "Pine uses only necessary cookies and local storage for theme, language, and user session.",
  "Мы не продаем данные пользователей и не используем cookie для скрытого рекламного профилирования.": "We do not sell user data or use cookies for hidden ad profiling.",
  "Продолжая пользоваться Pine, вы соглашаетесь с техническими cookie, нужными для работы сервиса.": "By continuing to use Pine, you agree to technical cookies required for the service to work."
};

const enToRu = Object.fromEntries(Object.entries(ruToEn).map(([ru, en]) => [en, ru]));

type PhraseRule = {
  from: PineLanguage;
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
};

const phraseRules: PhraseRule[] = [
  {
    from: "ru",
    pattern: /^(.+?)\s+объявлен\S*$/,
    replace: ([, count]) => `${count} listings`
  },
  {
    from: "ru",
    pattern: /^(\d+)\s+просмотр(ов|а)?$/,
    replace: ([, count]) => `${count} views`
  },
  {
    from: "ru",
    pattern: /^(\d+)\s+отзыв(ов|а)?$/,
    replace: ([, count]) => `${count} reviews`
  },
  {
    from: "ru",
    pattern: /^(\d+)\s+сдел(ок|ки|ка)$/,
    replace: ([, count]) => `${count} deals`
  },
  {
    from: "ru",
    pattern: /^(\d+)\s+завершенн(ых|ые|ая)\s+сдел(ок|ки|ка)$/,
    replace: ([, count]) => `${count} completed deals`
  },
  {
    from: "ru",
    pattern: /^(.+?)\s+нов\S*\s+событ\S*\s+по сообщениям, офферам, модерации и сделкам\.$/,
    replace: ([, count]) => `${count} new events across messages, offers, moderation, and deals.`
  },
  {
    from: "ru",
    pattern: /^Диалог по объявлению «(.+)» исчезнет только из вашего списка\.$/,
    replace: ([, title]) => `The conversation for “${title}” will disappear only from your list.`
  },
  {
    from: "ru",
    pattern: /^Оффер на (.+) отправлен продавцу\.$/,
    replace: ([, amount]) => `Offer for ${amount} sent to the seller.`
  },
  {
    from: "ru",
    pattern: /^Продавец отправил контр-оффер на (.+)\.$/,
    replace: ([, amount]) => `The seller sent a counter-offer for ${amount}.`
  },
  {
    from: "ru",
    pattern: /^Сделка на сумму (.+) завершена\. Теперь можно оценить вторую сторону\.$/,
    replace: ([, amount]) => `The deal for ${amount} is complete. You can now rate the other participant.`
  },
  {
    from: "ru",
    pattern: /^Текущая роль:\s*(.+)\.$/,
    replace: ([, role]) => `Current role: ${role}.`
  },
  {
    from: "ru",
    pattern: /^Автор жалобы:\s*(.+)$/,
    replace: ([, value]) => `Reporter: ${value}`
  },
  {
    from: "ru",
    pattern: /^Объявление:\s*(.+)\s+·\s+продавец\s+(.+)$/,
    replace: ([, title, seller]) => `Listing: ${title} · seller ${seller}`
  },
  {
    from: "ru",
    pattern: /^Рейтинг:\s*(.+)\s+·\s+отзывов:\s*(.+)\s+·\s+сделок:\s*(.+)$/,
    replace: ([, rating, reviews, deals]) => `Rating: ${rating} · reviews: ${reviews} · deals: ${deals}`
  },
  {
    from: "ru",
    pattern: /^Рейтинг:\s*(.+)\s+·\s+отзывов:\s*(.+)$/,
    replace: ([, rating, reviews]) => `Rating: ${rating} · reviews: ${reviews}`
  },
  {
    from: "ru",
    pattern: /^Роль:\s*(.+)$/,
    replace: ([, role]) => `Role: ${role}`
  },
  {
    from: "ru",
    pattern: /^Продавец:\s*(.+)$/,
    replace: ([, seller]) => `Seller: ${seller}`
  },
  {
    from: "ru",
    pattern: /^Локация:\s*(.+)$/,
    replace: ([, location]) => `Location: ${location}`
  },
  {
    from: "ru",
    pattern: /^Просмотры:\s*(.+)$/,
    replace: ([, views]) => `Views: ${views}`
  },
  {
    from: "ru",
    pattern: /^Статус:\s*(.+)$/,
    replace: ([, status]) => `Status: ${ruToEn[status] ?? status}`
  },
  {
    from: "ru",
    pattern: /^Город:\s*(.+)\s+·\s+Регион:\s*(.+)\s+·\s+Страна:\s*(.+)$/,
    replace: ([, city, region, country]) => `City: ${city} · Region: ${region} · Country: ${country}`
  },
  {
    from: "ru",
    pattern: /^Что понравилось:\s*(.+)$/,
    replace: ([, value]) => `What went well: ${value.split(", ").map((item) => ruToEn[item] ?? item).join(", ")}`
  },
  {
    from: "en",
    pattern: /^(\d+)\s+listings$/,
    replace: ([, count]) => `${count} объявлений`
  },
  {
    from: "en",
    pattern: /^(\d+)\s+views$/,
    replace: ([, count]) => `${count} просмотров`
  },
  {
    from: "en",
    pattern: /^The conversation for “(.+)” will disappear only from your list\.$/,
    replace: ([, title]) => `Диалог по объявлению «${title}» исчезнет только из вашего списка.`
  },
  {
    from: "en",
    pattern: /^Offer for (.+) sent to the seller\.$/,
    replace: ([, amount]) => `Оффер на ${amount} отправлен продавцу.`
  },
  {
    from: "en",
    pattern: /^The seller sent a counter-offer for (.+)\.$/,
    replace: ([, amount]) => `Продавец отправил контр-оффер на ${amount}.`
  }
];

type LanguageContextValue = {
  language: PineLanguage;
  setLanguage: (language: PineLanguage) => void;
  toggleLanguage: () => void;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function translateValue(value: string, language: PineLanguage) {
  const trimmed = value.trim();
  const translated = language === "en" ? ruToEn[trimmed] : enToRu[trimmed];

  if (translated) {
    return value.replace(trimmed, translated);
  }

  const sourceLanguage = language === "en" ? "ru" : "en";

  for (const rule of phraseRules) {
    if (rule.from !== sourceLanguage) {
      continue;
    }

    const match = trimmed.match(rule.pattern);
    if (match) {
      return value.replace(trimmed, rule.replace(match));
    }
  }

  return value;
}

function translateDom(root: ParentNode, language: PineLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const textNodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const next = translateValue(textNode.textContent ?? "", language);
    if (textNode.textContent !== next) {
      textNode.textContent = next;
    }
  });

  document.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) {
        return;
      }

      const next = translateValue(value, language);
      if (next !== value) {
        element.setAttribute(attribute, next);
      }
    });
  });
}

function applyLanguage(language: PineLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = "ltr";
  translateDom(document.body, language);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<PineLanguage>("ru");

  const setLanguage = React.useCallback((nextLanguage: PineLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    applyLanguage(nextLanguage);
  }, []);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as PineLanguage | null;
    const initialLanguage = stored === "en" ? "en" : "ru";
    setLanguageState(initialLanguage);
    applyLanguage(initialLanguage);
  }, []);

  React.useEffect(() => {
    applyLanguage(language);
    const observer = new MutationObserver(() => applyLanguage(language));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [language]);

  const value = React.useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "ru" : "en")
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
