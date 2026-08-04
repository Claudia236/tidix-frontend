export type Language = 'it' | 'en' | 'es';

export const LANGUAGE_LABELS: Record<Language, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
};

type Vars = Record<string, string | number>;
type Entry = string | ((vars: Vars) => string);
interface EntryTriple {
  it: Entry;
  en: Entry;
  es: Entry;
}

const ENTRIES: Record<string, EntryTriple> = {
  // common
  'common.cancel': { it: 'Annulla', en: 'Cancel', es: 'Cancelar' },
  'common.save': { it: 'Salva', en: 'Save', es: 'Guardar' },
  'common.saveChanges': { it: 'Salva modifiche', en: 'Save changes', es: 'Guardar cambios' },
  'common.add': { it: 'Aggiungi', en: 'Add', es: 'Añadir' },
  'common.delete': { it: 'Elimina', en: 'Delete', es: 'Eliminar' },
  'common.edit': { it: 'Modifica', en: 'Edit', es: 'Editar' },
  'common.ok': { it: 'OK', en: 'OK', es: 'OK' },
  'common.yes': { it: 'Sì', en: 'Yes', es: 'Sí' },
  'common.no': { it: 'No', en: 'No', es: 'No' },
  'common.confirm': { it: 'Conferma', en: 'Confirm', es: 'Confirmar' },
  'common.error': { it: 'Errore', en: 'Error', es: 'Error' },
  'common.retry': { it: 'Riprova', en: 'Retry', es: 'Reintentar' },
  'common.close': { it: 'Chiudi', en: 'Close', es: 'Cerrar' },
  'common.noDateDefault': { it: 'Nessuna scadenza', en: 'No date set', es: 'Sin fecha' },
  'common.removeDateDefault': { it: 'Rimuovi scadenza', en: 'Remove date', es: 'Quitar fecha' },
  'common.you': { it: 'Tu', en: 'You', es: 'Tú' },
  'common.networkError': {
    it: 'Impossibile contattare il server. Controlla la connessione.',
    en: 'Could not reach the server. Check your connection.',
    es: 'No se pudo contactar con el servidor. Comprueba tu conexión.',
  },
  'common.genericError': {
    it: 'Si è verificato un errore. Riprova.',
    en: 'Something went wrong. Please try again.',
    es: 'Se ha producido un error. Inténtalo de nuevo.',
  },

  // AppAlert / dialogs
  'categoryPicker.defaultTitle': { it: 'Scegli una categoria', en: 'Choose a category', es: 'Elige una categoría' },

  // RestockDialog
  'restock.title': { it: (v) => `Hai ricomprato "${v.name}"`, en: (v) => `You bought "${v.name}" again`, es: (v) => `Has vuelto a comprar "${v.name}"` },
  'restock.sameDatePrefix': { it: 'La scadenza è la stessa di prima', en: 'The expiry date is the same as before', es: 'La fecha de caducidad es la misma que antes' },
  'restock.noExpirySet': { it: ' (nessuna scadenza impostata)', en: ' (no expiry date set)', es: ' (sin fecha de caducidad)' },
  'restock.orChanged': { it: ', oppure è cambiata?', en: ', or has it changed?', es: ', ¿o ha cambiado?' },
  'restock.same': { it: 'Stessa', en: 'Same', es: 'Misma' },
  'restock.newDate': { it: 'Nuova data', en: 'New date', es: 'Nueva fecha' },
  'restock.newBatchHint': {
    it: 'Verrà aggiunta una nuova voce separata nelle scorte con questa scadenza, senza toccare quella già in giacenza.',
    en: 'A new separate entry will be added to your stock with this expiry date, without touching the one you already have.',
    es: 'Se añadirá una nueva entrada separada al inventario con esta fecha de caducidad, sin tocar la que ya tienes.',
  },
  'restock.newDateLabel': { it: 'Nuova scadenza', en: 'New expiry date', es: 'Nueva caducidad' },

  // categories
  'category.AVANZI.label': { it: 'Avanzi', en: 'Leftovers', es: 'Sobras' },
  'category.AVANZI.short': { it: 'Avanzi', en: 'Leftovers', es: 'Sobras' },
  'category.PIATTI_PRONTI.label': { it: 'Piatti pronti', en: 'Ready meals', es: 'Platos preparados' },
  'category.PIATTI_PRONTI.short': { it: 'Piatti pronti', en: 'Ready meals', es: 'Platos preparados' },
  'category.ORTOFRUTTA.label': { it: 'Ortofrutta', en: 'Fruit and vegetables', es: 'Fruta y verdura' },
  'category.ORTOFRUTTA.short': { it: 'Ortofrutta', en: 'Fruit/Veg', es: 'Fruta/Verdura' },
  'category.PASTA_CEREALI.label': { it: 'Pasta e cereali', en: 'Pasta and grains', es: 'Pasta y cereales' },
  'category.PASTA_CEREALI.short': { it: 'Pasta/Cereali', en: 'Pasta/Grains', es: 'Pasta/Cereales' },
  'category.LEGUMI.label': { it: 'Legumi', en: 'Legumes', es: 'Legumbres' },
  'category.LEGUMI.short': { it: 'Legumi', en: 'Legumes', es: 'Legumbres' },
  'category.CARNE_PESCE.label': { it: 'Carne e pesce', en: 'Meat and fish', es: 'Carne y pescado' },
  'category.CARNE_PESCE.short': { it: 'Carne/Pesce', en: 'Meat/Fish', es: 'Carne/Pescado' },
  'category.LATTICINI_UOVA.label': { it: 'Latticini e uova', en: 'Dairy and eggs', es: 'Lácteos y huevos' },
  'category.LATTICINI_UOVA.short': { it: 'Latticini/Uova', en: 'Dairy/Eggs', es: 'Lácteos/Huevos' },
  'category.SOSTITUTI_VEGETALI.label': { it: 'Sostituti vegetali', en: 'Plant-based substitutes', es: 'Sustitutos vegetales' },
  'category.SOSTITUTI_VEGETALI.short': { it: 'Sostituti veg.', en: 'Plant substitutes', es: 'Sustitutos veg.' },
  'category.CONSERVE.label': { it: 'Conserve', en: 'Canned goods', es: 'Conservas' },
  'category.CONSERVE.short': { it: 'Conserve', en: 'Canned', es: 'Conservas' },
  'category.CONDIMENTI.label': { it: 'Condimenti e spezie', en: 'Condiments and spices', es: 'Condimentos y especias' },
  'category.CONDIMENTI.short': { it: 'Condimenti', en: 'Condiments', es: 'Condimentos' },
  'category.DOLCI.label': { it: 'Dolci', en: 'Sweets', es: 'Dulces' },
  'category.DOLCI.short': { it: 'Dolci', en: 'Sweets', es: 'Dulces' },
  'category.SNACK_SALATI.label': { it: 'Snack salati', en: 'Savoury snacks', es: 'Snacks salados' },
  'category.SNACK_SALATI.short': { it: 'Snack salati', en: 'Savoury snacks', es: 'Snacks salados' },
  'category.FORNO_PASTICCERIA.label': { it: 'Forno e pasticceria', en: 'Bakery and pastry', es: 'Panadería y pastelería' },
  'category.FORNO_PASTICCERIA.short': { it: 'Forno/Pasticceria', en: 'Bakery', es: 'Panadería' },
  'category.BEVANDE.label': { it: 'Bevande', en: 'Drinks', es: 'Bebidas' },
  'category.BEVANDE.short': { it: 'Bevande', en: 'Drinks', es: 'Bebidas' },
  'category.IGIENE.label': { it: 'Igiene personale', en: 'Personal care', es: 'Higiene personal' },
  'category.IGIENE.short': { it: 'Igiene', en: 'Care', es: 'Higiene' },
  'category.CASA_PULIZIA.label': { it: 'Casa e pulizia', en: 'Home and cleaning', es: 'Casa y limpieza' },
  'category.CASA_PULIZIA.short': { it: 'Casa/Pulizia', en: 'Home/Cleaning', es: 'Casa/Limpieza' },
  'category.ANIMALI.label': { it: 'Animali', en: 'Pets', es: 'Animales' },
  'category.ANIMALI.short': { it: 'Animali', en: 'Pets', es: 'Animales' },
  'category.BEBE.label': { it: 'Bebè', en: 'Baby', es: 'Bebé' },
  'category.BEBE.short': { it: 'Bebè', en: 'Baby', es: 'Bebé' },
  'category.FARMACIA.label': { it: 'Farmacia', en: 'Pharmacy', es: 'Farmacia' },
  'category.FARMACIA.short': { it: 'Farmacia', en: 'Pharmacy', es: 'Farmacia' },
  'category.ALTRO.label': { it: 'Altro', en: 'Other', es: 'Otro' },
  'category.ALTRO.short': { it: 'Altro', en: 'Other', es: 'Otro' },

  // units
  'unit.PZ': { it: 'pz', en: 'pcs', es: 'uds' },
  'unit.KG': { it: 'kg', en: 'kg', es: 'kg' },
  'unit.G': { it: 'g', en: 'g', es: 'g' },
  'unit.L': { it: 'l', en: 'l', es: 'l' },
  'unit.ML': { it: 'ml', en: 'ml', es: 'ml' },
  'unit.CONF': { it: 'conf', en: 'pack', es: 'paq' },

  // waste types
  'waste.ORGANICO.label': { it: 'Organico', en: 'Organic', es: 'Orgánico' },
  'waste.PLASTICA.label': { it: 'Plastica', en: 'Plastic', es: 'Plástico' },
  'waste.CARTA_CARTONE.label': { it: 'Carta', en: 'Paper', es: 'Papel' },
  'waste.VETRO.label': { it: 'Vetro', en: 'Glass', es: 'Vidrio' },
  'waste.INDIFFERENZIATO.label': { it: 'Indifferenziato', en: 'General waste', es: 'Resto' },
  'waste.ALTRO.label': { it: 'Altro', en: 'Other', es: 'Otro' },

  // days of week
  'day.MONDAY.label': { it: 'Lunedì', en: 'Monday', es: 'Lunes' },
  'day.MONDAY.short': { it: 'L', en: 'M', es: 'L' },
  'day.TUESDAY.label': { it: 'Martedì', en: 'Tuesday', es: 'Martes' },
  'day.TUESDAY.short': { it: 'M', en: 'T', es: 'M' },
  'day.WEDNESDAY.label': { it: 'Mercoledì', en: 'Wednesday', es: 'Miércoles' },
  'day.WEDNESDAY.short': { it: 'M', en: 'W', es: 'X' },
  'day.THURSDAY.label': { it: 'Giovedì', en: 'Thursday', es: 'Jueves' },
  'day.THURSDAY.short': { it: 'G', en: 'T', es: 'J' },
  'day.FRIDAY.label': { it: 'Venerdì', en: 'Friday', es: 'Viernes' },
  'day.FRIDAY.short': { it: 'V', en: 'F', es: 'V' },
  'day.SATURDAY.label': { it: 'Sabato', en: 'Saturday', es: 'Sábado' },
  'day.SATURDAY.short': { it: 'S', en: 'S', es: 'S' },
  'day.SUNDAY.label': { it: 'Domenica', en: 'Sunday', es: 'Domingo' },
  'day.SUNDAY.short': { it: 'D', en: 'S', es: 'D' },

  // cleaning suggestions
  'cleaningSuggestion.bagno': { it: 'Bagno', en: 'Bathroom', es: 'Baño' },
  'cleaningSuggestion.lenzuola': { it: 'Lenzuola', en: 'Bedsheets', es: 'Sábanas' },
  'cleaningSuggestion.cameraDaLetto': { it: 'Camera da letto', en: 'Bedroom', es: 'Dormitorio' },
  'cleaningSuggestion.cucina': { it: 'Cucina', en: 'Kitchen', es: 'Cocina' },
  'cleaningSuggestion.pavimenti': { it: 'Pavimenti', en: 'Floors', es: 'Suelos' },
  'cleaningSuggestion.frigorifero': { it: 'Frigorifero', en: 'Fridge', es: 'Frigorífico' },
  'cleaningSuggestion.forno': { it: 'Forno', en: 'Oven', es: 'Horno' },
  'cleaningSuggestion.lavatrice': { it: 'Lavatrice', en: 'Washing machine', es: 'Lavadora' },
  'cleaningSuggestion.tappeti': { it: 'Tappeti', en: 'Rugs', es: 'Alfombras' },
  'cleaningSuggestion.vetriEFinestre': { it: 'Vetri e finestre', en: 'Windows', es: 'Ventanas' },
  'cleaningSuggestion.divano': { it: 'Divano', en: 'Sofa', es: 'Sofá' },
  'cleaningSuggestion.cappaCucina': { it: 'Cappa cucina', en: 'Kitchen hood', es: 'Campana extractora' },

  // notifications
  'notif.wasteReminder.title': { it: 'Tidix ti ricorda 🗑️', en: 'Tidix reminder 🗑️', es: 'Tidix te recuerda 🗑️' },
  'notif.wasteReminder.body': {
    it: (v) => `Ehi! Non dimenticare di mettere fuori il secchio ${v.type} ${v.emoji}`,
    en: (v) => `Hey! Don't forget to put out the bin for ${v.type} ${v.emoji}`,
    es: (v) => `Oye, no olvides sacar el cubo de ${v.type} ${v.emoji}`,
  },
  'notif.cleaningReminder.title': { it: 'Tidix ti ricorda 🧽', en: 'Tidix reminder 🧽', es: 'Tidix te recuerda 🧽' },
  'notif.cleaningReminder.body': {
    it: (v) => `Ehi! "${v.name}" ti aspetta: che ne dici di dargli una bella pulita domani? ✨`,
    en: (v) => `Hey! "${v.name}" is waiting for you: how about a good clean tomorrow? ✨`,
    es: (v) => `¡Oye! "${v.name}" te está esperando: ¿qué tal si le das una buena limpieza mañana? ✨`,
  },
  'notif.expiryReminder.title': { it: 'Tidix ti ricorda 👀', en: 'Tidix reminder 👀', es: 'Tidix te recuerda 👀' },
  'notif.expiryReminder.body': {
    it: (v) => `Ehi! Hai visto che ${v.name} sta per scadere? Meglio darci un'occhiata prima che sia tardi 🥲`,
    en: (v) => `Hey! Have you seen that ${v.name} is about to expire? Better take a look before it's too late 🥲`,
    es: (v) => `¡Oye! ¿Has visto que ${v.name} está a punto de caducar? Mejor échale un vistazo antes de que sea tarde 🥲`,
  },
  'notif.openedReminder.title': { it: 'Tidix ti ricorda 📦', en: 'Tidix reminder 📦', es: 'Tidix te recuerda 📦' },
  'notif.openedReminder.body': {
    it: (v) => `${v.name} è aperto da ${v.days} ${v.days === 1 ? 'giorno' : 'giorni'}: l'hai consumato?`,
    en: (v) => `${v.name} has been opened for ${v.days} ${v.days === 1 ? 'day' : 'days'}: have you used it up yet?`,
    es: (v) => `${v.name} está abierto desde hace ${v.days} ${v.days === 1 ? 'día' : 'días'}: ¿ya lo has consumido?`,
  },

  // waste type names contracted after "di" (dell'/della/del/degli), used in the Panoramica banner
  // and in the push notification body (stesso testo, vedi notif.wasteReminder.body)
  'wastePartitive.ORGANICO': { it: "dell'organico", en: 'the organic waste', es: 'el orgánico' },
  'wastePartitive.PLASTICA': { it: 'della plastica', en: 'the plastic', es: 'el plástico' },
  'wastePartitive.CARTA_CARTONE': { it: 'della carta', en: 'the paper', es: 'el papel' },
  'wastePartitive.VETRO': { it: 'del vetro', en: 'the glass', es: 'el vidrio' },
  'wastePartitive.INDIFFERENZIATO': { it: "dell'indifferenziato", en: 'the general waste', es: 'el resto' },
  'wastePartitive.ALTRO': { it: 'degli altri rifiuti', en: 'the rest', es: 'los demás residuos' },

  // ItemCard
  'itemCard.needsBuying': { it: 'Da comprare', en: 'To buy', es: 'A comprar' },
  'itemCard.openedOn': { it: (v) => `Aperto il ${v.date}`, en: (v) => `Opened on ${v.date}`, es: (v) => `Abierto el ${v.date}` },

  // ItemForm
  'itemForm.voice.permissionDenied': {
    it: 'Permesso microfono negato. Abilitalo nelle impostazioni per compilare i campi a voce.',
    en: 'Microphone permission denied. Enable it in settings to fill fields by voice.',
    es: 'Permiso de micrófono denegado. Actívalo en los ajustes para rellenar los campos por voz.',
  },
  'itemForm.voice.error': {
    it: 'Non sono riuscito a riconoscere la voce. Riprova.',
    en: "I couldn't recognize your voice. Try again.",
    es: 'No he podido reconocer la voz. Inténtalo de nuevo.',
  },
  'itemForm.voice.dateNotUnderstood': {
    it: (v) => `Non ho capito la data da "${v.text}". Inseriscila manualmente.`,
    en: (v) => `I didn't understand the date from "${v.text}". Enter it manually.`,
    es: (v) => `No he entendido la fecha de "${v.text}". Introdúcela manualmente.`,
  },
  'itemForm.name.label': { it: 'Nome prodotto', en: 'Product name', es: 'Nombre del producto' },
  'itemForm.name.placeholder': { it: 'Es. Ceci', en: 'e.g. Chickpeas', es: 'ej. Garbanzos' },
  'itemForm.location.label': { it: 'Dove si trova', en: 'Where is it', es: 'Dónde está' },
  'itemForm.newLocation': { it: 'Nuova posizione', en: 'New location', es: 'Nueva ubicación' },
  'itemForm.newLocation.namePlaceholder': { it: 'Es. Cantina', en: 'e.g. Cellar', es: 'ej. Bodega' },
  'itemForm.category.label': { it: 'Categoria', en: 'Category', es: 'Categoría' },
  'itemForm.quantity.label': { it: 'Quantità', en: 'Quantity', es: 'Cantidad' },
  'itemForm.unit.label': { it: 'Unità', en: 'Unit', es: 'Unidad' },
  'itemForm.purchaseDate.label': { it: 'Data di acquisto', en: 'Purchase date', es: 'Fecha de compra' },
  'itemForm.cookedDate.label': { it: 'Data in cui è stato cucinato', en: 'Date it was cooked', es: 'Fecha en que se cocinó' },
  'itemForm.expirationDate.label': { it: 'Scadenza (opzionale)', en: 'Expiry date (optional)', es: 'Caducidad (opcional)' },
  'itemForm.consumeWithin.label': {
    it: 'Consumare entro (opzionale)',
    en: 'Consume within (optional)',
    es: 'Consumir en (opcional)',
  },
  'itemForm.consumeWithin.placeholder': { it: 'Es. 5', en: 'E.g. 5', es: 'Ej. 5' },
  'itemForm.consumeWithin.unitDays': { it: 'Giorni', en: 'Days', es: 'Días' },
  'itemForm.consumeWithin.unitMonths': { it: 'Mesi', en: 'Months', es: 'Meses' },
  'itemForm.consumeWithin.hintReplace': {
    it: 'Prodotto senza data di scadenza stampata: indica tra quanto consumarlo, verrà usato come promemoria.',
    en: "Product without a printed expiry date: enter how long until it should be consumed, it'll be used as a reminder.",
    es: 'Producto sin fecha de caducidad impresa: indica en cuánto tiempo debe consumirse, se usará como recordatorio.',
  },
  'itemForm.consumeWithin.hintAdd': {
    it: 'Per i surgelati senza scadenza stampata: indica tra quanto consumarlo, la data di scadenza sopra verrà calcolata automaticamente.',
    en: "For frozen food without a printed expiry date: enter how long until it should be consumed, the expiry date above will be calculated automatically.",
    es: 'Para congelados sin fecha de caducidad impresa: indica en cuánto tiempo debe consumirse, la fecha de caducidad de arriba se calculará automáticamente.',
  },
  'itemForm.consumeWithinDays.guideTitle': {
    it: 'Quanto si conserva?',
    en: 'How long does it keep?',
    es: '¿Cuánto se conserva?',
  },
  'itemForm.consumeWithinDays.guide.ORTOFRUTTA': {
    it: '🥬 Verdura a foglia (insalata, spinaci): 3-5 giorni in frigo\n🍎 Frutta matura (mele, banane, agrumi): 5-7 giorni\n🥕 Ortaggi robusti (carote, zucchine, peperoni): 1-2 settimane in frigo\n🌿 Erbe fresche: 3-5 giorni in frigo\n\nQuesti sono valori indicativi: regolali in base allo stato del prodotto.',
    en: '🥬 Leafy greens (lettuce, spinach): 3-5 days in the fridge\n🍎 Ripe fruit (apples, bananas, citrus): 5-7 days\n🥕 Sturdy vegetables (carrots, zucchini, peppers): 1-2 weeks in the fridge\n🌿 Fresh herbs: 3-5 days in the fridge\n\nThese are indicative values: adjust them based on the product\'s condition.',
    es: '🥬 Verduras de hoja (lechuga, espinacas): 3-5 días en la nevera\n🍎 Fruta madura (manzanas, plátanos, cítricos): 5-7 días\n🥕 Verduras robustas (zanahorias, calabacines, pimientos): 1-2 semanas en la nevera\n🌿 Hierbas frescas: 3-5 días en la nevera\n\nEstos son valores indicativos: ajústalos según el estado del producto.',
  },
  'itemForm.consumeWithinDays.guide.AVANZI': {
    it: '🍝 Piatti cotti (pasta, riso, carne, pesce): 3-4 giorni in frigo\n🍲 Zuppe e minestre: 3-5 giorni in frigo\n❄️ Se congelati: fino a 2-3 mesi\n\nConserva sempre gli avanzi in un contenitore chiuso e raffreddali entro 2 ore dalla cottura.',
    en: '🍝 Cooked dishes (pasta, rice, meat, fish): 3-4 days in the fridge\n🍲 Soups and stews: 3-5 days in the fridge\n❄️ If frozen: up to 2-3 months\n\nAlways store leftovers in a closed container and let them cool down within 2 hours of cooking.',
    es: '🍝 Platos cocinados (pasta, arroz, carne, pescado): 3-4 días en la nevera\n🍲 Sopas y guisos: 3-5 días en la nevera\n❄️ Si están congelados: hasta 2-3 meses\n\nGuarda siempre las sobras en un recipiente cerrado y déjalas enfriar en un plazo de 2 horas tras cocinar.',
  },
  'itemForm.openedToggle': { it: 'Prodotto aperto', en: 'Product opened', es: 'Producto abierto' },
  'itemForm.openedDate.label': { it: 'Aperta il', en: 'Opened on', es: 'Abierto el' },
  'itemForm.openedReminder.label': {
    it: 'Promemoria consumo (opzionale)',
    en: 'Consumption reminder (optional)',
    es: 'Recordatorio de consumo (opcional)',
  },
  'itemForm.openedReminder.hint': {
    it: 'Se compilato, riceverai una notifica se il prodotto risulta ancora aperto dopo questo periodo.',
    en: "If filled in, you'll get a notification if the product is still opened after this period.",
    es: 'Si se rellena, recibirás una notificación si el producto sigue abierto después de este período.',
  },

  // Overview (Panoramica)
  'overview.title': { it: 'Panoramica', en: 'Overview', es: 'Resumen' },
  'overview.fab.addStockItem': { it: 'Prodotto in scorte', en: 'Product in stock', es: 'Producto en existencias' },
  'overview.fab.addFromReceipt': { it: 'Prodotti da scontrino', en: 'Products from receipt', es: 'Productos desde recibo' },
  'overview.fab.addShoppingNote': { it: 'Prodotto in lista della spesa', en: 'Product in shopping list', es: 'Producto en lista de compra' },
  'overview.fab.addExpense': { it: 'Spesa condivisa', en: 'Shared expense', es: 'Gasto compartido' },
  'overview.statProducts': { it: (v) => (v.n === 1 ? 'prodotto' : 'prodotti'), en: (v) => (v.n === 1 ? 'product' : 'products'), es: (v) => (v.n === 1 ? 'producto' : 'productos') },
  'overview.allGood': {
    it: 'Nessuna scadenza imminente. Tutto sotto controllo.',
    en: 'No upcoming expiry dates. All good.',
    es: 'Sin caducidades próximas. Todo bajo control.',
  },
  'overview.cleaningDueSection': { it: 'Pulizie da fare', en: 'Chores due', es: 'Limpiezas pendientes' },
  'overview.cleaningNeverCleaned': { it: 'Mai pulito', en: 'Never cleaned', es: 'Nunca limpiado' },
  'overview.cleaningCleanedDaysAgo': {
    it: (v) => (v.n === 1 ? `Pulito ${v.n} giorno fa` : `Pulito ${v.n} giorni fa`),
    en: (v) => (v.n === 1 ? `Cleaned ${v.n} day ago` : `Cleaned ${v.n} days ago`),
    es: (v) => (v.n === 1 ? `Limpiado hace ${v.n} día` : `Limpiado hace ${v.n} días`),
  },
  'overview.cleaningCard.allGood': { it: 'Tutto pulito! ✨', en: 'All clean! ✨', es: '¡Todo limpio! ✨' },
  'overview.avanziCard.title': { it: 'Avanzi', en: 'Leftovers', es: 'Sobras' },
  'overview.avanziCard.allGood': {
    it: 'Nessun avanzo al momento',
    en: 'No leftovers right now',
    es: 'Ninguna sobra por ahora',
  },
  'overview.avanziCard.cookedToday': { it: 'Cucinato oggi', en: 'Cooked today', es: 'Cocinado hoy' },
  'overview.avanziCard.cookedDaysAgo': {
    it: (v) => (v.n === 1 ? `Cucinato ${v.n} giorno fa` : `Cucinato ${v.n} giorni fa`),
    en: (v) => (v.n === 1 ? `Cooked ${v.n} day ago` : `Cooked ${v.n} days ago`),
    es: (v) => (v.n === 1 ? `Cocinado hace ${v.n} día` : `Cocinado hace ${v.n} días`),
  },
  'overview.openedCard.title': { it: 'Prodotti aperti', en: 'Opened products', es: 'Productos abiertos' },
  'overview.openedCard.allGood': {
    it: 'Nessun prodotto aperto al momento',
    en: 'No products opened right now',
    es: 'Ningún producto abierto por ahora',
  },
  'overview.expiringCard.title': { it: 'Prodotti in scadenza', en: 'Expiring products', es: 'Productos por caducar' },
  'overview.expiringCard.allGood': {
    it: 'Nessun prodotto in scadenza! 🎉',
    en: 'No products expiring! 🎉',
    es: '¡Ningún producto por caducar! 🎉',
  },
  'overview.shoppingLink': {
    it: (v) => (v.n === 1 ? `${v.n} prodotto da comprare` : `${v.n} prodotti da comprare`),
    en: (v) => (v.n === 1 ? `${v.n} product to buy` : `${v.n} products to buy`),
    es: (v) => (v.n === 1 ? `${v.n} producto para comprar` : `${v.n} productos para comprar`),
  },
  'overview.wasteTomorrow': {
    it: (v) => `Ehi! Non dimenticare di mettere fuori il secchio ${v.types}`,
    en: (v) => `Hey! Don't forget to put out the bin for ${v.types}`,
    es: (v) => `Oye, no olvides sacar el cubo de ${v.types}`,
  },

  // Expiry status labels (used on item cards and the expiring-products overview card)
  'expiry.expiredYesterday': { it: 'Scaduto ieri', en: 'Expired yesterday', es: 'Caducó ayer' },
  'expiry.expiredDaysAgo': { it: (v) => `Scaduto da ${v.n} giorni`, en: (v) => `Expired ${v.n} days ago`, es: (v) => `Caducó hace ${v.n} días` },
  'expiry.today': { it: 'Scade oggi', en: 'Expires today', es: 'Caduca hoy' },
  'expiry.tomorrow': { it: 'Scade domani', en: 'Expires tomorrow', es: 'Caduca mañana' },
  'expiry.inDays': { it: (v) => `Scade tra ${v.n} giorni`, en: (v) => `Expires in ${v.n} days`, es: (v) => `Caduca en ${v.n} días` },

  // Zones (Panoramica)
  'zone.title': { it: 'Le zone', en: 'Zones', es: 'Zonas' },
  'zone.add': { it: 'Aggiungi zona', en: 'Add zone', es: 'Añadir zona' },
  'zone.namePlaceholder': { it: 'Es. Cantina', en: 'e.g. Cellar', es: 'ej. Bodega' },
  'zone.emojiHint': {
    it: "L'emoji è opzionale: puoi incollarne una o lasciare vuoto (📦 di default).",
    en: 'The emoji is optional: paste one in or leave it empty (📦 by default).',
    es: 'El emoji es opcional: pega uno o déjalo vacío (📦 por defecto).',
  },
  'zone.colorLabel': { it: 'Colore', en: 'Color', es: 'Color' },
  'zone.confirmDeleteTitle': { it: 'Elimina zona', en: 'Delete zone', es: 'Eliminar zona' },
  'zone.confirmDeleteMessage': {
    it: (v) => `Rimuovere "${v.name}"? È possibile solo se non ci sono più prodotti lì.`,
    en: (v) => `Remove "${v.name}"? Only possible if there are no more products there.`,
    es: (v) => `¿Eliminar "${v.name}"? Solo es posible si ya no hay productos allí.`,
  },

  // Shopping list
  'shopping.title': { it: 'Lista della spesa', en: 'Shopping list', es: 'Lista de la compra' },
  'shopping.addPlaceholder': { it: 'Aggiungi cosa comprare...', en: 'Add something to buy...', es: 'Añade algo para comprar...' },
  'shopping.emptyTitle': { it: 'La lista è vuota', en: 'The list is empty', es: 'La lista está vacía' },
  'shopping.emptySubtitle': {
    it: 'I prodotti finiti vengono aggiunti qui automaticamente. Puoi anche aggiungere cose da comprare a mano.',
    en: 'Products that run out are added here automatically. You can also add things to buy manually.',
    es: 'Los productos agotados se añaden aquí automáticamente. También puedes añadir cosas para comprar a mano.',
  },
  'shopping.purchasedSection': { it: 'Acquistato · da aggiungere alle scorte', en: 'Purchased · to add to stock', es: 'Comprado · para añadir al inventario' },
  'shopping.addToStock': { it: 'Aggiungi a scorte', en: 'Add to stock', es: 'Añadir al inventario' },
  'shopping.categoryPickerTitle': { it: 'Categoria della voce', en: 'Item category', es: 'Categoría del artículo' },
  'shopping.addProductButton': { it: 'Aggiungi prodotto', en: 'Add product', es: 'Añadir producto' },
  'shopping.purchasedBanner': {
    it: (v) => (v.n === 1 ? '1 prodotto acquistato da aggiungere alle scorte' : `${v.n} prodotti acquistati da aggiungere alle scorte`),
    en: (v) => (v.n === 1 ? '1 purchased product to add to stock' : `${v.n} purchased products to add to stock`),
    es: (v) => (v.n === 1 ? '1 producto comprado para añadir al inventario' : `${v.n} productos comprados para añadir al inventario`),
  },

  'shoppingNote.new.title': { it: 'Nuovo prodotto', en: 'New product', es: 'Nuevo producto' },
  'shoppingNote.edit.title': { it: 'Modifica prodotto', en: 'Edit product', es: 'Editar producto' },
  'shoppingNote.new.nameLabel': { it: 'Nome', en: 'Name', es: 'Nombre' },
  'shoppingNote.new.namePlaceholder': { it: 'Es. Ceci', en: 'E.g. Chickpeas', es: 'Ej. Garbanzos' },
  'shoppingNote.new.detailLabel': { it: 'Quantità / dettagli', en: 'Quantity / details', es: 'Cantidad / detalles' },
  'shoppingNote.new.detailPlaceholder': { it: 'Es. 2 confezioni...', en: 'E.g. 2 packs...', es: 'Ej. 2 paquetes...' },
  'shoppingNote.new.categoryLabel': { it: 'Categoria (opzionale)', en: 'Category (optional)', es: 'Categoría (opcional)' },
  'shoppingNote.new.saveButton': { it: 'Aggiungi alla lista', en: 'Add to list', es: 'Añadir a la lista' },
  'shoppingNote.confirmDeleteTitle': { it: 'Rimuovi prodotto', en: 'Remove product', es: 'Eliminar producto' },
  'shoppingNote.confirmDeleteMessage': {
    it: 'Rimuovere questo prodotto dalla lista della spesa?',
    en: 'Remove this product from the shopping list?',
    es: '¿Eliminar este producto de la lista de compra?',
  },

  'purchased.title': { it: 'Acquistati', en: 'Purchased', es: 'Comprados' },
  'purchased.emptyTitle': { it: 'Nessun prodotto acquistato', en: 'No purchased products', es: 'Ningún producto comprado' },
  'purchased.emptySubtitle': {
    it: 'Quando spunti una voce nella lista della spesa la trovi qui, pronta per essere aggiunta alle scorte.',
    en: 'When you check off an item in the shopping list you\'ll find it here, ready to be added to stock.',
    es: 'Cuando marques un artículo en la lista de la compra lo encontrarás aquí, listo para añadir al inventario.',
  },

  // Cleaning
  'cleaning.addToggle': { it: 'Aggiungi ambiente', en: 'Add room', es: 'Añadir espacio' },
  'cleaning.searchPlaceholder': { it: 'Cerca un ambiente...', en: 'Search a room...', es: 'Busca un espacio...' },
  'cleaning.nameLabel': { it: 'Nome', en: 'Name', es: 'Nombre' },
  'cleaning.namePlaceholder': { it: 'Es. Bagno, Forno, Frigorifero...', en: 'e.g. Bathroom, Oven, Fridge...', es: 'ej. Baño, Horno, Frigorífico...' },
  'cleaning.suggestionsLabel': { it: 'Suggerimenti', en: 'Suggestions', es: 'Sugerencias' },
  'cleaning.frequencyLabel': { it: 'Ogni quanti giorni pulirlo', en: 'How often to clean it (days)', es: 'Cada cuántos días limpiarlo' },
  'cleaning.frequencyPlaceholder': { it: 'Es. 7', en: 'e.g. 7', es: 'ej. 7' },
  'cleaning.lastCleanedLabel': { it: 'Ultima volta pulito', en: 'Last cleaned', es: 'Última vez limpiado' },
  'cleaning.lastCleanedPlaceholder': { it: 'Non pulito di recente', en: 'Not recently cleaned', es: 'No limpiado recientemente' },
  'cleaning.lastCleanedClear': { it: 'Non lo so / rimuovi data', en: "Don't know / remove date", es: 'No lo sé / quitar fecha' },
  'cleaning.emptyTitle': { it: 'Nessun ambiente monitorato', en: 'No rooms being tracked', es: 'Ningún espacio monitorizado' },
  'cleaning.emptySubtitle': {
    it: 'Aggiungi un ambiente o elettrodomestico per tenere traccia di quando è stato pulito.',
    en: 'Add a room or appliance to keep track of when it was last cleaned.',
    es: 'Añade un espacio o electrodoméstico para llevar el control de cuándo se limpió.',
  },
  'cleaning.everyDaysShort': { it: (v) => `ogni ${v.n}gg`, en: (v) => `every ${v.n}d`, es: (v) => `cada ${v.n}d` },
  'cleaning.neverCleaned': { it: 'Mai pulito', en: 'Never cleaned', es: 'Nunca limpiado' },
  'cleaning.cleanedToday': { it: 'Pulito oggi', en: 'Cleaned today', es: 'Limpiado hoy' },
  'cleaning.cleanedDaysAgo': {
    it: (v) => (v.n === 1 ? `Pulito ${v.n} giorno fa` : `Pulito ${v.n} giorni fa`),
    en: (v) => (v.n === 1 ? `Cleaned ${v.n} day ago` : `Cleaned ${v.n} days ago`),
    es: (v) => (v.n === 1 ? `Limpiado hace ${v.n} día` : `Limpiado hace ${v.n} días`),
  },
  'cleaning.everyDaysSuffix': { it: (v) => ` · ogni ${v.n} gg`, en: (v) => ` · every ${v.n} days`, es: (v) => ` · cada ${v.n} días` },
  'cleaning.overdue': { it: 'Da pulire', en: 'Overdue', es: 'Pendiente' },
  'cleaning.toCleanSection': { it: 'Da pulire', en: 'To clean', es: 'Por limpiar' },
  'cleaning.doneSection': { it: 'Pulite', en: 'Done', es: 'Limpiadas' },
  'cleaning.confirmDeleteTitle': { it: 'Elimina', en: 'Delete', es: 'Eliminar' },
  'cleaning.confirmDeleteMessage': {
    it: (v) => `Rimuovere "${v.name}" dalla lista pulizia?`,
    en: (v) => `Remove "${v.name}" from the cleaning list?`,
    es: (v) => `¿Quitar "${v.name}" de la lista de limpieza?`,
  },

  // Waste
  'waste.intro': {
    it: 'Segna i giorni in cui il tuo comune raccoglie ogni tipo di rifiuto. La sera prima riceverai un promemoria per mettere fuori il secchio.',
    en: 'Mark the days your municipality collects each type of waste. You will get a reminder the evening before to put the bin out.',
    es: 'Marca los días en que tu ayuntamiento recoge cada tipo de residuo. Recibirás un recordatorio la noche anterior para sacar el cubo.',
  },
  'waste.errorTitle': { it: 'Rifiuti', en: 'Waste', es: 'Basura' },

  // Navigation
  'nav.overview': { it: 'Panoramica', en: 'Overview', es: 'Resumen' },
  'nav.stock': { it: 'Scorte', en: 'Stock', es: 'Inventario' },
  'nav.shopping': { it: 'Lista Spesa', en: 'Shopping', es: 'Compra' },
  'nav.more': { it: 'Altro', en: 'More', es: 'Más' },

  // Stock
  'stock.title': { it: 'Le tue scorte', en: 'Your stock', es: 'Tu inventario' },
  'stock.searchPlaceholder': { it: 'Cerca un prodotto...', en: 'Search a product...', es: 'Buscar un producto...' },
  'stock.filterAll': { it: 'Tutti', en: 'All', es: 'Todos' },
  'stock.openedFilter': { it: (v) => `Aperti (${v.n})`, en: (v) => `Opened (${v.n})`, es: (v) => `Abiertos (${v.n})` },
  'stock.sortLabel': { it: 'Ordina per', en: 'Sort by', es: 'Ordenar por' },
  'stock.filterLabel': { it: 'Filtra per', en: 'Filter by', es: 'Filtrar por' },
  'stock.sortByName': { it: 'Categoria', en: 'Category', es: 'Categoría' },
  'stock.sortByPurchaseDate': { it: 'Data di acquisto', en: 'Purchase date', es: 'Fecha de compra' },
  'stock.sortByExpirationDate': { it: 'Data di scadenza', en: 'Expiry date', es: 'Fecha de caducidad' },
  'stock.emptyTitle': { it: 'Nessun prodotto trovato', en: 'No products found', es: 'No se encontraron productos' },
  'stock.emptySubtitle': {
    it: 'Prova a modificare la ricerca o aggiungi un nuovo prodotto.',
    en: 'Try changing your search or add a new product.',
    es: 'Prueba a cambiar la búsqueda o añade un nuevo producto.',
  },
  'stock.outOfStockTitle': { it: 'Scorta finita', en: 'Out of stock', es: 'Sin existencias' },
  'stock.outOfStockMessage': {
    it: (v) => `"${v.name}" è finita. Vuoi aggiungerla alla lista della spesa?`,
    en: (v) => `"${v.name}" ran out. Do you want to add it to the shopping list?`,
    es: (v) => `"${v.name}" se ha acabado. ¿Quieres añadirlo a la lista de la compra?`,
  },
  'stock.removeOpenedTitle': { it: 'Confezione aperta', en: 'Opened package', es: 'Envase abierto' },
  'stock.removeOpenedMessage': {
    it: (v) => `"${v.name}" è segnato come aperto. Stai togliendo proprio la confezione aperta?`,
    en: (v) => `"${v.name}" is marked as opened. Are you removing the opened package?`,
    es: (v) => `"${v.name}" está marcado como abierto. ¿Estás quitando el envase abierto?`,
  },

  // More screen
  'more.title': { it: 'Altro', en: 'More', es: 'Más' },
  'more.cleaning.label': { it: 'Pulizia', en: 'Cleaning', es: 'Limpieza' },
  'more.cleaning.subtitle': { it: 'Ambienti ed elettrodomestici', en: 'Rooms and appliances', es: 'Espacios y electrodomésticos' },
  'more.waste.label': { it: 'Rifiuti', en: 'Waste', es: 'Basura' },
  'more.waste.subtitle': { it: 'Raccolta differenziata giornaliera', en: 'Daily recycling collection', es: 'Recogida selectiva diaria' },
  'more.expenses.label': { it: 'Spese', en: 'Expenses', es: 'Gastos' },
  'more.expenses.subtitle': { it: 'Chi ha pagato cosa, riepilogo mensile', en: 'Who paid what, monthly summary', es: 'Quién pagó qué, resumen mensual' },
  'more.locations.label': { it: 'Posizioni', en: 'Locations', es: 'Ubicaciones' },
  'more.locations.subtitle': { it: 'Frigorifero, freezer, dispensa e altre', en: 'Fridge, freezer, pantry and more', es: 'Nevera, congelador, despensa y más' },
  'more.household.label': { it: 'Famiglia', en: 'Household', es: 'Familia' },
  'more.household.subtitle': {
    it: 'Membri, codice invito e impostazioni',
    en: 'Members, invite code and settings',
    es: 'Miembros, código de invitación y ajustes',
  },
  'more.purchased.label': { it: 'Acquistati', en: 'Purchased', es: 'Comprados' },
  'more.purchased.subtitle': {
    it: 'Prodotti comprati da aggiungere alle scorte',
    en: 'Purchased products to add to stock',
    es: 'Productos comprados para añadir al inventario',
  },

  // App layout (stack screen titles)
  'appLayout.newProduct': { it: 'Nuovo prodotto', en: 'New product', es: 'Nuevo producto' },
  'appLayout.editProduct': { it: 'Modifica prodotto', en: 'Edit product', es: 'Editar producto' },
  'appLayout.newCleaningTask': { it: 'Nuova pulizia', en: 'New cleaning task', es: 'Nueva limpieza' },
  'appLayout.editCleaningTask': { it: 'Modifica pulizia', en: 'Edit cleaning task', es: 'Editar limpieza' },
  'appLayout.newExpense': { it: 'Nuova spesa', en: 'New expense', es: 'Nuevo gasto' },
  'appLayout.editExpense': { it: 'Modifica spesa', en: 'Edit expense', es: 'Editar gasto' },
  'appLayout.newZone': { it: 'Nuova zona', en: 'New zone', es: 'Nueva zona' },
  'appLayout.editZone': { it: 'Modifica zona', en: 'Edit zone', es: 'Editar zona' },
  'appLayout.household': { it: 'La tua famiglia', en: 'Your household', es: 'Tu familia' },
  'appLayout.purchased': { it: 'Acquistati', en: 'Purchased', es: 'Comprados' },
  'appLayout.scanReceipt': { it: 'Aggiungi da scontrino', en: 'Add from receipt', es: 'Añadir desde recibo' },

  // Scan receipt
  'scanReceipt.intro': {
    it: 'Fotografa lo scontrino della spesa: i prodotti riconosciuti verranno proposti per essere aggiunti alle scorte.',
    en: 'Take a photo of your shopping receipt: the recognized products will be suggested for adding to your stock.',
    es: 'Fotografía el recibo de la compra: los productos reconocidos se propondrán para añadir a tus existencias.',
  },
  'scanReceipt.takePhoto': { it: 'Scatta foto', en: 'Take photo', es: 'Hacer foto' },
  'scanReceipt.pickFromGallery': { it: 'Scegli dalla galleria', en: 'Pick from gallery', es: 'Elegir de la galería' },
  'scanReceipt.recognizing': { it: 'Lettura dello scontrino in corso...', en: 'Reading the receipt...', es: 'Leyendo el recibo...' },
  'scanReceipt.retake': { it: 'Rifai foto', en: 'Retake photo', es: 'Repetir foto' },
  'scanReceipt.itemsTitle': { it: 'Prodotti riconosciuti', en: 'Recognized products', es: 'Productos reconocidos' },
  'scanReceipt.itemsHint': {
    it: "Tocca la matita per aggiungere un prodotto alle scorte scegliendo zona e categoria, oppure la X per scartare una riga che non è un prodotto.",
    en: 'Tap the pencil to add a product to stock choosing its zone and category, or the X to discard a line that is not a product.',
    es: 'Toca el lápiz para añadir un producto a existencias eligiendo zona y categoría, o la X para descartar una línea que no es un producto.',
  },
  'scanReceipt.noItemsFound': {
    it: 'Non è stato riconosciuto nessun prodotto in questa foto. Prova a rifare la foto con più luce e a inquadrare bene lo scontrino.',
    en: 'No products were recognized in this photo. Try retaking it with more light and framing the receipt well.',
    es: 'No se ha reconocido ningún producto en esta foto. Intenta repetirla con más luz y encuadrando bien el recibo.',
  },
  'scanReceipt.allDone': {
    it: 'Hai gestito tutti i prodotti riconosciuti in questo scontrino.',
    en: "You've handled all the products recognized in this receipt.",
    es: 'Has gestionado todos los productos reconocidos en este recibo.',
  },
  'scanReceipt.backToOverview': { it: 'Torna alla Panoramica', en: 'Back to Overview', es: 'Volver a la Panorámica' },
  'scanReceipt.cameraPermissionDenied': {
    it: 'Permesso fotocamera negato. Abilitalo dalle impostazioni del telefono per scattare una foto allo scontrino.',
    en: 'Camera permission denied. Enable it from your phone settings to take a photo of the receipt.',
    es: 'Permiso de cámara denegado. Actívalo desde los ajustes del teléfono para fotografiar el recibo.',
  },
  'scanReceipt.libraryPermissionDenied': {
    it: 'Permesso galleria negato. Abilitalo dalle impostazioni del telefono per scegliere una foto.',
    en: 'Gallery permission denied. Enable it from your phone settings to pick a photo.',
    es: 'Permiso de galería denegado. Actívalo desde los ajustes del teléfono para elegir una foto.',
  },
  'scanReceipt.recognizeError': {
    it: "Non sono riuscito a leggere questa immagine. Riprova con un'altra foto.",
    en: "I couldn't read this image. Please try another photo.",
    es: 'No he podido leer esta imagen. Prueba con otra foto.',
  },
  'scanProduct.title': { it: 'Scansiona prodotto', en: 'Scan product', es: 'Escanear producto' },
  'scanProduct.hint': {
    it: "Fotografa il prodotto (fino a 2 foto, es. fronte confezione e data di scadenza): nome e scadenza verranno compilati automaticamente.",
    en: 'Photograph the product (up to 2 photos, e.g. package front and expiry date): name and expiry will be filled in automatically.',
    es: 'Fotografía el producto (hasta 2 fotos, ej. frente del envase y fecha de caducidad): el nombre y la caducidad se rellenarán automáticamente.',
  },
  'scanProduct.pickFromGallery': { it: 'Scegli dalla galleria', en: 'Pick from gallery', es: 'Elegir de la galería' },
  'scanProduct.analyze': { it: 'Analizza foto', en: 'Analyze photos', es: 'Analizar fotos' },
  'scanProduct.resultTitle': { it: 'Prodotto riconosciuto', en: 'Product recognized', es: 'Producto reconocido' },
  'scanProduct.resultMessage': {
    it: 'Nome e/o data di scadenza compilati: controllali prima di salvare.',
    en: 'Name and/or expiry date filled in: check them before saving.',
    es: 'Nombre y/o fecha de caducidad rellenados: compruébalos antes de guardar.',
  },
  'scanProduct.noDataFound': {
    it: 'Non sono riuscito a riconoscere nome o scadenza in queste foto. Prova con più luce e inquadrando bene etichetta e data.',
    en: "I couldn't recognize a name or expiry date in these photos. Try with more light, framing the label and date well.",
    es: 'No he podido reconocer nombre o caducidad en estas fotos. Prueba con más luz, encuadrando bien la etiqueta y la fecha.',
  },
  'scanProduct.recognizeError': {
    it: "Non sono riuscito a leggere queste immagini. Riprova con un'altra foto.",
    en: "I couldn't read these images. Please try another photo.",
    es: 'No he podido leer estas imágenes. Prueba con otra foto.',
  },
  'scanProduct.cameraPermissionDenied': {
    it: 'Permesso fotocamera negato. Abilitalo dalle impostazioni del telefono per fotografare il prodotto.',
    en: 'Camera permission denied. Enable it from your phone settings to photograph the product.',
    es: 'Permiso de cámara denegado. Actívalo desde los ajustes del teléfono para fotografiar el producto.',
  },
  'scanProduct.libraryPermissionDenied': {
    it: 'Permesso galleria negato. Abilitalo dalle impostazioni del telefono per scegliere una foto.',
    en: 'Gallery permission denied. Enable it from your phone settings to pick a photo.',
    es: 'Permiso de galería denegado. Actívalo desde los ajustes del teléfono para elegir una foto.',
  },

  // Expenses
  'month.1': { it: 'Gennaio', en: 'January', es: 'Enero' },
  'month.2': { it: 'Febbraio', en: 'February', es: 'Febrero' },
  'month.3': { it: 'Marzo', en: 'March', es: 'Marzo' },
  'month.4': { it: 'Aprile', en: 'April', es: 'Abril' },
  'month.5': { it: 'Maggio', en: 'May', es: 'Mayo' },
  'month.6': { it: 'Giugno', en: 'June', es: 'Junio' },
  'month.7': { it: 'Luglio', en: 'July', es: 'Julio' },
  'month.8': { it: 'Agosto', en: 'August', es: 'Agosto' },
  'month.9': { it: 'Settembre', en: 'September', es: 'Septiembre' },
  'month.10': { it: 'Ottobre', en: 'October', es: 'Octubre' },
  'month.11': { it: 'Novembre', en: 'November', es: 'Noviembre' },
  'month.12': { it: 'Dicembre', en: 'December', es: 'Diciembre' },
  'expenses.total': { it: 'Totale', en: 'Total', es: 'Total' },
  'expenses.inPari': { it: 'In pari', en: 'Settled up', es: 'Al día' },
  'expenses.deveRicevere': { it: (v) => `Deve ricevere ${v.amount} €`, en: (v) => `Gets back ${v.amount} €`, es: (v) => `Recibe ${v.amount} €` },
  'expenses.deveDare': { it: (v) => `Deve dare ${v.amount} €`, en: (v) => `Owes ${v.amount} €`, es: (v) => `Debe ${v.amount} €` },
  'expenses.addToggleAdd': { it: 'Aggiungi spesa', en: 'Add expense', es: 'Añadir gasto' },
  'expenses.descriptionLabel': { it: 'Descrizione', en: 'Description', es: 'Descripción' },
  'expenses.descriptionPlaceholder': { it: 'Es. Spesa supermercato', en: 'e.g. Grocery shopping', es: 'ej. Compra del supermercado' },
  'expenses.amountLabel': { it: 'Importo (€)', en: 'Amount (€)', es: 'Importe (€)' },
  'expenses.dateLabel': { it: 'Data della spesa', en: 'Expense date', es: 'Fecha del gasto' },
  'expenses.datePlaceholder': { it: 'Seleziona una data', en: 'Select a date', es: 'Selecciona una fecha' },
  'expenses.paidByLabel': { it: 'Pagato da', en: 'Paid by', es: 'Pagado por' },
  'expenses.splitWithLabel': { it: 'Dividi con', en: 'Split with', es: 'Dividir con' },
  'expenses.equalSplitToggle': { it: 'Dividi in parti uguali', en: 'Split equally', es: 'Dividir a partes iguales' },
  'expenses.alreadyPaidLabel': { it: 'Quota già versata', en: 'Share already paid', es: 'Parte ya pagada' },
  'expenses.alreadyPaidHint': {
    it: 'Indica quanto ognuno ha versato, anche se non corrisponde esattamente alla quota.',
    en: 'Enter how much each person has paid, even if it does not exactly match their share.',
    es: 'Indica cuánto ha aportado cada uno, aunque no coincida exactamente con su parte.',
  },
  'expenses.alreadyPaidFull': { it: 'Ha saldato per intero', en: 'Paid in full', es: 'Ha pagado por completo' },
  'expenses.percentagesLabel': { it: 'Percentuale (la somma deve essere 100)', en: 'Percentage (must add up to 100)', es: 'Porcentaje (la suma debe ser 100)' },
  'expenses.percentagesErrorTitle': { it: 'Spese', en: 'Expenses', es: 'Gastos' },
  'expenses.percentagesError': {
    it: (v) => `Le percentuali devono sommare a 100 (attualmente ${v.sum}).`,
    en: (v) => `Percentages must add up to 100 (currently ${v.sum}).`,
    es: (v) => `Los porcentajes deben sumar 100 (actualmente ${v.sum}).`,
  },
  'expenses.saveExpense': { it: 'Salva spesa', en: 'Save expense', es: 'Guardar gasto' },
  'expenses.confirmDeleteTitle': { it: 'Elimina spesa', en: 'Delete expense', es: 'Eliminar gasto' },
  'expenses.confirmDeleteMessage': {
    it: 'Vuoi eliminare definitivamente questa spesa?',
    en: 'Do you want to permanently delete this expense?',
    es: '¿Quieres eliminar definitivamente este gasto?',
  },
  'expenses.emptyTitle': { it: 'Nessuna spesa questo mese', en: 'No expenses this month', es: 'Sin gastos este mes' },
  'expenses.emptySubtitle': { it: 'Aggiungi la prima spesa condivisa.', en: 'Add the first shared expense.', es: 'Añade el primer gasto compartido.' },
  'expenses.paidOfTotal': { it: (v) => `${v.paid} di ${v.total} €`, en: (v) => `${v.paid} of ${v.total} €`, es: (v) => `${v.paid} de ${v.total} €` },
  'expenses.settledByBalance': { it: 'Già coperto dal saldo', en: 'Already covered by balance', es: 'Ya cubierto por el saldo' },
  'expenses.settleTitle': { it: (v) => `Registra pagamento di ${v.name}`, en: (v) => `Record payment from ${v.name}`, es: (v) => `Registrar pago de ${v.name}` },
  'expenses.markPaymentButton': { it: 'Segna pagamento', en: 'Mark payment', es: 'Marcar pago' },
  'expenses.settleHint': {
    it: 'L\'importo verrà usato per saldare le quote non pagate, dalla spesa più vecchia alla più recente.',
    en: 'The amount will be used to settle unpaid shares, from the oldest expense to the most recent.',
    es: 'El importe se usará para saldar las cuotas no pagadas, desde el gasto más antiguo al más reciente.',
  },
  'expenses.settleAmountLabel': { it: 'Importo versato (€)', en: 'Amount paid (€)', es: 'Importe pagado (€)' },
  'expenses.settleConfirm': { it: 'Registra pagamento', en: 'Record payment', es: 'Registrar pago' },
  'expenses.settleSuccess': {
    it: (v) => `Pagamento allocato su ${v.n} ${v.n === 1 ? 'spesa' : 'spese'}.`,
    en: (v) => `Payment allocated across ${v.n} ${v.n === 1 ? 'expense' : 'expenses'}.`,
    es: (v) => `Pago asignado a ${v.n} ${v.n === 1 ? 'gasto' : 'gastos'}.`,
  },
  'expenses.settleSuccessWithLeftover': {
    it: (v) => `Pagamento allocato su ${v.n} ${v.n === 1 ? 'spesa' : 'spese'}. Avanzano ${v.leftover} € non dovuti.`,
    en: (v) => `Payment allocated across ${v.n} ${v.n === 1 ? 'expense' : 'expenses'}. ${v.leftover} € left over, not owed.`,
    es: (v) => `Pago asignado a ${v.n} ${v.n === 1 ? 'gasto' : 'gastos'}. Sobran ${v.leftover} € no adeudados.`,
  },

  // Household
  'household.inviteCodeLabel': { it: 'Codice invito', en: 'Invite code', es: 'Código de invitación' },
  'household.inviteCodeHint': {
    it: 'Condividi questo codice con un familiare per farlo entrare nella famiglia.',
    en: 'Share this code with a family member so they can join the household.',
    es: 'Comparte este código con un familiar para que se una a la familia.',
  },
  'household.shareCodeButton': { it: 'Condividi codice', en: 'Share code', es: 'Compartir código' },
  'household.shareMessage': {
    it: (v) => `Unisciti alla nostra famiglia su Tidix! Codice invito: ${v.code}`,
    en: (v) => `Join our household on Tidix! Invite code: ${v.code}`,
    es: (v) => `¡Únete a nuestra familia en Tidix! Código de invitación: ${v.code}`,
  },
  'household.membersLabel': { it: (v) => `Membri (${v.n})`, en: (v) => `Members (${v.n})`, es: (v) => `Miembros (${v.n})` },
  'household.youSuffix': { it: ' (tu)', en: ' (you)', es: ' (tú)' },
  'household.namePlaceholder': { it: 'Nome famiglia', en: 'Household name', es: 'Nombre de la familia' },
  'household.leaveFamily': { it: 'Esci dalla famiglia', en: 'Leave household', es: 'Salir de la familia' },
  'household.leaveAccount': { it: "Esci dall'account", en: 'Log out', es: 'Cerrar sesión' },
  'household.cannotLeaveYetTitle': { it: 'Non puoi ancora uscire', en: "You can't leave yet", es: 'Aún no puedes salir' },
  'household.cannotLeaveYetMessage': {
    it: 'Sei il creatore della famiglia: rimuovi prima tutti gli altri membri per poter uscire.',
    en: 'You are the household creator: remove all other members first before you can leave.',
    es: 'Eres el creador de la familia: elimina primero a todos los demás miembros para poder salir.',
  },
  'household.leaveSoleMemberMessage': {
    it: "Sei l'unico membro rimasto: uscendo, la famiglia e tutti i suoi dati verranno eliminati definitivamente. Continuare?",
    en: 'You are the only remaining member: leaving will permanently delete the household and all its data. Continue?',
    es: 'Eres el único miembro que queda: al salir, la familia y todos sus datos se eliminarán definitivamente. ¿Continuar?',
  },
  'household.leaveConfirmMessage': {
    it: (v) => `Sei sicuro di voler uscire dalla famiglia "${v.name}"?`,
    en: (v) => `Are you sure you want to leave the household "${v.name}"?`,
    es: (v) => `¿Seguro que quieres salir de la familia "${v.name}"?`,
  },
  'household.leaveButton': { it: 'Esci', en: 'Leave', es: 'Salir' },
  'household.removeMemberTitle': { it: 'Rimuovi membro', en: 'Remove member', es: 'Eliminar miembro' },
  'household.removeMemberMessage': {
    it: (v) => `Rimuovere ${v.name} dalla famiglia?`,
    en: (v) => `Remove ${v.name} from the household?`,
    es: (v) => `¿Eliminar a ${v.name} de la familia?`,
  },
  'household.removeButton': { it: 'Rimuovi', en: 'Remove', es: 'Eliminar' },
  'household.makeAdminTitle': { it: 'Rendi amministratore', en: 'Make admin', es: 'Hacer administrador' },
  'household.makeAdminMessage': {
    it: (v) => `Rendere ${v.name} il nuovo amministratore della famiglia? Perderai i permessi di amministratore.`,
    en: (v) => `Make ${v.name} the new household admin? You will lose admin permissions.`,
    es: (v) => `¿Hacer a ${v.name} el nuevo administrador de la familia? Perderás los permisos de administrador.`,
  },
  'household.makeAdminButton': { it: 'Rendi amministratore', en: 'Make admin', es: 'Hacer administrador' },
  'household.settingsTitle': { it: 'Impostazioni', en: 'Settings', es: 'Ajustes' },
  'household.languageLabel': { it: 'Lingua', en: 'Language', es: 'Idioma' },
  'household.themeLabel': { it: 'Aspetto', en: 'Appearance', es: 'Apariencia' },
  'household.themeLight': { it: 'Chiaro', en: 'Light', es: 'Claro' },
  'household.themeDark': { it: 'Scuro', en: 'Dark', es: 'Oscuro' },
  'household.notificationsLabel': { it: 'Notifiche', en: 'Notifications', es: 'Notificaciones' },
  'household.notificationsHint': {
    it: 'Per ricevere notifiche su prodotti scaduti, pulizie da fare, raccolta rifiuti e altro, vai nelle impostazioni del telefono e attiva le notifiche per Tidix.',
    en: 'To receive notifications about expired products, chores due, waste collection and more, go to your phone settings and enable notifications for Tidix.',
    es: 'Para recibir notificaciones sobre productos caducados, limpiezas pendientes, recogida de basura y más, ve a los ajustes del teléfono y activa las notificaciones para Tidix.',
  },
  'household.notificationsGranted': { it: 'Attive ✓', en: 'Enabled ✓', es: 'Activadas ✓' },
  'household.notificationsUndetermined': {
    it: 'Non ancora attivate',
    en: 'Not enabled yet',
    es: 'Aún no activadas',
  },
  'household.notificationsDenied': {
    it: 'Disattivate: i promemoria di scadenze, pulizie e rifiuti non arriveranno',
    en: 'Disabled: expiry, cleaning and waste reminders will not arrive',
    es: 'Desactivadas: los avisos de caducidad, limpieza y basura no llegarán',
  },
  'household.notificationsEnableButton': { it: 'Attiva notifiche', en: 'Enable notifications', es: 'Activar notificaciones' },
  'household.notificationsOpenSettingsButton': {
    it: 'Apri impostazioni del telefono',
    en: 'Open phone settings',
    es: 'Abrir ajustes del teléfono',
  },
  'household.notificationsWebHint': {
    it: 'Le notifiche non sono disponibili sulla versione web: installa l\'app sul telefono per ricevere i promemoria su prodotti scaduti, pulizie da fare, raccolta rifiuti e altro.',
    en: 'Notifications are not available on the web version: install the app on your phone to receive reminders about expired products, chores due, waste collection and more.',
    es: 'Las notificaciones no están disponibles en la versión web: instala la app en tu teléfono para recibir avisos sobre productos caducados, limpiezas pendientes, recogida de basura y más.',
  },
  'household.categoriesTitle': { it: 'Categorie prodotti', en: 'Product categories', es: 'Categorías de productos' },
  'household.categoriesHint': {
    it: 'Disattiva le categorie che non usi: non compariranno più tra le scelte disponibili.',
    en: "Turn off categories you don't use: they will no longer appear as available choices.",
    es: 'Desactiva las categorías que no usas: ya no aparecerán entre las opciones disponibles.',
  },

  // Locations
  'locations.addToggle': { it: 'Aggiungi posizione', en: 'Add location', es: 'Añadir ubicación' },
  'locations.emojiHint': {
    it: "L'emoji è opzionale: puoi incollarne una o lasciare vuoto (📦 di default).",
    en: 'The emoji is optional: paste one in or leave it empty (📦 by default).',
    es: 'El emoji es opcional: pega uno o déjalo vacío (📦 por defecto).',
  },
  'locations.emptyTitle': { it: 'Nessuna posizione', en: 'No locations', es: 'Sin ubicaciones' },
  'locations.confirmDeleteTitle': { it: 'Elimina posizione', en: 'Delete location', es: 'Eliminar ubicación' },
  'locations.confirmDeleteMessage': {
    it: (v) => `Rimuovere "${v.name}"? È possibile solo se non ci sono più prodotti lì.`,
    en: (v) => `Remove "${v.name}"? Only possible if there are no more products there.`,
    es: (v) => `¿Eliminar "${v.name}"? Solo es posible si ya no hay productos allí.`,
  },

  // Item detail
  'item.confirmDeleteTitle': { it: 'Elimina prodotto', en: 'Delete product', es: 'Eliminar producto' },
  'item.confirmDeleteMessage': {
    it: "Vuoi eliminarlo e basta, oppure hai finito il prodotto e vuoi aggiungerlo alla lista della spesa?",
    en: 'Do you just want to delete it, or have you run out and want to add it to the shopping list?',
    es: '¿Quieres solo eliminarlo, o se ha terminado y quieres añadirlo a la lista de la compra?',
  },
  'item.deleteOnly': { it: 'Solo elimina', en: 'Just delete', es: 'Solo eliminar' },
  'item.deleteAndAddToShoppingList': {
    it: 'Aggiungi a lista spesa',
    en: 'Add to shopping list',
    es: 'Añadir a la lista',
  },

  // Auth
  'auth.login.subtitle': {
    it: "Accedi per vedere l'inventario della tua famiglia",
    en: 'Log in to see your household inventory',
    es: 'Inicia sesión para ver el inventario de tu familia',
  },
  'auth.emailLabel': { it: 'Email', en: 'Email', es: 'Email' },
  'auth.emailPlaceholder': { it: 'nome@esempio.it', en: 'name@example.com', es: 'nombre@ejemplo.com' },
  'auth.passwordLabel': { it: 'Password', en: 'Password', es: 'Contraseña' },
  'auth.forgotPasswordLink': { it: 'Password dimenticata?', en: 'Forgot password?', es: '¿Olvidaste tu contraseña?' },
  'auth.loginButton': { it: 'Accedi', en: 'Log in', es: 'Iniciar sesión' },
  'auth.noAccountLink': { it: 'Non hai un account? Registrati', en: "Don't have an account? Sign up", es: '¿No tienes cuenta? Regístrate' },
  'auth.register.title': { it: 'Crea il tuo account', en: 'Create your account', es: 'Crea tu cuenta' },
  'auth.register.subtitle': {
    it: 'Dopo la registrazione potrai creare una famiglia o unirti a quella di un familiare',
    en: 'After signing up you can create a household or join a family member’s',
    es: 'Después de registrarte podrás crear una familia o unirte a la de un familiar',
  },
  'auth.nameLabel': { it: 'Nome', en: 'Name', es: 'Nombre' },
  'auth.namePlaceholder': { it: 'Il tuo nome', en: 'Your name', es: 'Tu nombre' },
  'auth.passwordMinPlaceholder': { it: 'Almeno 8 caratteri', en: 'At least 8 characters', es: 'Al menos 8 caracteres' },
  'auth.registerButton': { it: 'Registrati', en: 'Sign up', es: 'Regístrate' },
  'auth.haveAccountLink': { it: 'Hai già un account? Accedi', en: 'Already have an account? Log in', es: '¿Ya tienes cuenta? Inicia sesión' },
  'auth.forgot.title': { it: 'Password dimenticata', en: 'Forgot password', es: 'Contraseña olvidada' },
  'auth.forgot.subtitleRequest': {
    it: 'Inserisci la tua email: ti mandiamo un codice per reimpostare la password.',
    en: 'Enter your email: we will send you a code to reset your password.',
    es: 'Introduce tu email: te enviaremos un código para restablecer la contraseña.',
  },
  'auth.forgot.subtitleReset': {
    it: 'Inserisci il codice ricevuto via email e la nuova password.',
    en: 'Enter the code you received by email and your new password.',
    es: 'Introduce el código recibido por email y la nueva contraseña.',
  },
  'auth.forgot.infoSent': {
    it: "Se l'indirizzo esiste, ti abbiamo inviato un codice via email. Controlla anche lo spam.",
    en: 'If the address exists, we sent you a code by email. Check your spam folder too.',
    es: 'Si la dirección existe, te hemos enviado un código por email. Revisa también el spam.',
  },
  'auth.forgot.sendCodeButton': { it: 'Invia codice', en: 'Send code', es: 'Enviar código' },
  'auth.forgot.codeLabel': { it: 'Codice ricevuto via email', en: 'Code received by email', es: 'Código recibido por email' },
  'auth.forgot.newPasswordLabel': { it: 'Nuova password', en: 'New password', es: 'Nueva contraseña' },
  'auth.forgot.resetButton': { it: 'Reimposta password', en: 'Reset password', es: 'Restablecer contraseña' },
  'auth.forgot.retryButton': { it: 'Non ho ricevuto il codice, riprova', en: "I didn't receive the code, try again", es: 'No recibí el código, reintentar' },
  'auth.forgot.backToLogin': { it: 'Torna al login', en: 'Back to login', es: 'Volver al inicio de sesión' },

  // Household setup
  'householdSetup.greeting': { it: (v) => `Ciao ${v.name}!`, en: (v) => `Hi ${v.name}!`, es: (v) => `¡Hola ${v.name}!` },
  'householdSetup.subtitle': {
    it: 'Per iniziare, crea una nuova famiglia oppure unisciti a quella di un familiare con un codice invito.',
    en: 'To get started, create a new household or join a family member’s using an invite code.',
    es: 'Para empezar, crea una nueva familia o únete a la de un familiar con un código de invitación.',
  },
  'householdSetup.createTitle': { it: 'Crea una famiglia', en: 'Create a household', es: 'Crea una familia' },
  'householdSetup.createSubtitle': { it: 'Genera un codice invito da condividere', en: 'Generate an invite code to share', es: 'Genera un código de invitación para compartir' },
  'householdSetup.joinTitle': { it: 'Unisciti con un codice', en: 'Join with a code', es: 'Únete con un código' },
  'householdSetup.joinSubtitle': {
    it: 'Hai già un codice invito di un familiare',
    en: 'You already have an invite code from a family member',
    es: 'Ya tienes un código de invitación de un familiar',
  },
  'householdSetup.householdNameLabel': { it: 'Nome famiglia', en: 'Household name', es: 'Nombre de la familia' },
  'householdSetup.householdNamePlaceholder': { it: 'Es. Famiglia Rossi', en: 'e.g. The Smith family', es: 'ej. Familia García' },
  'householdSetup.createButton': { it: 'Crea famiglia', en: 'Create household', es: 'Crear familia' },
  'householdSetup.back': { it: 'Indietro', en: 'Back', es: 'Atrás' },
  'householdSetup.inviteCodePlaceholder': { it: 'Es. AB12CD', en: 'e.g. AB12CD', es: 'ej. AB12CD' },
  'householdSetup.joinButton': { it: 'Unisciti', en: 'Join', es: 'Únete' },
  'householdSetup.logout': { it: 'Esci', en: 'Log out', es: 'Salir' },
  'notif.channelName': { it: 'Promemoria', en: 'Reminders', es: 'Recordatorios' },
};

function buildDict(lang: Language): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const key of Object.keys(ENTRIES)) {
    out[key] = ENTRIES[key][lang];
  }
  return out;
}

export const DICTIONARIES: Record<Language, Record<string, Entry>> = {
  it: buildDict('it'),
  en: buildDict('en'),
  es: buildDict('es'),
};
