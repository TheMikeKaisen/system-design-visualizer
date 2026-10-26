import { type EpisodeMetadata } from "@/components/ui/EpisodeCard";
import { Play, Globe, Search, ShieldCheck, Binary, Box, Layers, Wrench } from "lucide-react";

export const JAVA_EPISODES: EpisodeMetadata[] = [
  {
    id: "java-flow-of-execution",
    episodeNumber: 1,
    title: "Java Code Execution",
    description:
      "Follow a piece of Java code from source file to bytecode, through the JVM, and down to the CPU in a fully interactive canvas.",
    date: "7 July 2026",
    href: "/java/canvas/flow-of-execution",
    icon: <Play className="w-5 h-5" />,
    accent: "emerald",
  },
  {
    id: "java-platform-independence",
    episodeNumber: 2,
    title: "How Can The Same Program Run Everywhere?",
    description:
      "Understand why Hello.class runs on Windows, Linux, and macOS without recompiling — and watch it cross the platform boundary live.",
    date: "7 July 2026",
    href: "/java/canvas/platform-independence",
    icon: <Globe className="w-5 h-5" />,
    accent: "emerald",
  },
  {
    id: "java-class-loading",
    episodeNumber: 3,
    title: "How Does Java Find Classes?",
    description:
      "When you run java Hello, where does the JVM look? Understand the class path, external JARs, and why java.lang.String doesn't need to be downloaded.",
    date: "9 July 2026",
    href: "/java/canvas/how-java-loads-classes",
    icon: <Search className="w-5 h-5" />,
    accent: "emerald",
  },
  {
    id: "java-class-lifecycle",
    episodeNumber: 4,
    title: "The Class Lifecycle",
    description:
      "Loading, Linking, and Initialization. Watch how the JVM prepares a class before you can even create an object.",
    date: "10 July 2026",
    href: "/java/canvas/class-lifecycle",
    icon: <ShieldCheck className="w-5 h-5" />,
    accent: "emerald",
  },
  {
    id: "java-typecasting",
    episodeNumber: 5,
    title: "Primitive Typecasting",
    description:
      "Master implicit widening, explicit narrowing, sign extension, and arithmetic promotion through interactive bit surgery!",
    date: "30 July 2026",
    href: "/java/simulator/typecasting",
    icon: <Binary className="w-5 h-5" />,
    accent: "emerald",
    badge: "Interactive",
  },
  {
    id: "java-arrays",
    episodeNumber: 6,
    title: "Java Arrays in Memory",
    description:
      "A deep dive into how Java allocates and manages arrays in the heap. Includes multidimensional arrays and garbage collection.",
    date: "30 July 2026",
    href: "/java/simulator/arrays",
    icon: <Box className="w-5 h-5" />,
    accent: "emerald",
    badge: "Interactive",
  },
  {
    id: "java-oop-basics",
    episodeNumber: 7,
    title: "Object Oriented Programming",
    description:
      "Visualize how objects are created in the Heap, how reference variables track them in the Stack, and trace method executions live.",
    date: "31 July 2026",
    href: "/java/simulator/oop-basics",
    icon: <Layers className="w-5 h-5" />,
    accent: "emerald",
    badge: "Interactive",
  },
  {
    id: "java-constructors",
    episodeNumber: 8,
    title: "Java Constructors",
    description:
      "Learn about default and parameterized constructors, overloading, and the difference between instance and local variables.",
    date: "31 July 2026",
    href: "/java/simulator/constructors",
    icon: <Wrench className="w-5 h-5" />,
    accent: "emerald",
    badge: "Interactive",
  },
];
