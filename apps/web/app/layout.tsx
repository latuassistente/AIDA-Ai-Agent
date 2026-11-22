import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegister from "./components/service-worker-register";

export const metadata: Metadata = {
  title: "AIDA-Ai-Agent — AI Agent Workspace",
  description: "AIDA-Ai-Agent: workspace SaaS per orchestrare obiettivi, agenti, progetti e attività aziendali.",
  applicationName: "AIDA-Ai-Agent",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AIDA", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#102a43",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
