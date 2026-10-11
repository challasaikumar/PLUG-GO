/** Published Voltran marketing copy from voltran.in. Do not invent extra claims. */

export const voltran = {
  about: {
    kicker: "About",
    commitment: "commitment",
    title: "Voted the most reliable EV Charging Network",
    lead: "PLUG & GO is setting up state-of-art EV charge hubs across highways and cities offering seamless charging experience to EV owners.",
    commitments: [
      "15 hubs across AP & TG",
      "Multiple chargers / location",
      "Manned & Open 24 x 7",
      "60 KW DC fast chargers",
      "Multiple payment options",
      "Clean washrooms",
      "Cafeteria facility",
    ],
  },
  team: {
    kicker: "",
    title: "Team",
    people: [
      {
        name: "Ranga Rao Chitluri",
        role: "FOUNDER",
        initials: "RC",
        image: "/gallery/image%20copy%202.png",
        color: "#085e34",
        bio: "Sets the direction for PLUG & GO and the charge-hub network across highways and cities.",
      },
      {
        name: "Chalavadi Gupta Harish Kumar",
        role: "CO-FOUNDER",
        initials: "CH",
        image: "/gallery/image.png",
        color: "#0a6e3d",
        bio: "Co-founder of PLUG & GO, building the charge-hub network across highways and cities.",
      },
      {
        name: "Prasad Kollipara",
        role: "CO-FOUNDER",
        initials: "PK",
        image: "/gallery/image%20copy.png",
        color: "#008f4b",
        bio: "Co-founder of PLUG & GO, building the charge-hub network across highways and cities.",
      },
      {
        name: "Kishore Medasani",
        role: "CO-FOUNDER",
        initials: "KM",
        image: "/gallery/image%20copy%203.png",
        color: "#064e2e",
        bio: "Co-founder of PLUG & GO, building the charge-hub network across highways and cities.",
      },
      {
        name: "Kushwanth Charugundla",
        role: "CO-FOUNDER",
        initials: "KC",
        image: "/gallery/image%20copy%204.png",
        color: "#0b7a42",
        bio: "Co-founder of PLUG & GO, building the charge-hub network across highways and cities.",
      },
    ],
  },
  app: {
    kicker: "",
    title: "How PLUG & GO Works",
    lead: "Download PLUG & GO app from playstore, Create account use your car and drive by yourself. Get ride and earn more money",
    steps: [
      {
        n: "1",
        title: "View Locations",
        body: "You can view detailed station information, contact station master and navigate to the location.",
      },
      {
        n: "2",
        title: "Check Availability",
        body: "You can view the availability of the chargers on a real time basis, including power-cut update.",
      },
      {
        n: "3",
        title: "Get Coupons",
        body: "We shall push discount coupons on regular basis that you can see in the app.",
      },
      {
        n: "4",
        title: "Gain Rewards",
        body: "You can gain rewards for each charging session, download invoices, view / add cars and lot more.",
      },
    ],
  },
  offices: [
    "D.No 8-18, Ramalayam Street, Mylavaram, N.T.R Dt, Andhra Pradesh - 521230",
  ],
  officeMapQuery: "Aruna Towers, Sangeeth Nagar, Somajiguda, Hyderabad 500082",
  officeEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15226.9!2d78.4564!3d17.424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sAruna%20Towers%2C%20Sangeeth%20Nagar%2C%20Somajiguda%2C%20Hyderabad!5e0!3m2!1sen!2sin",
  blogs: {
    title: "Our Blogs",
    posts: [
      {
        slug: "what-are-electric-vehicles-testing",
        title: "What are Electric Vehicles Testing",
        author: "Raja",
      },
    ],
  },
  hubs: [
    {
      name: "PLUG & GO EV CHARGING STATION",
      area: "Andhra Pradesh",
      address: "",
      amenities: ["OPEN24-7"],
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d16560.485962181858!2d81.9728374!3d17.1465551!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTfCsDA4JzQwLjkiTiA4McKwNTgnNDAuMCJF!5e1!3m2!1sen!2sin!4v1791725273758!5m2!1sen!2sin",
      mapsQuery: "17.1465551,81.9728374",
      latitude: 17.1465551,
      longitude: 81.9728374,
    },
  ],
} as const;

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
