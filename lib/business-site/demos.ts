import type { BusinessSite, BusinessType } from "./data";

const PEXELS = {
  autoGarage: "https://images.pexels.com/photos/15489246/pexels-photo-15489246.jpeg?auto=compress&cs=tinysrgb&w=1800",
  autoEngine: "https://images.pexels.com/photos/8470679/pexels-photo-8470679.jpeg?auto=compress&cs=tinysrgb&w=1600",
  autoDark: "https://images.pexels.com/photos/37809544/pexels-photo-37809544.jpeg?auto=compress&cs=tinysrgb&w=1800",
  autoBumper: "https://images.pexels.com/photos/37809554/pexels-photo-37809554.jpeg?auto=compress&cs=tinysrgb&w=1600",
  salonInterior: "https://images.pexels.com/photos/20785318/pexels-photo-20785318.jpeg?auto=compress&cs=tinysrgb&w=1800",
  salonWork: "https://images.pexels.com/photos/8834077/pexels-photo-8834077.jpeg?auto=compress&cs=tinysrgb&w=1600",
  barberInterior: "https://images.pexels.com/photos/7518728/pexels-photo-7518728.jpeg?auto=compress&cs=tinysrgb&w=1800",
  barberCut: "https://images.pexels.com/photos/2420280/pexels-photo-2420280.jpeg?auto=compress&cs=tinysrgb&w=1600",
  restaurantRoom: "https://images.pexels.com/photos/17294748/pexels-photo-17294748.jpeg?auto=compress&cs=tinysrgb&w=1800",
  restaurantPlate: "https://images.pexels.com/photos/15098824/pexels-photo-15098824.jpeg?auto=compress&cs=tinysrgb&w=1600",
  restaurantTable: "https://images.pexels.com/photos/10127261/pexels-photo-10127261.jpeg?auto=compress&cs=tinysrgb&w=1600",
  luxuryDining: "https://images.pexels.com/photos/20184692/pexels-photo-20184692.jpeg?auto=compress&cs=tinysrgb&w=1800",
  luxuryRoom: "https://images.pexels.com/photos/9250796/pexels-photo-9250796.jpeg?auto=compress&cs=tinysrgb&w=1600",
  retailStore: "https://images.pexels.com/photos/4940756/pexels-photo-4940756.jpeg?auto=compress&cs=tinysrgb&w=1800",
  retailPeople: "https://images.pexels.com/photos/5864244/pexels-photo-5864244.jpeg?auto=compress&cs=tinysrgb&w=1600",
  retailCounter: "https://images.pexels.com/photos/6044226/pexels-photo-6044226.jpeg?auto=compress&cs=tinysrgb&w=1600",
};

const layoutConfigs: Record<string, BusinessSite["layout"]> = {
  "clean-service": { code: "clean-service", name: "Local Service", style_key: "clean-service", config: { palette: { background: "#fbf8f0", surface: "#fffdf8", text: "#0b1b28", muted: "#56616a", accent: "#ef252e", accent2: "#dce7ed" }, radius: "8px" } },
  "workshop-dark": { code: "workshop-dark", name: "Performance Shop", style_key: "workshop-dark", config: { palette: { background: "#080a0c", surface: "#12161a", text: "#f5f7f8", muted: "#aab1b7", accent: "#f05a28", accent2: "#242a2f" }, radius: "4px" } },
  "editorial-studio": { code: "editorial-studio", name: "Modern Salon", style_key: "editorial-studio", config: { palette: { background: "#f5eee6", surface: "#fffaf5", text: "#2a201b", muted: "#78685d", accent: "#9f5b46", accent2: "#ded0c5" }, radius: "0px" } },
  "hospitality-warm": { code: "hospitality-warm", name: "Neighborhood Dining", style_key: "hospitality-warm", config: { palette: { background: "#efe7d8", surface: "#fffaf0", text: "#241d18", muted: "#6f6258", accent: "#a9472f", accent2: "#d6b786" }, radius: "16px" } },
  "neighborhood-classic": { code: "neighborhood-classic", name: "Classic Barber", style_key: "neighborhood-classic", config: { palette: { background: "#efe9dc", surface: "#fbf7ee", text: "#173047", muted: "#687077", accent: "#9d2f2b", accent2: "#c9d5da" }, radius: "6px" } },
  "modern-grid": { code: "modern-grid", name: "Modern Service", style_key: "modern-grid", config: { palette: { background: "#eef0ea", surface: "#f9faf7", text: "#101311", muted: "#616962", accent: "#355f46", accent2: "#c8d7cb" }, radius: "0px" } },
  "luxury-noir": { code: "luxury-noir", name: "Fine Dining", style_key: "luxury-noir", config: { palette: { background: "#0c0c0b", surface: "#171612", text: "#f4efe5", muted: "#b7ad9d", accent: "#c49a56", accent2: "#2b251d" }, radius: "0px" } },
};

