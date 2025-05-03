Smart TV Media Player System

#Overview
The Smart TV Media Player System is a comprehensive solution for managing and delivering media content to smart TVs. It allows administrators to register devices, create playlists, and control media playback remotely. The system is designed to be user-friendly, scalable, and efficient, making it ideal for businesses, educational institutions, and entertainment venues.

#Features
Device Management: Register and manage smart TVs with unique IP addresses.
Media Management: Upload, organize, and manage media files (images and videos).
Playlist Management: Create and customize playlists for specific devices.
Remote Control: Control playback, volume, and other settings remotely.
Helper App: Android-based helper app for TVs to receive commands from the admin panel.
Wake-on-LAN: Remotely wake up TVs using their MAC addresses.
Responsive UI: Optimized for both desktop and mobile devices.

#Technologies Used
*Frontend
React: For building the user interface.
Next.js: For server-side rendering and API routes.
Tailwind CSS: For styling and responsive design.
Radix UI: For accessible and customizable UI components.
Lucide Icons: For modern and lightweight icons.
*Backend 
Prisma: For database ORM and schema management.
SQLite: As the default database (can be replaced with other databases).
Node.js: For server-side logic.
Next.js API Routes: For handling server-side API requests.
*Utilities
ADB (Android Debug Bridge): For controlling Android-based smart TVs.
Wake-on-LAN: For sending magic packets to wake up devices.
Embla Carousel: For creating smooth and customizable carousels.
*Helper App
Kotlin: For building the Android helper app.
Android SDK: For interacting with the TV hardware and network.
DevOps
ESLint: For code linting and maintaining code quality.
Prettier: For consistent code formatting.
Tailwind Merge: For managing Tailwind CSS class conflicts.

#Installation
1. Clone the repository:
git clone https://github.com/elfahsimounir/smart-tv-media-player.git
cd smart-tv-media-player

2. Install dependencies:
npm install

3. Set up the database:
npx prisma migrate dev --name init

4. Start the development server:
npm run dev

5. Access the app at http://localhost:3000.

Folder Structure
/components: Reusable UI components.
/app: Next.js pages and API routes.
/lib: Utility functions and helpers.
/prisma: Database schema and migration files.
/public: Static assets like images and APK files.
Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

License
This project is licensed under the MIT License.

