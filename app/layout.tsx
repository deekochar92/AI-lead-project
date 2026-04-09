import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeadPilot | AI Lead Qualification",
  description: "Create branded lead forms and score inquiries automatically."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