type DemoDefinition = {
  code: keyof typeof layoutConfigs;
  businessName: string;
  businessType: BusinessType;
  headline: string;
  subheadline: string;
  about: string;
  cta: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  images: Array<{ url: string; kind: "hero" | "gallery" | "portfolio"; caption: string; source: string }>;
  services: Array<{ name: string; description: string }>;
  testimonials: Array<{ quote: string; name: string }>;
};

const definitions: DemoDefinition[] = [
  {
    code: "clean-service", businessName: "Lakefront Auto Care", businessType: "auto_repair",
    headline: "Car repair. Clear and uncomplicated.", subheadline: "Racine, Wisconsin · Diagnostics, maintenance and repair · Monday–Friday",
    about: "Lakefront Auto Care provides diagnostics, maintenance and repair with clear estimates and straightforward communication.", cta: "Request Service", phone: "(262) 555-0148", email: "service@lakefrontautocare.example", address: "1420 Lakeview Ave · Racine, WI", hours: "Mon–Fri 7:30 AM–5:30 PM",
    images: [
      { url: PEXELS.autoGarage, kind: "hero", caption: "Modern repair bay", source: "https://www.pexels.com/photo/car-in-an-auto-repair-garage-15489246/" },
      { url: PEXELS.autoEngine, kind: "gallery", caption: "Hands-on diagnostics and repair", source: "https://www.pexels.com/photo/a-man-repairing-a-car-8470679/" },
    ],
    services: [
      { name: "Diagnostics", description: "Engine lights, electrical issues and troubleshooting explained before repairs begin." },
      { name: "Brakes & Maintenance", description: "Routine service, inspections, brakes, fluids and preventive care." },
      { name: "Mechanical Repair", description: "Practical repairs for the vehicles people depend on every day." },
      { name: "Pre-Purchase Inspection", description: "A second set of eyes before you buy your next vehicle." },
    ], testimonials: [{ quote: "They told me what mattered now, what could wait, and what it would cost before touching anything.", name: "Jordan M." }],
  },
  {
    code: "workshop-dark", businessName: "Blackline Performance", businessType: "auto_repair",
    headline: "Built harder. Driven better.", subheadline: "Performance · fabrication · diagnostics · Milwaukee",
    about: "Blackline is a performance-focused workshop for drivers who care about the machine. The site is aggressive, visual and designed to make the shop feel serious before a customer ever walks in.", cta: "Book the Shop", phone: "(414) 555-0182", email: "service@blacklineperformance.example", address: "720 Industrial Way · Milwaukee, WI", hours: "Tue–Sat 8:00 AM–6:00 PM",
    images: [
      { url: PEXELS.autoDark, kind: "hero", caption: "Workshop service", source: "https://www.pexels.com/photo/man-working-on-car-in-auto-repair-shop-37809544/" },
      { url: PEXELS.autoBumper, kind: "gallery", caption: "Body and performance work", source: "https://www.pexels.com/photo/mechanic-repairing-car-bumper-in-garage-37809554/" },
    ],
    services: [
      { name: "Performance", description: "Upgrades, handling, cooling and performance-focused service." },
      { name: "Diagnostics", description: "Modern troubleshooting without the parts-cannon approach." },
      { name: "Fabrication", description: "Custom solutions for enthusiast and specialty builds." },
    ], testimonials: [{ quote: "The shop is focused, capable and easy to work with.", name: "Alex R." }],
  },
  {
    code: "editorial-studio", businessName: "Mae & Moss Studio", businessType: "barber_salon",
    headline: "Hair with shape, texture and a point of view.", subheadline: "A private studio for cuts, color and lived-in styling.",
    about: "Mae & Moss is an appointment-led hair studio where the work is the centerpiece. Photography carries the site, while the typography and whitespace give the brand room to feel personal and editorial.", cta: "Book Your Stylist", phone: "(312) 555-0166", email: "hello@maeandmoss.example", address: "86 North Morgan · Chicago, IL", hours: "Tue–Sat 10:00 AM–7:00 PM",
    images: [
      { url: PEXELS.salonInterior, kind: "hero", caption: "Mae & Moss studio", source: "https://www.pexels.com/photo/interior-design-of-hairdresser-studio-20785318/" },
      { url: PEXELS.salonWork, kind: "portfolio", caption: "Cut and finish", source: "https://www.pexels.com/photo/a-client-having-her-hair-cut-by-the-hair-stylist-8834077/" },
    ],
    services: [
      { name: "Cut", description: "Shape, texture and finish designed around your hair and routine." },
      { name: "Color", description: "Dimensional color, blonding and lived-in tones." },
      { name: "Styling", description: "Event styling and polished finishing for photography or a night out." },
    ], testimonials: [{ quote: "It feels more like a studio than a salon, and the work always feels like me.", name: "Mia K." }],
  },
  {
    code: "hospitality-warm", businessName: "Juniper & Stone", businessType: "restaurant_bar",
    headline: "Dinner worth staying for.", subheadline: "Seasonal food · thoughtful drinks · a neighborhood room",
    about: "Juniper & Stone is a neighborhood dining room built around seasonal plates and the kind of hospitality that turns dinner into an evening. The site leads with atmosphere and gets guests to the menu, hours and reservations quickly.", cta: "Reserve a Table", phone: "(262) 555-0107", email: "reservations@juniperstone.example", address: "318 Main Street · Racine, WI", hours: "Wed–Sun 4:00 PM–11:00 PM",
    images: [
      { url: PEXELS.restaurantRoom, kind: "hero", caption: "The dining room", source: "https://www.pexels.com/photo/interior-of-a-restaurant-17294748/" },
      { url: PEXELS.restaurantPlate, kind: "gallery", caption: "Seasonal plate", source: "https://www.pexels.com/photo/meal-and-menu-on-a-restaurant-table-15098824/" },
      { url: PEXELS.restaurantTable, kind: "gallery", caption: "Dinner service", source: "https://www.pexels.com/photo/table-setting-in-restaurant-10127261/" },
    ],
    services: [
      { name: "Dinner", description: "Seasonal plates, shared dishes and a menu that changes with the room." },
      { name: "Bar", description: "Classic technique, local ingredients and a tight wine list." },
      { name: "Private Events", description: "A flexible room for dinners, celebrations and small gatherings." },
    ], testimonials: [{ quote: "We came for dinner and stayed for another round because the room felt that good.", name: "Taylor S." }],
  },
  {
    code: "neighborhood-classic", businessName: "Riverside Barber Co.", businessType: "barber_salon",
    headline: "A proper neighborhood barber shop.", subheadline: "Cuts · fades · beards · walk in looking sharper than you came in.",
    about: "Riverside Barber Co. is familiar in the best way: a strong shop identity, straightforward services and a site that feels established instead of trendy for the sake of it.", cta: "Book a Chair", phone: "(262) 555-0124", email: "shop@riversidebarber.example", address: "58 Riverside Drive · Racine, WI", hours: "Mon–Sat 8:00 AM–6:00 PM",
    images: [
      { url: PEXELS.barberInterior, kind: "hero", caption: "The shop", source: "https://www.pexels.com/photo/the-interior-of-a-barber-shop-7518728/" },
      { url: PEXELS.barberCut, kind: "portfolio", caption: "Classic barbering", source: "https://www.pexels.com/photo/man-inside-barber-shop-2420280/" },
    ],
    services: [
      { name: "Classic Cut", description: "Traditional barbering, tapers, fades and everyday maintenance." },
      { name: "Beard Service", description: "Trim, shape and finishing for a clean consistent look." },
      { name: "Kids & Family", description: "A relaxed chair for younger clients and family appointments." },
    ], testimonials: [{ quote: "No gimmicks. Good cut, good conversation, easy booking.", name: "Chris D." }],
  },
  {
    code: "modern-grid", businessName: "Common Ground Studio", businessType: "retail",
    headline: "Personal service, scheduled around you.", subheadline: "Consultations, styling sessions and local appointments in a calm, modern studio.",
    about: "Common Ground Studio is an appointment-led local service business. The site gives clients a clear path to choose a service, understand what to expect and reserve time without storefront clutter.", cta: "Book an Appointment", phone: "(414) 555-0199", email: "hello@commongroundstudio.example", address: "214 Walker Street · Milwaukee, WI", hours: "Mon–Sat 10:00 AM–7:00 PM",
    images: [
      { url: PEXELS.retailPeople, kind: "hero", caption: "One-on-one consultation", source: "https://www.pexels.com/photo/women-shopping-in-clothing-store-5864244/" },
      { url: PEXELS.retailStore, kind: "gallery", caption: "Common Ground Studio", source: "https://www.pexels.com/photo/fashion-store-interior-with-garments-hanging-on-racks-4940756/" },
    ],
    services: [
      { name: "Consultation", description: "A focused one-on-one appointment built around the client’s needs and preferences." },
      { name: "Personal Styling", description: "Dedicated time for selection, fitting and practical recommendations." },
      { name: "Pickup Appointment", description: "Reserve a convenient time for prepared orders, adjustments or follow-up service." },
    ], testimonials: [{ quote: "Booking was simple, and I had dedicated time instead of trying to catch someone between customers.", name: "Morgan L." }],
  },
  {
    code: "luxury-noir", businessName: "No. 8 Supper Club", businessType: "restaurant_bar",
    headline: "A slower kind of evening.", subheadline: "Private tables · seasonal tasting menu · late cocktails",
    about: "No. 8 is an intimate supper club where the website should feel like the room: dark, composed and deliberately sparse. The design uses typography and full-bleed photography instead of cards and dashboard-like blocks.", cta: "Request a Table", phone: "(312) 555-0118", email: "concierge@no8supperclub.example", address: "8 West Huron · Chicago, IL", hours: "Thu–Sat · Dinner by reservation",
    images: [
      { url: PEXELS.luxuryDining, kind: "hero", caption: "Evening service", source: "https://www.pexels.com/photo/tables-at-restaurant-20184692/" },
      { url: PEXELS.luxuryRoom, kind: "gallery", caption: "The room", source: "https://www.pexels.com/photo/table-setting-in-luxurious-restaurant-9250796/" },
    ],
    services: [
      { name: "Tasting Menu", description: "A seasonal progression served across the evening." },
      { name: "Cocktails", description: "A concise late-night list built around classics and house signatures." },
      { name: "Private Dining", description: "Reserved experiences for intimate groups and celebrations." },
    ], testimonials: [{ quote: "The room, the pacing and the food all felt completely considered.", name: "Avery P." }],
  },
];

