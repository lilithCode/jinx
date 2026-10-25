export type Pack = { id: string; name: string; icon: string; dares: string[] };

export const PACKS: Pack[] = [
  {
    id: "sleepover",
    name: "Sleepover",
    icon: "🛏️",
    dares: [
      "Do your best runway walk to the kitchen and back.",
      "Speak only in a whisper until your next turn.",
      "Let the group restyle your hair. You keep it for 10 minutes.",
      "Do a dramatic reading of the last text you sent.",
      "Show the 5th photo in your camera roll. No skipping.",
      "Let someone post one emoji of their choice on your story.",
    ],
  },
  {
    id: "call",
    name: "Online call",
    icon: "💻",
    dares: [
      "Change your call name to whatever the group picks.",
      "Grab the weirdest object within reach and give it a sales pitch.",
      "Turn your camera into a puppet show for 30 seconds.",
      "Read your most recent search history entry out loud.",
      "Send a voice note singing the chorus of a song the group picks.",
    ],
  },
  {
    id: "food",
    name: "Food dares",
    icon: "🍋",
    dares: [
      "Eat a spoonful of something from the fridge, chosen by the group.",
      "Bite a lemon slice without making a face.",
      "Describe your last meal like a fancy food critic.",
      "Make a mini sandwich with three ingredients the group picks.",
    ],
  },
  {
    id: "wholesome",
    name: "Wholesome",
    icon: "🫶",
    dares: [
      "Give everyone in the room a sincere compliment.",
      "Text a friend you haven't talked to in a while.",
      "Tell the story of how you met the person on your left.",
      "Draw a portrait of another player in 60 seconds.",
    ],
  },
];
