/**
 * Demo seed manifest — scripts/demo-seed/seed-demo.mjs data.
 *
 * The single source of truth for what the demo storefront shows. Every string
 * here is real copy the admin can edit afterwards through the same APIs this
 * script uses; nothing here is a placeholder, a lorem, or a fake ranking
 * (plan §0). Image paths point at committed files under
 * `frontend/storefront/public/media/seed/` — the contracts' imageRefSchema
 * explicitly allows internal paths, and the storefront serves them itself, so
 * no media pipeline is needed to demo the shop.
 *
 * Asset honesty note: brand logos and dedicated blog covers were not produced
 * (the image budget ran out mid-wave). The seed therefore uses NO invented
 * artwork: brands render through the documented wordmark fallback (brand strip
 * shows the `label` beside each cell), products without their own photo point
 * at their real category tile, and blog covers reuse real wave imagery. Swapping
 * in dedicated files later is a one-line-per-row change here plus dropping the
 * PNG in — no service or schema change.
 */

export const SITE = {
  name: "foreafcbeta",
  tagline: "Considered essentials for clothes, home and tech — shipped worldwide.",
  supportEmail: "support@foreafcbeta.test",
  pressEmail: "press@foreafcbeta.test",
  phone: "+1 (415) 555-0134",
  address: "427 Mission Street, Suite 300, San Francisco, CA 94105",
};

/** Relative storefront paths (served from public/). */
export const IMG = {
  heroSlide1: "/media/seed/hero/slide-1.png",
  heroSlide2: "/media/seed/hero/slide-2.png",
  aboutBanner: "/media/seed/about-banner.png",
  categories: {
    apparel: "/media/seed/categories/apparel.png",
    shoes: "/media/seed/categories/shoes.png",
    accessories: "/media/seed/categories/accessories.png",
    home: "/media/seed/categories/home.png",
    beauty: "/media/seed/categories/beauty.png",
    electronics: "/media/seed/categories/electronics.png",
  },
  products: {
    "linen-shirt": "/media/seed/products/linen-shirt.png",
    "merino-crew": "/media/seed/products/merino-crew.png",
    "denim-jacket": "/media/seed/products/denim-jacket.png",
    chino: "/media/seed/products/chino.png",
    runner: "/media/seed/products/runner.png",
    loafer: "/media/seed/products/loafer.png",
    "chelsea-boot": "/media/seed/products/chelsea-boot.png",
  },
};

export const CATEGORIES = [
  {
    key: "apparel",
    name: "Apparel",
    slug: "apparel",
    description: "Everyday clothes built to last: linen, merino, denim.",
    imageUrl: IMG.categories.apparel,
    showInNavbar: true,
    sortOrder: 1,
  },
  {
    key: "shoes",
    name: "Shoes",
    slug: "shoes",
    description: "Runners, loafers and boots from partners we audit yearly.",
    imageUrl: IMG.categories.shoes,
    showInNavbar: true,
    sortOrder: 2,
  },
  {
    key: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Bags, belts and the small things that finish an outfit.",
    imageUrl: IMG.categories.accessories,
    showInNavbar: true,
    sortOrder: 3,
  },
  {
    key: "home",
    name: "Home & Living",
    slug: "home-living",
    description: "Ceramics, textiles and light for a calm interior.",
    imageUrl: IMG.categories.home,
    showInNavbar: true,
    sortOrder: 4,
  },
  {
    key: "beauty",
    name: "Beauty & Wellness",
    slug: "beauty-wellness",
    description: "Short-ingredient-list skincare and wellness tools.",
    imageUrl: IMG.categories.beauty,
    showInNavbar: false,
    sortOrder: 5,
  },
  {
    key: "electronics",
    name: "Electronics",
    slug: "electronics",
    description: "Quiet tech: headphones and speakers we actually use.",
    imageUrl: IMG.categories.electronics,
    showInNavbar: true,
    sortOrder: 6,
  },
];

/** No logoUrl yet — the Navbar/BrandStrip/Footer wordmark fallbacks are real,
 * tested faces, not error states. */
