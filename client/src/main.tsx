import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document head metadata
document.title = "Citas del Alma";
const metaViewport = document.querySelector('meta[name="viewport"]');
if (metaViewport) {
  metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0");
}

// Add description meta tag
const metaDescription = document.createElement("meta");
metaDescription.setAttribute("name", "description");
metaDescription.setAttribute("content", "Citas del Alma: Inspiración diaria, frases motivacionales y citas literarias para tu crecimiento personal.");
document.head.appendChild(metaDescription);

// Add Open Graph tags
const ogTags = [
  { property: "og:title", content: "Citas del Alma" },
  { property: "og:description", content: "Inspiración diaria, frases motivacionales y citas literarias para tu crecimiento personal." },
  { property: "og:type", content: "website" },
  { property: "og:url", content: window.location.href },
];

ogTags.forEach(tag => {
  const ogTag = document.createElement("meta");
  ogTag.setAttribute("property", tag.property);
  ogTag.setAttribute("content", tag.content);
  document.head.appendChild(ogTag);
});

createRoot(document.getElementById("root")!).render(<App />);
