/** Local photos already on the site. Titles describe the picture only. */

export type GalleryItem = {
  id: number;
  url: string;
  title: string;
};

export const galleryItems: GalleryItem[] = [
  { id: 3, url: "/journey/charge.png", title: "Charge" },
  {
    id: 4,
    url: "/nikol-ev.assets.Woblo/120%20panel%20top_page-0001.jpg",
    title: "PLUG & GO panel",
  },
  { id: 5, url: "/gallery/image%20copy%202.png", title: "Ranga Rao Chitluri" },
  { id: 6, url: "/gallery/image%20copy%203.png", title: "Kishore Medasani" },
  { id: 7, url: "/gallery/image%20copy%204.png", title: "Kushwanth Charugundla" },
  { id: 8, url: "/gallery/image%20copy.png", title: "Prasad Kollipara" },
];