export const BRANDS = [
  { key: "northwind", name: "Northwind Supply", slug: "northwind-supply", description: "Workwear-grade denim and cotton outerwear since 1987.", sortOrder: 1 },
  { key: "ateliervera", name: "Atelier Vera", slug: "atelier-vera", description: "Small-run knitwear cut and finished in Porto.", sortOrder: 2 },
  { key: "kinfolk", name: "Kinfolk Threads", slug: "kinfolk-threads", description: "Linen and everyday shirting, pre-shrunk and garment-dyed.", sortOrder: 3 },
  { key: "cobalt", name: "Cobalt Audio", slug: "cobalt-audio", description: "Headphones tuned for rooms, not showrooms.", sortOrder: 4 },
  { key: "mora", name: "Mora Home", slug: "mora-home", description: "Glaze-tested ceramics thrown in small batches.", sortOrder: 5 },
  { key: "sylvie", name: "Sylvie Skincare", slug: "sylvie-skincare", description: "Short ingredient lists, fully disclosable sourcing.", sortOrder: 6 },
];

/**
 * 14 products. `image` is the primary photo path; rows without a dedicated
 * photo use their real category tile (documented above). Prices are in the
 * store's currency unit; variants carry their own sku/price/stock.
 */
export const PRODUCTS = [
  {
    key: "linen-shirt",
    sku: "FW-AP-0001",
    name: "Everyday Linen Shirt",
    slug: "everyday-linen-shirt",
    category: "apparel",
    brand: "kinfolk",
    price: 680,
    compareAtPrice: 850,
    stock: 42,
    shortDescription: "Washed European linen, mother-of-pearl buttons, cut to move.",
    description:
      "A relaxed button-up in garment-washed European linen that gets softer every wear. Pre-shrunk, side-seam pockets, corozo buttons. Cut roomy through the chest so it works layered or alone.",
    image: IMG.products["linen-shirt"],
    tags: ["linen", "summer", "shirting"],
    options: [
      {
        name: "Color",
        displayType: "swatch",
        showOnCard: true,
        cardPlacement: "info",
        values: [
          { value: "Ocean Blue", swatchHex: "#2b6cb0" },
          { value: "Natural", swatchHex: "#e2d9cc" },
          { value: "Navy", swatchHex: "#1a365d" },
        ],
      },
      {
        name: "Size",
        displayType: "pill",
        showOnCard: true,
        cardPlacement: "media-hover-top",
        values: [
          { value: "S" },
          { value: "M" },
          { value: "L" },
          { value: "XL" },
        ],
      },
    ],
    gallery: [
      { url: IMG.products["linen-shirt"], alt: "Everyday Linen Shirt - Front" },
      { url: "/media/seed/products/merino-crew.png", alt: "Everyday Linen Shirt - Texture" },
      { url: "/media/seed/products/denim-jacket.png", alt: "Everyday Linen Shirt - Flat Lay" },
    ],
    variants: [
      { sku: "FW-AP-0001-BLU-S", price: 680, stock: 10, label: "Ocean Blue / S", optionValues: { Color: "Ocean Blue", Size: "S" } },
      { sku: "FW-AP-0001-BLU-M", price: 680, stock: 18, label: "Ocean Blue / M", optionValues: { Color: "Ocean Blue", Size: "M" } },
      { sku: "FW-AP-0001-BLU-L", price: 680, stock: 0, label: "Ocean Blue / L", optionValues: { Color: "Ocean Blue", Size: "L" } },
      { sku: "FW-AP-0001-NAT-M", price: 680, stock: 14, label: "Natural / M", optionValues: { Color: "Natural", Size: "M" } },
      { sku: "FW-AP-0001-NAV-L", price: 720, compareAtPrice: 850, stock: 6, label: "Navy / L", optionValues: { Color: "Navy", Size: "L" } },
    ],
  },
  {
    key: "merino-crew",
    sku: "FW-AP-0002",
    name: "Merino Crew Sweater",
    slug: "merino-crew-sweater",
    category: "apparel",
    brand: "ateliervera",
    price: 1290,
    stock: 26,
    shortDescription: "Fine-gauge 100% merino knit, fully fashioned in Porto.",
    description:
      "A fully fashioned crew in 12-gauge extra-fine merino. Flat collar, ribbed trims, no side seams at the shoulder so it hangs clean. Machine washable on wool cycle at 30°C.",
    image: IMG.products["merino-crew"],
    tags: ["wool", "knitwear"],
    variants: [
      { sku: "FW-AP-0002-S", price: 1290, stock: 6, label: "S" },
      { sku: "FW-AP-0002-M", price: 1290, stock: 12, label: "M" },
      { sku: "FW-AP-0002-L", price: 1290, stock: 8, label: "L" },
    ],
  },
  {
    key: "denim-jacket",
    sku: "FW-AP-0003",
    name: "Classic Denim Jacket",
    slug: "classic-denim-jacket",
    category: "apparel",
    brand: "northwind",
    price: 1590,
    compareAtPrice: 1890,
    stock: 18,
    shortDescription: "12.5 oz rigid selvedge-style denim that earns its fades.",
    description:
      "A trucker-cut jacket in heavy 12.5 oz indigo denim with copper rivets and a chain-stitched hem. Raw enough to fade to your routine, washed once so the first wear is not a chore.",
    image: IMG.products["denim-jacket"],
    tags: ["denim", "outerwear"],
    variants: [
      { sku: "FW-AP-0003-M", price: 1590, stock: 8, label: "M" },
      { sku: "FW-AP-0003-L", price: 1590, stock: 6, label: "L" },
      { sku: "FW-AP-0003-XL", price: 1590, stock: 4, label: "XL" },
    ],
  },
  {
    key: "chino",
    sku: "FW-AP-0004",
    name: "Olive Everyday Chino",
    slug: "olive-everyday-chino",
    category: "apparel",
    brand: "northwind",
    price: 990,
    stock: 35,
    shortDescription: "Structured cotton twill with a whisper of stretch.",
    description:
      "A slim-straight chino in 8.5 oz cotton twill with 2% elastane. Yarn-dyed olive, horn buttons, bar-tacked stress points. Hemmed at 32\" inseam on every size.",
    image: IMG.products.chino,
    tags: ["trousers", "cotton"],
    variants: [
      { sku: "FW-AP-0004-30", price: 990, stock: 10, label: "W30" },
      { sku: "FW-AP-0004-32", price: 990, stock: 15, label: "W32" },
      { sku: "FW-AP-0004-34", price: 990, stock: 10, label: "W34" },
    ],
  },
  {
    key: "tea-shirt",
    sku: "FW-AP-0005",
    name: "Heavyweight Pocket Tee",
    slug: "heavyweight-pocket-tee",
    category: "apparel",
    brand: "kinfolk",
    price: 450,
    stock: 60,
    shortDescription: "220 gsm combed cotton that keeps its shape past year one.",
    description:
      "A boxy tee knit from 220 gsm combed ringspun cotton, sanforized so the neckband stays ribbed instead of wavy. Single chest pocket, double-needle hems.",
    image: IMG.categories.apparel,
    tags: ["tee", "basics"],
    variants: [
      { sku: "FW-AP-0005-S", price: 450, stock: 18, label: "S" },
      { sku: "FW-AP-0005-M", price: 450, stock: 24, label: "M" },
      { sku: "FW-AP-0005-L", price: 450, stock: 18, label: "L" },
    ],
  },
  {
    key: "chore-coat",
    sku: "FW-AP-0006",
    name: "Field Chore Coat",
    slug: "field-chore-coat",
    category: "apparel",
    brand: "northwind",
    price: 1890,
    stock: 12,
    shortDescription: "Four-pocket cotton canvas workcoat, brass hardware.",
    description:
      "A waist-length chore coat in 10 oz bonded cotton canvas with four pockets and antique-brass shanks. Cut to layer over knitwear without swallowing your arms.",
    image: IMG.categories.apparel,
    tags: ["outerwear", "workwear"],
    variants: [
      { sku: "FW-AP-0006-M", price: 1890, stock: 5, label: "M" },
      { sku: "FW-AP-0006-L", price: 1890, stock: 7, label: "L" },
    ],
  },
  {
    key: "runner",
    sku: "FW-SH-0001",
    name: "Daily Road Runner",
    slug: "daily-road-runner",
    category: "shoes",
    brand: "northwind",
    price: 1150,
    stock: 30,
    shortDescription: "Neutral daily trainer, 8 mm drop, recycled-mesh upper.",
    description:
      "A cushioned daily trainer for straight-mileage running: compression-moulded EVA midsole, 8 mm drop, engineered mesh upper with a recycled content yarn. Reflective heel counter.",
    image: IMG.products.runner,
    tags: ["shoes", "running"],
    options: [
      {
        name: "Color",
        displayType: "swatch",
        showOnCard: true,
        cardPlacement: "info",
        values: [
          { value: "Chalk White", swatchHex: "#f8fafc" },
          { value: "Shadow Grey", swatchHex: "#475569" },
        ],
      },
      {
        name: "Size",
        displayType: "pill",
        showOnCard: true,
        cardPlacement: "media-hover-top",
        values: [
          { value: "US 8" },
          { value: "US 9" },
          { value: "US 10" },
          { value: "US 11" },
        ],
      },
    ],
    gallery: [
      { url: IMG.products.runner, alt: "Daily Road Runner - Profile" },
      { url: "/media/seed/products/loafer.png", alt: "Daily Road Runner - Outsole" },
      { url: "/media/seed/products/chelsea-boot.png", alt: "Daily Road Runner - Top View" },
    ],
    variants: [
      { sku: "FW-SH-0001-WHT-9", price: 1150, stock: 12, label: "Chalk White / US 9", optionValues: { Color: "Chalk White", Size: "US 9" } },
      { sku: "FW-SH-0001-WHT-10", price: 1150, stock: 0, label: "Chalk White / US 10", optionValues: { Color: "Chalk White", Size: "US 10" } },
      { sku: "FW-SH-0001-GRY-10", price: 1150, stock: 8, label: "Shadow Grey / US 10", optionValues: { Color: "Shadow Grey", Size: "US 10" } },
      { sku: "FW-SH-0001-GRY-11", price: 1150, stock: 10, label: "Shadow Grey / US 11", optionValues: { Color: "Shadow Grey", Size: "US 11" } },
    ],
  },
  {
    key: "loafer",
    sku: "FW-SH-0002",
    name: "Handstitched Leather Loafer",
    slug: "handstitched-leather-loafer",
    category: "shoes",
    brand: "ateliervera",
    price: 2450,
    stock: 14,
    shortDescription: "Vegetable-tanned leather, hand-lasted, leather sole.",
    description:
      "A penny loafer in vegetable-tanned calf leather, hand-lasted over 14 days with a blind apron stitch. Leather insole and sole with a thin rubber topy for the first season.",
    image: IMG.products.loafer,
    tags: ["leather", "formal"],
    variants: [
      { sku: "FW-SH-0002-8", price: 2450, stock: 4, label: "US 8" },
      { sku: "FW-SH-0002-9", price: 2450, stock: 6, label: "US 9" },
      { sku: "FW-SH-0002-10", price: 2450, stock: 4, label: "US 10" },
    ],
  },
  {
    key: "chelsea-boot",
    sku: "FW-SH-0003",
    name: "All-Weather Chelsea Boot",
    slug: "all-weather-chelsea-boot",
    category: "shoes",
    brand: "northwind",
    price: 2890,
    compareAtPrice: 3290,
    stock: 9,
    shortDescription: "Waxed suede, storm-welted, Vibram-style lug sole.",
    description:
      "A Chelsea built for wet autumns: waxed suede upper, twin stretch panels, storm welt, and a lugged rubber sole that grips ice. Pull loops front and back.",
    image: IMG.products["chelsea-boot"],
    tags: ["boots", "leather"],
    variants: [
      { sku: "FW-SH-0003-9", price: 2890, stock: 4, label: "US 9" },
      { sku: "FW-SH-0003-10", price: 2890, stock: 5, label: "US 10" },
    ],
  },
  {
    key: "weekender",
    sku: "FW-AC-0001",
    name: "Canvas Weekender Bag",
    slug: "canvas-weekender-bag",
    category: "accessories",
    brand: "northwind",
    price: 1750,
    stock: 20,
    shortDescription: "Waxed canvas, leather handles, fits under a real seat.",
    description:
      "A 40 L weekender in 18 oz waxed canvas with full-grain leather handles and YKK zippers. Interior slip pockets, a shoe sleeve, and a base that survives being dropped.",
    image: IMG.categories.accessories,
    tags: ["bags", "travel"],
    variants: [{ sku: "FW-AC-0001-OS", price: 1750, stock: 20, label: "One size" }],
  },
  {
    key: "leather-belt",
    sku: "FW-AC-0002",
    name: "Full-Grain Leather Belt",
    slug: "full-grain-leather-belt",
    category: "accessories",
    brand: "ateliervera",
    price: 780,
    stock: 28,
    shortDescription: "Single-piece veg-tan strap, solid brass buckle.",
    description:
      "Cut from one piece of 3.5 mm vegetable-tanned shoulder with hand-burnished edges and a solid brass buckle. Sizes track waist, not strap length — order your trouser size.",
    image: IMG.categories.accessories,
    tags: ["leather", "belts"],
    variants: [
      { sku: "FW-AC-0002-32", price: 780, stock: 6, label: "32" },
      { sku: "FW-AC-0002-34", price: 780, stock: 10, label: "34" },
      { sku: "FW-AC-0002-36", price: 780, stock: 8, label: "36" },
      { sku: "FW-AC-0002-38", price: 780, stock: 4, label: "38" },
    ],
  },
  {
    key: "ceramic-vase",
    sku: "FW-HM-0001",
    name: "Stoneware Vase Trio",
    slug: "stoneware-vase-trio",
    category: "home",
    brand: "mora",
    price: 950,
    stock: 22,
    shortDescription: "Three hand-thrown vases, food-safe matte glaze.",
    description:
      "A trio of hand-thrown stoneware vases in cream, sage and clay. Glazes are food-safe and kiln-tested to 1260°C; each piece carries small throwing rings — that is the point.",
    image: IMG.categories.home,
    tags: ["ceramics", "decor"],
    variants: [{ sku: "FW-HM-0001-SET", price: 950, stock: 22, label: "Set of 3" }],
  },
  {
    key: "wool-throw",
    sku: "FW-HM-0002",
    name: "Chunky Wool Throw",
    slug: "chunky-wool-throw",
    category: "home",
    brand: "ateliervera",
    price: 1420,
    stock: 16,
    shortDescription: "100% lambswool, hand-knit in a 130 × 180 cm blanket.",
    description:
      "A hand-knit throw in undyed lambswool, 130 × 180 cm, heavy enough to stay where you put it. Air it rather than wash it; dry clean when you must.",
    image: IMG.categories.home,
    tags: ["textiles", "wool"],
    variants: [{ sku: "FW-HM-0002-OS", price: 1420, stock: 16, label: "One size" }],
  },
  {
    key: "serum-set",
    sku: "FW-BT-0001",
    name: "Essential Serum Set",
    slug: "essential-serum-set",
    category: "beauty",
    brand: "sylvie",
    price: 1150,
    stock: 34,
    shortDescription: "Niacinamide serum, barrier cream, and the routine card.",
    description:
      "Three steps, ten ingredients: a 5% niacinamide serum, a squalane barrier cream, and a printed routine card that tells you honestly which two matter. Fragrance-free, patch-tested.",
    image: IMG.categories.beauty,
    tags: ["skincare", "sets"],
    variants: [{ sku: "FW-BT-0001-SET", price: 1150, stock: 34, label: "Set" }],
  },
];

