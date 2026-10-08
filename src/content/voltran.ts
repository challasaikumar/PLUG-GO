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
        name: "Ranga Rao",
        role: "FOUNDER",
        initials: "RR",
        image: "",
        color: "#085e34",
        bio: "Sets the direction for PLUG & GO and the charge-hub network across highways and cities.",
      },
      {
        name: "Vikram Shah",
        role: "CEO",
        initials: "VS",
        image: "",
        color: "#0a6e3d",
        bio: "Leads day-to-day operations, partners, and the experience at every manned hub.",
      },
      {
        name: "Neha Kapoor",
        role: "CTO",
        initials: "NK",
        image: "",
        color: "#008f4b",
        bio: "Builds the app, live availability, and the systems that keep DC fast chargers online.",
      },
      {
        name: "Arjun Patel",
        role: "CMO",
        initials: "AP",
        image: "",
        color: "#0b7a42",
        bio: "Tells the PLUG & GO story and grows the network of drivers who charge with us.",
      },
      {
        name: "Diya Reddy",
        role: "COO",
        initials: "DR",
        image: "",
        color: "#064e2e",
        bio: "Runs hub operations, staffing, and the 24×7 service standard at each location.",
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
    "7-50/1, 3rd Floor, GNR Heights, Ramavarappadu, Vijayawada, Andhra Pradesh - 521108",
    "#401, Aruna Towers, 6-3-661/10/1&2, Sangeeth Nagar, Somajiguda, Hyderabad - 500082",
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
      name: "Jio-bp",
      area: "Rajahmundry",
      address: "Survey No 310, Morpudi Road, Rehnath Nagar Colony, Rajamahendravaram, Andhra Pradesh 533101, India",
      amenities: ["OPEN24-7", "PARKING"],
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15261.877651845929!2d81.77276372909546!3d17.000629780615107!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a37a392286723d7%3A0x58c8cca952304d6e!2sJio-bp!5e0!3m2!1sen!2sin!4v1791451811436!5m2!1sen!2sin",
      mapsQuery: "Jio-bp Rajahmundry",
      latitude: 17.00063,
      longitude: 81.77276,
    },
    {
      name: "Tata Power Charging Station",
      area: "Rajahmundry",
      address: "XQMX+97Q, Chennai - Kolkata Hwy, Navabharat Nagar, Rajamahendravaram, Andhra Pradesh 533101, India",
      amenities: ["OPEN24-7", "PARKING"],
      embedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30628.21287295294!2d81.75598021731713!3d17.00988497152746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a37a3c4644218eb%3A0x682cd5b93f56cbad!2sTata%20Power%20Charging%20Station!5e0!3m2!1sen!2sin!4v1791451849120!5m2!1sen!2sin",
      mapsQuery: "Tata Power Charging Station Rajahmundry",
      latitude: 17.00988,
      longitude: 81.75598,
    },
  ],
} as const;

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function directionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
