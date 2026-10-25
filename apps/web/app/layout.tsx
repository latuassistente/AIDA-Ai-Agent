import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA-Ai-Agent — AI Agent Workspace",
  description: "AIDA-Ai-Agent: workspace per orchestrare obiettivi, agenti, progetti e attività aziendali.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
