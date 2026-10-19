import "./globals.css";

export const metadata = {
  title: "Nova AI",
  description: "Nova AI, a simple AI assistant powered by Google Gemini",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
