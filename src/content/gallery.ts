/** Local photos already on the site. Titles describe the picture only. */

export type GalleryItem = {
  id: number;
  url: string;
  title: string;
};

export const galleryItems: GalleryItem[] = [
  { id: 1, url: "/gallery/evening-charge.jpg", title: "Evening charge" },
  { id: 2, url: "/gallery/dc-fast-charger.jpg", title: "DC fast charger" },
  { id: 3, url: "/gallery/site-charger.jpg", title: "Site charger" },
  { id: 4, url: "/journey/find.png", title: "Find" },
  { id: 5, url: "/gallery/charge-bay.jpg", title: "Charge bay" },
  { id: 6, url: "/nikol-ev.assets.Woblo/evimage.webp", title: "PLUG & GO app" },
  { id: 7, url: "/journey/arrive.png", title: "Arrive" },
  { id: 8, url: "/gallery/highway-stop.jpg", title: "Highway stop" },
  { id: 9, url: "/gallery/open-bay.jpg", title: "Open bay" },
  { id: 10, url: "/journey/charge.png", title: "Charge" },
  { id: 11, url: "/gallery/covered-bay.jpg", title: "Covered bay" },
  { id: 12, url: "/gallery/manned-hub.jpg", title: "Manned hub" },
  { id: 13, url: "/gallery/charge-point.jpg", title: "Charge point" },
  { id: 14, url: "/gallery/station-canopy.jpg", title: "Station canopy" },
];
