// Photo credits. All images are from Wikimedia Commons under the licences below and are
// stored in public/images. CC BY / CC BY-SA require this attribution to stay visible
// (shown on the /credits page). They are illustrative stock photos, not photos of the
// listed businesses — real partners upload their own cover photo when they register.

export interface PhotoCredit { file: string; subject: string; author: string; license: string; licenseUrl: string; source: string }

const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/'
const wiki = (name: string) => `https://commons.wikimedia.org/wiki/File:${name}`

export const PHOTO_CREDITS: PhotoCredit[] = [
  { file: 'hero-la-digue.jpg', subject: "Anse Source d'Argent, La Digue", author: 'Tobias Alt (Tobi 87)', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: wiki("Anse_Source_d%27Argent_3-La_Digue.jpg") },
  { file: 'beau-vallon.jpg', subject: 'Beau Vallon beach, Mahé', author: 'David Stanley', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: wiki('Beau_Vallon_Beach_(11177463746).jpg') },
  { file: 'victoria-clock-tower.jpg', subject: 'Clock Tower, Victoria', author: 'Vasilii Martynov', license: 'CC0', licenseUrl: CC0, source: wiki('Victoria_Clock_Tower_1.jpg') },
  { file: 'r9-market.jpg', subject: 'Sir Selwyn Selwyn-Clarke Market, Victoria', author: 'So Seychelles', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: wiki('Vendors_and_produce,_Sir_Selwyn_Clarke_Market,_Victoria,_Seychelles.jpg') },
  { file: 'partner-praslin-dinner.jpg', subject: 'Dinner by the sea, Praslin', author: 'dronepicr', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: wiki('Candle_light_dinner_next_to_the_sea,_Praslin_Seychelles_(39617096671).jpg') },
  { file: 'partner-kitchen.jpg', subject: 'Restaurant kitchen', author: 'Shixart1985', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', source: wiki('Kitchen_setup_showcasing_grilling_equipment_and_cooking_tools_at_a_busy_restaurant_undefined.jpg') },
  { file: 'r1-creole.jpg', subject: 'Creole Festival food, Seychelles', author: 'Joe Laurence, Seychelles News Agency', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', source: wiki('Creole_Festival_food_in_Seychelles.jpg') },
  { file: 'r2-grilled-fish.jpg', subject: 'Grilled snapper with lemon', author: 'Daderot', license: 'CC0', licenseUrl: CC0, source: wiki('Grilled_snapper_and_tomato_with_lemon_-_Queenstown,_New_Zealand.jpg') },
  { file: 'r3-burger.jpg', subject: 'Burger and fries', author: 'Daderot', license: 'CC0', licenseUrl: CC0, source: wiki('Hamburger_with_blue_cheese,_guacamole,_and_other_toppings,_plus_French_fries_-_Massachusetts.jpg') },
  { file: 'r4-pizza.jpg', subject: 'Margherita pizza', author: 'Shisma', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', source: wiki('Margherita_pizza_on_plate.jpg') },
  { file: 'r5-indian.jpg', subject: 'Butter chicken with naan', author: 'cyclonebill', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: wiki('Butter_chicken_med_raita_og_naan_(5158340847).jpg') },
  { file: 'r6-bowl.jpg', subject: 'Vegan Buddha bowl', author: 'FitTasteTic', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: wiki('Vegan_Buddha_Bowl.jpg') },
  { file: 'r7-sushi.jpg', subject: 'Sushi platter', author: 'Joli Rumi', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: wiki('Sushi_platter,_Nikko,_Japan.jpg') },
  { file: 'r8-cafe.jpg', subject: 'Croissants and cappuccino', author: 'Nicholas Gemini', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: wiki('Croissants,_caf%C3%A8,_cappuccino,_suc_de_taronja.jpg') },
  { file: 'r10-pharmacy.jpg', subject: 'Pharmacy interior', author: 'Mike1979 Russia', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: wiki('Brest_Greenberg_Pharmacy_Interior_2024-09-20_3798.jpg') },
  { file: 'r11-ice-cream.jpg', subject: 'Ice cream scoops', author: 'Missvain (Sarah Stierch)', license: 'CC0', licenseUrl: CC0, source: wiki('Sweet_Scoops_-_June_2025_-_Sarah_Stierch.jpg') },
]
