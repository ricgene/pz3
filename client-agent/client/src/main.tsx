import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// src/main.ts or src/index.ts
import './index.css'; // Import CSS
import { loadEnv } from './config/env';

// Load environment variables
loadEnv();

// Your app initialization code here
console.log('App initialized with environment variables');
console.log(`App running on port ${import.meta.env.VITE_PORT || 3000}`);

createRoot(document.getElementById("root")!).render(<App />);
