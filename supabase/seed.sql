insert into public.categories (name, slug, icon) values
  ('Смартфоны', 'smartphones', 'Smartphone'),
  ('Ноутбуки', 'laptops', 'Laptop'),
  ('Планшеты', 'tablets', 'Tablet'),
  ('Компьютеры', 'desktops', 'Monitor'),
  ('Комплектующие ПК', 'pc-components', 'Cpu'),
  ('Мониторы', 'monitors', 'MonitorSpeaker'),
  ('Игровые консоли', 'gaming-consoles', 'Gamepad2'),
  ('Аудио', 'audio', 'Headphones'),
  ('Камеры', 'cameras', 'Camera'),
  ('Носимые устройства', 'wearables', 'Watch'),
  ('Сеть и роутеры', 'networking', 'Router'),
  ('Кабели и аксессуары', 'accessories', 'Cable')
on conflict (slug) do update
set name = excluded.name,
    icon = excluded.icon;
