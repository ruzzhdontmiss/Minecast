// src/data/videos.ts

export interface Video {
  id: number;
  src: string;
  title: string;
  description: string;
  rarityScore?: number; // 0-100 rarity score
  likes?: number; // Number of likes
  comments?: number; // Number of comments
}

// We are now pointing to our local files in the /public folder.
// Next.js automatically knows that "/" means the "public" folder.
export const MOCK_VIDEOS: Video[] = [
  {
    id: 1,
    src: "/videos/video1.mp4",
    title: "@art_lover",
    description: "Close-up of an artist painting on canvas. #art #painting",
    rarityScore: 92,
    likes: 1200,
    comments: 342
  },
  {
    id: 2,
    src: "/videos/video2.mp4",
    title: "@city_vibes",
    description: "A beautiful timelapse of city traffic at night. #city #timelapse",
    rarityScore: 65,
    likes: 850,
    comments: 189
  },
  {
    id: 3,
    src: "/videos/video3.mp4",
    title: "@nature_explorer",
    description: "Finding my peace in the woods. #nature #forest #sunlight",
    rarityScore: 45,
    likes: 320,
    comments: 56
  },
  {
    id: 7,
    title: "@cosmic_creator",
    description: "Big Buck Bunny — the classic 🐰",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    rarityScore: 95,
    likes: 4821,
    comments: 312
  },
  {
    id: 8,
    title: "@elephantdreams",
    description: "Elephants Dream open source film ✨",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    rarityScore: 82,
    likes: 2934,
    comments: 187
  },
  {
    id: 9,
    title: "@blazerunner",
    description: "For Bigger Blazes 🔥",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    rarityScore: 71,
    likes: 1823,
    comments: 94
  },
  {
    id: 10,
    title: "@offroad_king",
    description: "Subaru on dirt roads 🚗",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    rarityScore: 55,
    likes: 987,
    comments: 43
  },
  {
    id: 11,
    title: "@tearsoftime",
    description: "Tears of Steel — sci-fi short film 🤖",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    rarityScore: 88,
    likes: 3201,
    comments: 221
  },
  {
    id: 12,
    title: "@minecaster",
    description: "Welcome to MineCast 🌐",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    rarityScore: 99,
    likes: 9999,
    comments: 512
  }
];