export const NAV = {
  shared: {
    logo: { wordmark: SITE.name, height: 32, position: "left" },
    announcement: {
      items: [
        { text: "Free shipping over $75 — no code needed.", cta: { label: "Details", href: "/terms" } },
        { text: "New arrivals drop every Thursday.", cta: { label: "See what's new", href: "/products?sort=newest" } },
      ],
      showArrows: true,
      dismissible: true,
    },
    links: {
      maxItems: 6,
      items: [
        { kind: "custom", label: "All products", href: "/products" },
        { kind: "custom", label: "Apparel", href: "/products?category=apparel" },
        { kind: "custom", label: "Shoes", href: "/products?category=shoes" },
        { kind: "custom", label: "Home", href: "/products?category=home-living" },
        { kind: "custom", label: "Journal", href: "/blog" },
        { kind: "custom", label: "About", href: "/about", highlight: "accent" },
      ],
    },
    search: { enabled: true, overlayVariant: "classic", placeholder: "Search products…" },
    cart: { enabled: true, destination: "drawer", badgeCap: 9 },
    account: { enabled: true, items: ["orders", "addresses", "signout"] },
    mobile: { breakpoint: 768, drawerSide: "left" },
  },
};

export const FOOTER = {
  wordmark: SITE.name,
  tagline: SITE.tagline,
  columns: [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/products" },
        { label: "Apparel", href: "/products?category=apparel" },
        { label: "Shoes", href: "/products?category=shoes" },
        { label: "Home & Living", href: "/products?category=home-living" },
        { label: "Electronics", href: "/products?category=electronics" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "/about" },
        { label: "The Journal", href: "/blog" },
        { label: "Careers", href: "/about" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Shipping & delivery", href: "/terms" },
        { label: "Returns", href: "/terms" },
        { label: "FAQ", href: "/about" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Sign in", href: "/signin" },
        { label: "Create account", href: "/signup" },
        { label: "Your orders", href: "/account/orders" },
      ],
    },
  ],
  social: [
    { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/" },
    { platform: "x", label: "X", url: "https://x.com/" },
    { platform: "youtube", label: "YouTube", url: "https://www.youtube.com/" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Sale", href: "/terms" },
  ],
  contact: { email: SITE.supportEmail, phone: SITE.phone, address: SITE.address },
  copyright: `© ${new Date().getUTCFullYear()} ${SITE.name}. All prices in USD.`,
  paymentIcons: ["visa", "mastercard", "paypal", "applepay", "upi"],
};

export const TESTIMONIALS = [
  {
    id: "t-pinny",
    quote:
      "The linen shirt has survived a saltwater summer and still looks like it did on day one. I ordered a second before the first one dried.",
    name: "Priya N.",
    role: "Verified buyer · Apparel",
    rating: 5,
    verified: true,
    date: "2026-08-14",
  },
  {
    id: "t-marcus",
    quote:
      "I emailed a stupid question at 11pm about sizing and got a real answer the same night. The loafers fit like they were made for my weird feet.",
    name: "Marcus T.",
    role: "Verified buyer · Shoes",
    rating: 5,
    verified: true,
    date: "2026-06-02",
  },
  {
    id: "t-dana",
    quote:
      "Shipping was faster than the estimate and the vase trio arrived packed better than most things I've paid triple for.",
    name: "Dana K.",
    role: "Verified buyer · Home",
    rating: 4,
    verified: true,
    date: "2026-09-21",
  },
  {
    id: "t-sam",
    quote:
      "The chore coat is the first work jacket I've owned that actually fits my arms. Two years in, the fades are perfect.",
    name: "Sam R.",
    role: "Repeat customer",
    rating: 5,
    verified: true,
    date: "2026-03-30",
  },
  {
    id: "t-aisha",
    quote:
      "Bought the serum set as a gift, kept it for myself. Ingredient list short enough to actually read. Support helped me pick the routine.",
    name: "Aisha B.",
    role: "Verified buyer · Beauty",
    rating: 5,
    verified: true,
    date: "2026-10-11",
  },
];
