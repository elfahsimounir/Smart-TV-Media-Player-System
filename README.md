📺 Smart TV Media Player System
A powerful, scalable solution for managing and delivering media content to smart TVs. Ideal for businesses, educational institutions, and entertainment venues, this system enables remote device control, playlist creation, and seamless media playback—all through a user-friendly interface.

🚀 Overview
The Smart TV Media Player System allows administrators to:

Register and manage smart TVs

Upload and organize media files

Create custom playlists

Control playback remotely

Wake devices via Wake-on-LAN

Use an Android helper app for communication with TVs

Built with scalability and ease of use in mind, this platform streamlines media distribution across multiple smart TVs.

✨ Features
📺 Device Management: Register and manage smart TVs via unique IP addresses.

🎞️ Media Management: Upload, organize, and manage media files (images & videos).

📝 Playlist Management: Create and assign custom playlists to specific devices.

🎮 Remote Control: Manage playback, volume, and settings remotely from the dashboard.

📱 Helper App: Android-based helper app that receives and executes commands on the TV.

🔌 Wake-on-LAN: Wake up TVs remotely using their MAC addresses.

📱 Responsive UI: Optimized for both desktop and mobile interfaces.

🧰 Technologies Used
🔹 Frontend
React – Building reactive UIs

Next.js – Server-side rendering & API routes

Tailwind CSS – Styling and responsive design

Radix UI – Accessible UI components

Lucide Icons – Lightweight icon set

🔹 Backend
Prisma – ORM for database access

SQLite – Default lightweight database (easily switchable)

Node.js – Backend logic

Next.js API Routes – Handle API requests

🔹 Utilities
ADB – Control Android smart TVs

Wake-on-LAN – Send magic packets to wake devices

Embla Carousel – Smooth, customizable carousels

🔹 Helper App
Kotlin – For building the Android TV helper app

Android SDK – Hardware & network interaction

🔹 DevOps
ESLint – Enforces code quality

Prettier – Auto-formats code

Tailwind Merge – Prevents Tailwind class conflicts

⚙️ Installation
bash
Copy
Edit
# 1. Clone the repository
git clone https://github.com/elfahsimounir/smart-tv-media-player.git
cd smart-tv-media-player

# 2. Install dependencies
npm install

# 3. Set up the database
npx prisma migrate dev --name init

# 4. Start the development server
npm run dev
Open your browser and navigate to http://localhost:3000 to access the app.

📁 Folder Structure
bash
Copy
Edit
/components     → Reusable UI components
/app            → Next.js pages and API routes
/lib            → Utility functions and helpers
/prisma         → Prisma schema and migrations
/public         → Static assets (images, APK files, etc.)
🤝 Contributing
Contributions are welcome!
Feel free to open an issue or submit a pull request for any feature suggestions or bug fixes.

Copyright © 2025 Mounir Elfahsi. This project and its content are the intellectual property of the author. All rights reserved.
