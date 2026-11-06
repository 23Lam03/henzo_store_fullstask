export interface CuratedPhoto {
    file: string;
    desc: string;
}

export const HEADSET_PHOTOS: CuratedPhoto[] = [
  { file: 'ST100VoidPro.jpg', desc: 'CORSAIR ST100 and Void Pros' },
  { file: 'Casques d\'écoute de podcast.jpg', desc: 'Des casques d\'écoute Corsair' },
  { file: 'Sound BlasterX H5 Gaming Headset.jpg', desc: 'Photo of a Sound Blaster X H5 analog gaming headset.' },
  { file: 'Tritton.jpg', desc: 'Aquestos son uns cascos Tritton Kunai' },
  { file: 'GameCom Halo 2 Edition.jpg', desc: 'GameCom Halo 2 Edition Headset' },
  { file: 'Cascos Mars Gaming.jpg', desc: 'Estos son unos cascos gamers de la marca Mars Gaming' },
  { file: 'Auriculares gamer.jpg', desc: 'auriculares gamer' },
  { file: 'Afterglow AGU.1 Wireless Headphones.jpg', desc: 'Afterglow AGU.1 Wireless Headphones' },
  { file: 'Uproar Wireless by Skull Candy.jpg', desc: 'A black Uproar Wireless by Skull Candy budget Bluetooth headsets.' },
  { file: 'PS4-Headset.jpg', desc: 'PS4-Headset' },
];

export const MOUSE_PHOTOS: CuratedPhoto[] = [
  { file: 'Corsair Katar Pro Wireless.jpg', desc: 'Corsair Katar Pro Wireless' },
  { file: 'Corsair Scimitar 2 2017-01-01.jpg', desc: 'Corsair Scimitar' },
  { file: 'Roccat Kova.png', desc: 'Roccat Kova computer mouse with USB wire.' },
  { file: 'Raton Dexxa 3B - Dexxa 3B mouse - 02.jpg', desc: 'Dexxa 3B mechanical mouse.' },
  { file: 'CM Storm Inferno Gaming Mouse.jpg', desc: 'Cooler Master gaming mouse' },
  { file: 'Razer Imperator.JPG', desc: 'Razer Imperator laser gaming mouse.' },
  { file: 'Laser mouse.jpg', desc: 'Raptor M3 Gaming, laser mouse' },
  { file: '2023 Mysz komputerowa Logitech G903 Lightspeed.jpg', desc: 'Logitech G903 Lightspeed computer mouse' },
  { file: 'Logitech G9 Mouse full view.jpeg', desc: 'Logitech G9 Mouse' },
  { file: 'Gamers Mouse.jpg', desc: "A4Tech X7 (X-750F) gamer's laser mouse" },
  { file: 'Raton-gaming.jpg', desc: 'Ratón gaming para jugar a videojuegos' },
  { file: 'Raton de PC.jpg', desc: 'Ratón de PC con luces' },
];

export const STORAGE_PHOTOS: CuratedPhoto[] = [
  { file: 'Crucial MX100 SSD 256GB 20140905.jpg', desc: 'Crucial MX100 256GB SSD' },
  { file: 'Crucial SSD MX300 525GB-8478.jpg', desc: 'Crucial SSD MX300 525GB, 2.5"' },
  { file: 'Crucial SSD MX300 525GB-8479.jpg', desc: 'Crucial SSD MX300 525GB, 2.5"' },
  { file: '2017 Dysk SSD Plextor M8Pe(Y) 256GB.jpg', desc: 'Solid-state drive Plextor M8Pe(Y) 256GB' },
  { file: 'OCZ Core Series V2 SATA II 30GB 2.5" Solid State Drive (SSD).jpg', desc: 'OCZ Core Series V2 SATA II 30GB 2.5" SSD' },
  { file: 'MSATA SSD.jpg', desc: '256GB MSATA SSD' },
];

export const KEYBOARD_PHOTOS: CuratedPhoto[] = [
  { file: 'Corsair K65 1 2017-01-01.jpg', desc: 'Corsair K65 keyboard' },
  { file: 'Corsair K60.jpg', desc: 'Corsair K60 keyboard' },
];

export const CATEGORY_PHOTO_POOL: Record<string, CuratedPhoto[]> = {
  'Tai nghe': HEADSET_PHOTOS,
  Chuột: MOUSE_PHOTOS,
  'PC Gaming': STORAGE_PHOTOS,
  'Bàn phím': KEYBOARD_PHOTOS,
};

export const BRAND_CATEGORY_PHOTOS: Record<string, CuratedPhoto[]> = {
  'Corsair|Tai nghe': [
    { file: 'ST100VoidPro.jpg', desc: 'CORSAIR ST100 and Void Pros' },
    { file: 'Casques d\'écoute de podcast.jpg', desc: 'Des casques d\'écoute Corsair' },
  ],
  'Corsair|Chuột': [
    { file: 'Corsair Katar Pro Wireless.jpg', desc: 'Corsair Katar Pro Wireless' },
    { file: 'Corsair Scimitar 2 2017-01-01.jpg', desc: 'Corsair Scimitar' },
  ],
  'Corsair|Bàn phím': [
    { file: 'Corsair K65 1 2017-01-01.jpg', desc: 'Corsair K65 keyboard' },
    { file: 'Corsair K60.jpg', desc: 'Corsair K60 keyboard' },
  ],
  'Crucial|PC Gaming': [
    { file: 'Crucial MX100 SSD 256GB 20140905.jpg', desc: 'Crucial MX100 256GB SSD' },
    { file: 'Crucial SSD MX300 525GB-8478.jpg', desc: 'Crucial SSD MX300 525GB, 2.5"' },
    { file: 'Crucial SSD MX300 525GB-8479.jpg', desc: 'Crucial SSD MX300 525GB, 2.5"' },
  ],
};
