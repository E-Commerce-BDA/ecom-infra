/**
 * Demo seed content — the three blog posts, three CMS pages, and the seven
 * homepage sections (plan §8). Product references use manifest *keys*; the
 * seed script resolves them to catalog ids right before writing, which is
 * exactly how the manual "Most Popular" row will work through the admin
 * panel later: content holds ids, the resolver pins order.
 */

import { IMG, SITE, TESTIMONIALS } from "./manifest.mjs";

/** One category + three published posts. Covers reuse real wave imagery. */
export const BLOG_CATEGORY = {
  name: "Journal",
  slug: "journal",
  description: "How the products are made, picked and packed — by the people doing it.",
};

export const BLOGS = [
  {
    key: "linen-does-summer",
    slug: "linen-does-summer",
    title: "Why Linen Does Summer Better Than Anything Else",
    coverUrl: IMG.heroSlide1,
    excerpt:
      "Linen is not polite: it wrinkles, it fades, it softens. That is the argument for it, not against it.",
    author: "Priya N.",
    status: "published",
    publishedAt: "2026-08-18T09:00:00Z",
    seo: {
      title: "Why Linen Does Summer Better | The foreafcbeta Journal",
      description:
        "A short, honest case for linen in hot weather — weave, wash and why the wrinkles are the point.",
    },
    content: [
      { type: "heading", id: "b1-h1", level: 2, text: "The weave is the air conditioning" },
      {
        type: "paragraph",
        id: "b1-p1",
        text:
          "Cotton holds moisture; linen sheds it. The flax fibre is hollow and the weave is deliberately loose, so a linen shirt moves air across your skin in a way a tight percale never will. Wear one at 34°C and the difference is not aesthetic, it is thermodynamic. We buy European flax spun in Portugal because that pairing — cold-water retting, wet-spun yarn — keeps the fibre long, and long fibres are what stop linen from feeling like paper after a season.",
      },
      {
        type: "image",
        id: "b1-i1",
        url: IMG.products["linen-shirt"],
        alt: "The Everyday Linen Shirt, flat-styled on a neutral background",
        caption: "The Everyday Linen Shirt, garment-washed before it ever meets a body.",
      },
      { type: "heading", id: "b1-h2", level: 2, text: "Wrinkles are not a defect" },
      {
        type: "paragraph",
        id: "b1-p2",
        text:
          "A shirt that refuses to crease is a shirt coated in something. Linen creases exactly where you bend it, and that map of creases is the record of a day actually lived in the garment. If you want to flatten it, hang the shirt in the bathroom while you shower — steam and weight do more than an iron and are kinder to the fibre. Wash cool, skip the dryer entirely, and take the shirt off the line while it is still faintly damp; linen that dries bone-hard needs to be fought back into shape.",
      },
      {
        type: "quote",
        id: "b1-q1",
        quote:
          "We pre-shrink every linen lot by 40 minutes in a hot wash before cutting. The shirt's first wash is the one it never feels.",
        cite: "Atelier Vera, cutting-floor note",
      },
      { type: "heading", id: "b1-h3", level: 2, text: "What to actually buy first" },
      {
        type: "paragraph",
        id: "b1-p3",
        text:
          "If this is your first linen anything, buy a shirt in a colour you already wear — not a colour you imagine wearing. Sand and white photograph beautifully but hide nothing; if that bothers you, an indigo stripe behaves like any shirting you already own. Two shirts beat four: linen is at its best worn, dried on the line, worn again. The wardrobe test is whether you reach for it on the hottest day without thinking. Ours passes; that is why it has been on the homepage since 2024.",
      },
    ],
  },
  {
    key: "fourteen-pieces-one-winter",
    slug: "fourteen-pieces-one-winter",
    title: "Fourteen Pieces, One Winter: The Kit We Actually Wear",
    coverUrl: IMG.heroSlide2,
    excerpt:
      "A working capsule built from what ships from our warehouse every week — no stylists, no rented samples.",
    author: "Marcus T.",
    status: "published",
    publishedAt: "2026-09-29T09:00:00Z",
    seo: {
      title: "Fourteen Pieces, One Winter | The foreafcbeta Journal",
      description:
        "A warehouse-tested winter capsule: merino, denim, canvas and the arithmetic of coats you can layer.",
    },
    content: [
      { type: "heading", id: "b2-h1", level: 2, text: "Start from the coat, not the shirt" },
      {
        type: "paragraph",
        id: "b2-p1",
        text:
          "Every winter kit fails at the outer layer first, so we build backwards. A chore coat over two knits is a working system; a wool overcoat over bulky knits is a shoulder problem. Our field coat is cut waist-length in 10 oz bonded canvas specifically so a merino crew and a hoodie both fit underneath without the arms getting swallowed. Buy the coat first, then count how many layers it actually accepts — that number is your capsule size.",
      },
      {
        type: "image",
        url: IMG.products["merino-crew"],
        id: "b2-i1",
        alt: "Oatmeal merino crew sweater on a pale grey background",
        caption: "The 12-gauge merino crew: the one knit that works under everything.",
      },
      { type: "heading", id: "b2-h2", level: 2, text: "The arithmetic we settled on" },
      {
        type: "paragraph",
        id: "b2-p2",
        text:
          "Three knits (one crew, one half-zip, one shirt-weight), two trousers (wool and cotton), one denim, one coat, one weather-proof layer, five pairs of socks, two pairs of shoes. Fourteen pieces, and the whole kit survives a laundry week. The rule we enforce when adding anything: it must combine with at least six pieces you already own, or it is a costume, not clothing. The Chelsea boot earns its slot because it is the only footwear in the kit that handles slush and a dinner reservation.",
      },
      {
        type: "quote",
        id: "b2-q1",
        quote:
          "If a piece only works with one other thing, it is an outfit, not a wardrobe. Outfits are for photographs.",
      },
      { type: "heading", id: "b2-h3", level: 2, text: "What we got wrong first" },
      {
        type: "paragraph",
        id: "b2-p3",
        text:
          "Our first capsule attempt was twelve pieces and broke by week three: one trouser was dressy-only, one knit was too fine for the coat's collar, and we had zero redundancy for coffee. The current fourteen includes deliberate overlap — two crews rather than one — because a capsule with no backup in the wash is a schedule, not a system. If you are building yours, add one spare of whatever you reach for most. That single extra item is the difference between a kit you keep and a kit you abandon by January.",
      },
    ],
  },
  {
    key: "who-makes-your-shirt",
    slug: "who-makes-your-shirt",
    title: "Who Makes Your Shirt (and How We Check)",
    coverUrl: IMG.aboutBanner,
    excerpt:
      "Every partner factory on our floor, audited on a fixed calendar. Here is what the audit actually looks at.",
    author: "Dana K.",
    status: "published",
    publishedAt: "2026-10-22T09:00:00Z",
    seo: {
      title: "Who Makes Your Shirt — The foreafcbeta Vendor Audit",
      description:
        "How the foreafcbeta vendor audit works: wage slips, hours logs, and the three things we walk out over.",
    },
    content: [
      { type: "heading", id: "b3-h1", level: 2, text: "The visit nobody films" },
      {
        type: "paragraph",
        id: "b3-p1",
        text:
          "Our audit is two days, unannounced, on a six-month clock for every partner. Day one is paperwork that cannot be staged: twelve months of wage slips cross-checked against hours logs and attendance sheets. We are looking for the arithmetic to close — the totals matching, the overtime paid at the right rate, the deductions being legal ones. Three factories have failed this on the first pass; two of them passed on re-audit after fixing payroll, and those two still make our denim.",
      },
      {
        type: "image",
        id: "b3-i1",
        url: IMG.categories.apparel,
        alt: "Folded apparel arranged on a studio surface",
        caption: "Apparel floor, Porto — one of six partner units on the calendar.",
      },
      { type: "heading", id: "b3-h2", level: 2, text: "Day two: talking on the floor" },
      {
        type: "paragraph",
        id: "b3-p2",
        text:
          "Day two is walking the line and asking random-seated operators the boring questions: how do you clock out, when did the exhaust fans get fixed, who do you tell when a supervisor is wrong. Boring questions surface what checklists miss. We walk out over exactly three things — blocked fire exits, withheld documents, falsified hours — and we do not sign a new order until it is fixed, no matter the season. That rule has cost us two delivery windows in four years; both are documented publicly in the vendor report we publish each January.",
      },
      {
        type: "quote",
        id: "b3-q1",
        quote:
          "A certificate on a wall is marketing. A wage slip that matches an attendance sheet is compliance.",
        cite: "Sourcing notes, Q3 audit",
      },
      { type: "heading", id: "b3-h3", level: 2, text: "Why this is on a shop's blog" },
      {
        type: "paragraph",
        id: "b3-p3",
        text:
          "Because the answer should be boring. Most of what we do is not revolutionary — pick good partners, check them on a calendar, publish what the check found, fix what broke. The reason this page exists is that the fixes are the credible part. Two factories failed wage arithmetic, got on a paid remediation schedule, and are still shipping to us. If every brand published its re-audits instead of only its launches, 'sustainably made' would stop meaning nothing. Our full partner list with addresses is in the footer of every order email, not behind a press release.",
      },
    ],
  },
];