export const demoSites: BusinessSite[] = definitions.map((demo, index) => ({
  instance: {
    id: `demo-${demo.code}`,
    business_name: demo.businessName,
    path_slug: `layouts/${demo.code}`,
    subdomain: `demo-${demo.code}`,
    business_type: demo.businessType,
    admin_email: null,
    site_layout_code: demo.code,
    canonical_url: `https://onetimelabs.net/layouts/${demo.code}`,
    custom_domain: null,
    subdomain_enabled: false,
    status: "demo",
  },
  layout: layoutConfigs[demo.code],
  content: {
    headline: demo.headline,
    subheadline: demo.subheadline,
    about_text: demo.about,
    primary_cta_label: demo.cta,
    primary_cta_href: "#contact",
    phone: demo.phone,
    contact_email: demo.email,
    address_text: demo.address,
    hours_text: demo.hours,
    services: demo.services,
    testimonials: demo.testimonials,
  },
  media: demo.images.map((image, mediaIndex) => ({
    id: `demo-${index}-${mediaIndex}`,
    kind: image.kind,
    public_url: image.url,
    alt_text: `${demo.businessName} ${image.caption}`,
    caption: image.caption,
    source_name: "Pexels",
    source_url: image.source,
    sort_order: mediaIndex,
  })),
}));

export function getDemoSite(code: string): BusinessSite | null {
  return demoSites.find(site => site.layout.code === code) ?? null;
}
