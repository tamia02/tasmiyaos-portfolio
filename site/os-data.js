/* TasmiyaOS content — one source for the Projects finder, the City buildings and the AI twin's answer cards. */
window.OS_DATA = {
  projects: [
    { id: "launchos", t: "launchOS", d: "One line in, a full startup launch plan out.", tags: ["AI SaaS", "Next.js"], url: "https://www.launchos.co.in/", img: "assets/work/launchos.webp", c: "coral", cat: "ai" },
    { id: "softwarehub", t: "Software Hub", d: "Marketplace for software keys, with escrow.", tags: ["Marketplace", "Escrow"], url: "https://pool.softwarehub.tech/market", img: "assets/work/softwarehub.webp", c: "gold", cat: "ai" },
    { id: "aandre", t: "Aandré Amelie", d: "Custom D2C fashion storefront.", tags: ["E-commerce", "Next.js"], url: "https://www.aandreamelie.com/", img: "assets/work/aandre.webp", c: "lilac", cat: "shop" },
    { id: "kusho", t: "Kusho", d: "Premium Shopify storefront.", tags: ["Shopify", "D2C"], url: "https://kusho.vercel.app/", img: "assets/work/kusho.webp", c: "mint", cat: "shop" },
    { id: "aarc", t: "AARC Bookkeeping", d: "Lead-generation site for a finance firm.", tags: ["Lead gen", "Finance"], url: "https://www.aarcbookkeeping.com/", img: "assets/work/aarc.webp", c: "sky", cat: "auto" },
    { id: "aether", t: "Aether Dental", d: "Clinic site with an AI bot that books visits.", tags: ["Healthcare", "AI bot"], url: "https://phenomenal-cascaron-982e78.netlify.app/", img: "assets/work/aether.webp", c: "lime", cat: "auto" },
    { id: "inquiryboost", t: "InquiryBoost", d: "WhatsApp admission automation for schools.", tags: ["WhatsApp", "Automation"], url: "https://inquiryboost.vercel.app/", img: "assets/work/inquiryboost.webp", c: "peach", cat: "auto" },
    { id: "laptophouse", t: "Laptop House", d: "Bilingual English/Hindi store for a laptop shop.", tags: ["Retail", "Bilingual"], url: "https://laptophouse-knp.vercel.app/", img: "assets/work/laptophouse.webp", c: "gold", cat: "shop" },
    { id: "pagani", t: "Pagani Experience", d: "Cinematic 3D scroll story.", tags: ["Concept", "3D web"], url: "https://stately-seahorse-c66817.netlify.app/", img: "assets/work/pagani.webp", c: "coral", cat: "ai" },
    { id: "gharleads", t: "GharLeads", d: "Lead tool for brokers — product + Hindi tutorials.", tags: ["PropTech", "Tutorials"], url: "https://gharleads.in", img: "assets/work/gharleads.webp", c: "sky", cat: "auto" }
  ],
  skills: [
    { t: "Machine learning", e: "🧠", c: "coral", chips: ["Python", "pandas", "scikit-learn"] },
    { t: "AI chat & voice agents", e: "🤖", c: "gold", chips: ["LLM agents", "WhatsApp", "LiveKit"] },
    { t: "Full-stack products", e: "💻", c: "sky", chips: ["Next.js", "TypeScript", "Laravel"] },
    { t: "Automation & growth", e: "⚙️", c: "lilac", chips: ["Node.js", "Playwright", "DM funnels"] },
    { t: "AI content & voice cloning", e: "🎙️", c: "mint", chips: ["Voice clone", "Scripts", "Motion reels"] },
    { t: "Cloud on AWS", e: "☁️", c: "lime", chips: ["Amplify", "CI/CD", "CloudFront"] }
  ],
  repos: [
    { n: "VOICEBOT", d: "AI phone agent", lang: "Python", col: "#3572A5" },
    { n: "autoposter", d: "AI content pipeline", lang: "Python", col: "#3572A5" },
    { n: "whatsappautomation", d: "WhatsApp growth agent", lang: "TypeScript", col: "#3178C6" },
    { n: "tan90erp", d: "ERP on Laravel", lang: "PHP", col: "#4F5D95" }
  ],
  contact: [
    { t: "hello@vaslix.com", url: "mailto:hello@vaslix.com", main: true },
    { t: "GitHub", url: "https://github.com/tamia02" },
    { t: "LinkedIn", url: "https://www.linkedin.com/company/vaslix" },
    { t: "vaslix.com", url: "https://vaslix.com" }
  ],
  /* The City: one building per stop, left to right. app = the window it opens. */
  city: [
    { id: "home", t: "Tasmiya’s House", d: "BTech AI/ML · 3rd year · Maharana Institute of Professional Studies", app: "about", c: "#EF9D91", w: 58, h: 46, kind: "house", e: "🏠" },
    { id: "lab", t: "Skills Lab", d: "ML · AI agents · full-stack · automation", app: "skills", c: "#F4CE6F", w: 64, h: 62, kind: "lab", e: "⚡" },
    { id: "vaslix", t: "Vaslix HQ", d: "Founder · AI agency · 9+ live products", app: "projects", c: "#94C9DE", w: 72, h: 88, kind: "tower", e: "🏢" },
    { id: "launch", t: "launchOS Rocket Pad", d: "One line in, a full launch plan out", app: "projects", project: "launchos", c: "#CEB4DD", w: 52, h: 70, kind: "rocket", e: "🚀" },
    { id: "teknoa", t: "TEKNOA Studio", d: "Daily AI-news reels in my cloned voice", app: "teknoa", c: "#FF8A4C", w: 60, h: 74, kind: "studio", e: "🎬" },
    { id: "shops", t: "Storefront Street", d: "Kusho · Aandré Amelie · Laptop House", app: "projects", project: "kusho", c: "#8ED6BE", w: 66, h: 52, kind: "shop", e: "🛍️" },
    { id: "github", t: "GitHub Garage", d: "34 public repos · mostly TypeScript", app: "github", c: "#B8B4C8", w: 60, h: 50, kind: "garage", e: "🛠️" },
    { id: "aws", t: "AWS Cloud Tower", d: "This site: GitHub → Amplify → CloudFront", app: "aws", c: "#BADB73", w: 56, h: 90, kind: "cloud", e: "☁️" },
    { id: "twin", t: "AI Twin Café", d: "Talk to my AI twin — it learns from you", app: "twin", c: "#2C9AA6", w: 62, h: 58, kind: "cafe", e: "🤖" },
    { id: "post", t: "Post Office", d: "Have an idea? Let’s build it.", app: "contact", c: "#EFA582", w: 54, h: 48, kind: "post", e: "✉️" }
  ]
};
