import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIDA — AI Agent Workspace",
  description: "Workspace per orchestrare obiettivi, agenti, progetti e attività aziendali.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