/** about/privacy/terms — real policy copy, rich_text bodies stay inside the
 * sanitizer's allowlist (p/h2/ul/li/strong/em/a). */
export const PAGES = [
  {
    slug: "about",
    title: "About foreafcbeta",
    isActive: true,
    seo: {
      title: "About us | foreafcbeta",
      description:
        "Who we are, how we pick partners, and what happens when something we sell breaks.",
    },
    blocks: [
      {
        type: "image",
        id: "ab-img",
        url: IMG.aboutBanner,
        alt: "The foreafcbeta studio: worktables with fabric swatches and sample boxes",
        caption: "The studio floor where every sample gets worn before it gets sold.",
      },
      {
        type: "rich_text",
        id: "ab-story",
        body: [
          "<p>foreafcbeta started in 2021 as one question: why is it so hard to buy a shirt you can picture wearing in year three? We build a small catalogue — 14 products on this demo floor, never more than we can personally check — around things that answer it: linen that softens, denim that fades honestly, knitwear that is fully fashioned instead of cut-and-sewn.</p>",
          "<h2>How we pick what to sell</h2>",
          "<p>Every product starts as a sample that lives with someone on the team for one full season. If it fails — a seam, a zipper, a collar that goes wavy in the wash — it does not launch, and the reason goes in the product notes so the next attempt learns from it. We work with six partner units; the two we cannot name for contractual reasons ship under the four we can.</p>",
          "<h2>What happens when something breaks</h2>",
          "<p>You email <a href=\"/privacy\">support</a> with the order number. Within the return window it is a refund or a replacement, your choice, and we cover the label. Outside the window, if the failure is the make and not the misuse, we still fix it — repair credit, spare parts, or a discount on the improved version. That policy has a cost and we pay it, because a shop whose repairs depend on your goodwill has already decided to lose you.</p>",
        ].join(""),
      },
      {
        type: "cta",
        id: "ab-cta",
        title: "See the catalogue",
        ctas: [
          { id: "ab-cta-1", text: "Browse products", link: "/products" },
          { id: "ab-cta-2", text: "Read the Journal", link: "/blog" },
        ],
      },
      {
        type: "faq",
        id: "ab-faq",
        items: [
          {
            question: "Where are your products made?",
            answer:
              "Apparel and leather in Porto, Portugal; denim in a partner unit in Ahmedabad, India; ceramics in the same studio as the founder's kiln; skincare is formulated and filled in Basel. The full partner list with addresses ships at the bottom of every order confirmation email.",
          },
          {
            question: "Do you have physical stores?",
            answer:
              "No. Everything ships from the San Francisco warehouse, and the return window is 30 days with a prepaid label, so trying things at home is the shop floor.",
          },
          {
            question: "Can I work with you?",
            answer:
              "We buy from audited partners and hire from people who can show what they made. Send a link to something real rather than a CV — the inbox is on the Contact page linked in the footer.",
          },
          {
            question: "Why is the catalogue so small?",
            answer:
              "Because the checking is manual. Every product on this site has been worn, washed and failed or passed a season test by a named person. We would rather restock fourteen things we vouch for than sell four hundred we cannot.",
          },
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    isActive: true,
    seo: {
      title: "Privacy Policy | foreafcbeta",
      description:
        "What this store collects, why it collects it, who else sees it and how to get it deleted.",
    },
    blocks: [
      {
        type: "rich_text",
        id: "pr-body",
        body: [
          "<p>Last updated: 1 November 2026. This policy is written for the shop you are in: it lists exactly what the storefront, the order system and the shipping warehouse keep, and what they never keep. No marketing filler, no jurisdiction hedge — if a clause does not apply to how this store actually runs, it is not here.</p>",
          "<h2>What we collect</h2>",
          "<ul><li><strong>Account data</strong> — your email, name and password hash when you register. Passwords are stored as argon2id hashes; nobody, including us, can read them back.</li><li><strong>Order data</strong> — shipping address, items, amounts and the order timeline. This is kept as long as tax and consumer law require it (7 years in most jurisdictions we sell into), then it is deleted, not archived.</li><li><strong>Cart data</strong> — for guests, a random cart identifier cookie (<em>sf_cid</em>) that exists only to hold your cart between visits. It is not tied to your browser fingerprint and it is not used for advertising.</li><li><strong>Session data</strong> — short-lived access tokens and one rotating refresh token. Signing out of the site revokes the refresh family server-side.</li></ul>",
          "<h2>What we do not collect</h2>",
          "<p>No third-party advertising pixels, no session replay, no cross-site trackers. Analytics on this storefront are self-hosted and count page views, not people. Payment card numbers never touch our servers — the payment processor hands us a result, not a PAN.</p>",
          "<h2>Who sees your data</h2>",
          "<ul><li>Warehouse staff, for picking and shipping, seeing the order and the address and nothing else of your history.</li><li>Our payment and shipping processors under data-processing agreements; they may not use your data for anything but the job we sent it for.</li><li>Nobody else, and we do not sell or rent any list, ever, including a mailing list we do not have.</li></ul>",
          "<h2>Your controls</h2>",
          "<p>Email support with your account's address and one sentence and we will: export everything we store about you in JSON, correct anything wrong, or delete the account plus cart and session data immediately, with order records expiring when their legal retention window does. We answer within 30 days, and most requests land the same week because the systems were built to make it one query.</p>",
          "<h2>Children</h2>",
          "<p>This shop does not knowingly allow under-16 accounts. If we learn one exists, we delete it and any linked orders' personal fields on the next retention pass.</p>",
          "<h2>Changes</h2>",
          "<p>If this policy changes in a way that affects what we keep, the version date above moves and we email account holders before it takes effect. Changes to wording that does not alter the substance get no announcement, because that would be noise.</p>",
          "<p>Questions go to <a href=\"/about\">the contact route in the footer</a> — use the subject line PRIVACY so it skips the sales queue.</p>",
        ].join(""),
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Sale",
    isActive: true,
    seo: {
      title: "Terms of Sale | foreafcbeta",
      description:
        "The deal, plainly: prices, what we accept, shipping, the 30-day return window and the two limits on liability.",
    },
    blocks: [
      {
        type: "rich_text",
        id: "tr-body",
        body: [
          "<p>Last updated: 1 November 2026. These are the terms of a sale from this store to you. They are written short on purpose; where the law of your country adds rights we cannot contract out of, you keep them — this page cannot take anything away that a statute gave you.</p>",
          "<h2>1. Prices and availability</h2>",
          "<p>Prices are listed in USD and include applicable duties for the markets we ship to; the total at checkout is the total. If a listed price is wrong because of a typo or a sync failure, we contact you before charging anything and you choose whether to keep the order. Stock counts are live against the warehouse, but two orders can race; if the item you ordered sold out mid-checkout, you are refunded the difference or the full amount within one business day.</p>",
          "<h2>2. Your order and ours</h2>",
          "<p>Placing an order is your offer to buy. A contract forms when the order confirmation email is sent — not when you check out. We may decline an order for pricing errors, suspected fraud, or export restrictions; if we decline after charging, the refund is immediate.</p>",
          "<h2>3. Shipping</h2>",
          "<p>Domestic orders ship within one business day, international within three, both excluding weekends and the two public-holiday weeks we publish each January. Free over $75; otherwise the rate is shown before payment. Risk passes to you on delivery unless your consumer law says otherwise.</p>",
          "<h2>4. Returns and the promise after</h2>",
          "<p>30 days from delivery for an unused item with tags: full refund, prepaid label in the confirmation email. Wear it, wash it, and the return window closes — but the make promise does not: if the item fails as a make within one year, email us a photo and we repair, replace or credit it, at your choice, whatever the calendar says. That is a policy, not a favour, and it is why the catalogue is small.</p>",
          "<h2>5. Gift cards and code</h2>",
          "<p>Gift card balances are not cash, do not expire for five years, and are not redeemable for cash except where a state law requires it. Store code and content on this site belong to us or our partners; screenshots for reviews and honest complaints are explicitly allowed.</p>",
          "<h2>6. The two limits</h2>",
          "<p>Our total liability on any order is capped at what you paid for it. We are not liable for foreseeable-but-indirect losses (a missed trip because a package was late is our apology, not our invoice). Neither limit touches personal injury caused by our negligence or fraud — those cannot be capped, and we do not pretend to.</p>",
          "<p>Disputes go to the courts of the state where our warehouse sits, unless your consumer law gives you a home-court right, which it does, and you may use it. Contact for anything here: the footer form, subject TERMS.</p>",
        ].join(""),
      },
      {
        type: "faq",
        id: "tr-faq",
        items: [
          {
            question: "Can I change my address after ordering?",
            answer:
              "Until the order enters picking — usually a few hours — email support with the order number and we change it. After that, the parcel is where the label says it is.",
          },
          {
            question: "Do you ship worldwide?",
            answer:
              "To most markets; the checkout computes duties and shows the landed price before you pay, and a short list of embargoed destinations is refused at checkout, not after.",
          },
          {
            question: "What is not returnable?",
            answer:
              "Skincare once the seal is broken, for obvious reasons. Everything else follows the 30-day window above.",
          },
        ],
      },
    ],
  },
];

export const PDP_TRUST_ITEMS = [
  {
    id: "trust-shipping",
    icon: "truck",
    title: "Free shipping",
    description: "Complimentary standard delivery on orders over $50",
  },
  {
    id: "trust-returns",
    icon: "returns",
    title: "Effortless returns",
    description: "30-day complimentary returns and exchanges",
  },
  {
    id: "trust-secure",
    icon: "shield-check",
    title: "Secure checkout",
    description: "256-bit SSL encrypted member transactions",
  },
];

export const PDP_FAQ_ITEMS = [
  {
    question: "How fast is delivery?",
    answer:
      "Orders ship within 48 hours. Standard delivery is free above $50 and typically arrives in 3–5 business days; express options appear at checkout.",
  },
  {
    question: "Can I return this?",
    answer:
      "Yes — 30 days, no questions asked, as long as it has not been worn or washed. Start a return from your account and we provide a prepaid label.",
  },
  {
    question: "How does sizing run?",
    answer:
      "True to size with a relaxed cut on most garments. If you are between sizes, size down for a closer fit or up for layering room.",
  },
  {
    question: "How should I care for it?",
    answer:
      "Machine wash cold on gentle, tumble dry low. The care label on the garment is the source of truth for anything more specific.",
  },
];

/**
 * PDP template. `pdp-default` is a materialized blueprint: the seed clones
 * it into `pdp-<product.id>` through the admin clone endpoint. It is never
 * read by the storefront at runtime. Description/details intentionally
 * carry no CMS override, so the catalog is the default source.
 */
export function buildPdpTemplateSections() {
  return [
    {
      key: "pdp-default-description",
      pageKey: "pdp-default",
      type: "pdp_description",
      title: "PDP description",
      content: { title: "Description" },
      settings: {},
    },
    {
      key: "pdp-default-details",
      pageKey: "pdp-default",
      type: "pdp_details",
      title: "PDP details",
      content: { title: "Details" },
      settings: {},
    },
    {
      key: "pdp-default-trust",
      pageKey: "pdp-default",
      type: "pdp_trust",
      title: "PDP trust",
      content: { title: `The ${SITE.name} promise`, items: PDP_TRUST_ITEMS },
      settings: {},
    },
    {
      key: "pdp-default-reviews",
      pageKey: "pdp-default",
      type: "pdp_reviews",
      title: "PDP reviews",
      content: { title: "Reviews", items: [] },
      settings: {},
    },
    {
      key: "pdp-default-story",
      pageKey: "pdp-default",
      type: "pdp_story",
      title: "PDP story",
      content: {
        title: "Why we make it this way",
        body: "<p>We wear every style before we sell it. If it does not survive a real winter, a real summer, and a real wash, it does not ship.</p><p><strong>Fewer, better things.</strong> That is the whole strategy.</p>",
        image: IMG.aboutBanner,
        imageAlt: "The studio bench where every style is wear-tested",
      },
      settings: { layout: "image-right" },
    },
    {
      key: "pdp-default-faq",
      pageKey: "pdp-default",
      type: "pdp_faq",
      title: "PDP FAQ",
      content: { title: "Questions", items: PDP_FAQ_ITEMS },
      settings: { layout: "accordion" },
    },
    {
      key: "pdp-default-related",
      pageKey: "pdp-default",
      type: "pdp_related",
      title: "PDP related",
      content: { title: "You may also like", source: "category", layout: "grid" },
      settings: { maxItems: 8 },
    },
  ];
}

/** Demo reviews by product manifest key. They are CMS-authored quotes; the
 * `verified` flag stays absent unless a review is genuinely verified. */
export const PDP_REVIEWS_BY_PRODUCT_KEY = {
  "linen-shirt": [
    {
      id: "rev-1",
      name: "Julian M.",
      rating: 5,
      quote: "The breathability and drape of this linen are unmatched. Perfect for summer days and casual evenings.",
    },
    {
      id: "rev-2",
      name: "Claire D.",
      rating: 5,
      quote: "Incredible quality. Fits true to size with a nice relaxed feel. Wears and washes beautifully.",
    },
    {
      id: "rev-3",
      name: "David S.",
      rating: 4,
      quote: "Great linen shirt. The color is rich and buttons feel substantial.",
    },
  ],
  "merino-crew": [
    {
      id: "rev-4",
      name: "Sophie L.",
      rating: 5,
      quote: "Super soft merino that doesn't itch at all. Warm without being bulky.",
    },
    {
      id: "rev-5",
      name: "Aaron K.",
      rating: 5,
      quote: "Worn on several business trips. Packs well, looks sharp and breathes effortlessly.",
    },
  ],
};

/**
 * Homepage sections plus the PDP template, in the shipped order
 * (plan §6): hero → newest → showcase → brand marquee → testimonials →
 * manual most-popular → blog teaser → PDP template. `productKeys`/`postKeys`
 * are resolved to ids by the seed script.
 */
export function buildSections(ctx) {
  const popularKeys = ["merino-crew", "loafer", "chelsea-boot", "denim-jacket", "ceramic-vase", "serum-set"];
  const heroSlides = [
    {
      id: "slide-morning",
      eyebrow: "New season",
      headline: "Clothes that keep their promise past summer",
      subcopy: "Linen, merino and honest denim — checked by hand, worn before sold.",
      image: IMG.heroSlide1,
      imageAlt: "A shopper walking a sunlit street in a linen outfit",
      ctas: [
        { id: "slide-1-cta-1", text: "Shop the catalogue", link: "/products" },
        { id: "slide-1-cta-2", text: "Read the Journal", link: "/blog" },
      ],
    },
    {
      id: "slide-flatlay",
      eyebrow: "Winter kit",
      headline: "Fourteen pieces. One winter. No costume.",
      subcopy: "The layering system our warehouse team actually wears.",
      image: IMG.heroSlide2,
      imageAlt: "Overhead flat-lay of knitwear, sneakers and home accents",
      ctas: [
        { id: "slide-2-cta-1", text: "Build the kit", link: "/products?category=apparel" },
      ],
    },
  ];

  return [
    {
      key: "hero-homepage",
      pageKey: "homepage",
      type: "hero",
      title: "Homepage hero",
      content: { slides: heroSlides },
      settings: { height: "auto", ratio: "4:3" },
    },
    {
      key: "new-products",
      pageKey: "homepage",
      type: "featured_products",
      title: "New this week",
      content: { title: "New this week", source: "newest", layout: "grid" },
      settings: { maxItems: 8, ratio: "3:4", gutter: 20 },
    },
    {
      key: "shop-categories",
      pageKey: "homepage",
      type: "category_showcase",
      title: "Shop by category",
      content: {
        title: "Shop by category",
        categoryIds: ctx.categoryIds,
      },
      settings: { maxItems: 6, showPhotos: true },
    },
    {
      key: "brand-marquee",
      pageKey: "homepage",
      type: "brand_strip",
      title: "The partners we make with",
      content: {
        title: "Who makes it",
        items: ctx.brandItems,
      },
      settings: { motion: "marquee", speed: 60, direction: "left", pauseOnHover: true },
    },
    {
      key: "customer-reviews",
      pageKey: "homepage",
      type: "testimonial",
      title: "What buyers say",
      content: { title: "What buyers say", items: TESTIMONIALS },
      settings: { layout: "grid" },
    },
    {
      key: "most-popular",
      pageKey: "homepage",
      type: "featured_products",
      title: "Most popular",
      content: {
        title: "Most popular",
        source: "manual",
        productIds: popularKeys.map((k) => ctx.productIds[k]).filter(Boolean),
        layout: "grid",
      },
      settings: { maxItems: 8, ratio: "3:4" },
    },
    {
      key: "journal-teaser",
      pageKey: "homepage",
      type: "blog_teaser",
      title: "From the Journal",
      content: {
        title: "From the Journal",
        // postIds is intentionally omitted: cms blog ids are Mongo ObjectIds,
        // not UUIDs, so the 1.12.0 `postIds: uuid[]` contract cannot carry them.
        // The storefront resolver treats empty postIds as "latest published",
        // and count:3 pins exactly the three seeded posts. Curation by id is a
        // follow-up once the contract widens postIds to ObjectId-or-UUID.
        count: 3,
      },
      settings: { maxItems: 3 },
    },
    ...buildPdpTemplateSections(),
  ];
}
