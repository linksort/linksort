// The demo collection: the same links the device screenshots show, so the
// page keeps telling one story. Covers are gradients (what Linksort renders
// for a link without an image) so nothing here depends on a raster.

export const LINKS = [
  {
    id: "paneer",
    title: "Paneer Ajwaini Tikka (Fresh Roasted Paneer)",
    site: "NYT Cooking",
    tag: "Food & Drink",
    folder: "Restaurants To Try",
    favorite: false,
    cover: "linear-gradient(135deg, #f2b65a 0%, #d6703a 55%, #2f3a4a 100%)",
    favicon: "#e33d2b",
  },
  {
    id: "sopranos",
    title: "Why Is Every Young Person in America Watching 'The Sopranos'?",
    site: "The New York Times",
    tag: "Arts & Entertainment",
    folder: null,
    favorite: false,
    cover: "linear-gradient(135deg, #ff9b3d 0%, #1f8a4c 60%, #0d3b2a 100%)",
    favicon: "#111111",
  },
  {
    id: "functional",
    title: "A primer on functional architecture",
    site: "increment.com",
    tag: "Computers & Electronics",
    folder: "Long Reads",
    favorite: true,
    cover:
      "repeating-linear-gradient(90deg, #e8457a 0 6px, #3fb0e8 6px 12px, #f5c542 12px 18px, #2b2b2b 18px 22px, #7bd36a 22px 28px)",
    favicon: "#111111",
  },
  {
    id: "spotlight",
    title: "To Be Happy, Hide From the Spotlight",
    site: "The Atlantic",
    tag: "People & Society",
    folder: "Long Reads",
    favorite: false,
    cover: "linear-gradient(135deg, #2b3a8f 0%, #5a63d8 50%, #e14a6a 100%)",
    favicon: "#c0392b",
  },
  {
    id: "codequality",
    title: "Code quality: a concern for businesses, bottom lines, and empathetic programmers",
    site: "Stack Overflow Blog",
    tag: "Computers & Electronics",
    folder: null,
    favorite: false,
    cover: "linear-gradient(135deg, #f26fb2 0%, #f5c542 55%, #7a4bd6 100%)",
    favicon: "#2d6cdf",
  },
  {
    id: "ressa",
    title: "The Nobel Prize Winner Maria Ressa on Fighting for Democracy",
    site: "The New Yorker",
    tag: "News",
    folder: null,
    favorite: true,
    cover: "linear-gradient(135deg, #1b1b1b 0%, #4a4a4a 60%, #8a8a8a 100%)",
    favicon: "#2d6cdf",
  },
  {
    id: "lunch",
    title: "The Best Lunch Boxes",
    site: "Wirecutter",
    tag: "Home & Garden",
    folder: null,
    favorite: false,
    cover: "linear-gradient(135deg, #a7a0e8 0%, #cfd6ff 55%, #f3a2b8 100%)",
    favicon: "#2d6cdf",
  },
  {
    id: "pho",
    title: "The Scent of Spices, and Vegan Pho, at Pho Nam",
    site: "The New Yorker",
    tag: "Food & Drink",
    folder: "Restaurants To Try",
    favorite: false,
    cover: "linear-gradient(135deg, #c9743e 0%, #6b9f3a 55%, #f0d9a8 100%)",
    favicon: "#2d6cdf",
  },
  {
    id: "marathon",
    title: "What I've Learned From Running Marathons",
    site: "The New York Times",
    tag: "Sports",
    folder: null,
    favorite: false,
    cover: "linear-gradient(135deg, #5fb6e8 0%, #3a6fd8 60%, #1b2a52 100%)",
    favicon: "#111111",
  },
]

export const TAGS = [
  "Sports",
  "Hobbies & Leisure",
  "Food & Drink",
  "Home & Garden",
  "Books & Literature",
  "News",
  "Computers & Electronics",
  "Science",
  "People & Society",
  "Arts & Entertainment",
]

export const FOLDERS = ["Restaurants To Try", "New Couch For Living Room", "Long Reads"]

// Clusters for the graph: topic nodes (triangles) and link nodes (dots),
// mirroring the app's auto-tag hierarchy and its pastel-per-cluster colors.
export const GRAPH = {
  clusters: [
    {
      color: "#78bbdd",
      topics: ["Cooking & Recipes", "Food & Drink"],
      links: ["paneer", "pho"],
    },
    {
      color: "#da9ee7",
      topics: ["Programming", "Computers & Electronics"],
      links: ["codequality", "functional"],
    },
    {
      color: "#e7a0ac",
      topics: ["Computer Science", "Science"],
      links: ["functional"],
    },
    {
      color: "#ccb233",
      topics: ["Arts & Entertainment", "TV Shows & Programs", "TV & Video"],
      links: ["sopranos"],
    },
    {
      color: "#7bd969",
      topics: ["People & Society"],
      links: ["spotlight"],
    },
    {
      color: "#e1a688",
      topics: ["Home & Garden"],
      links: ["lunch"],
    },
    {
      color: "#a7a0e8",
      topics: ["Books & Literature", "News"],
      links: ["ressa"],
    },
    {
      color: "#6ada8f",
      topics: ["Sports", "Individual Sports"],
      links: ["marathon"],
    },
  ],
}
