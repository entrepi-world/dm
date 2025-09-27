export const metadata = {
  title: "mitochondria — decisions, made clearer",
  description: "Break down choices into four perspectives.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-black text-white" style={{ fontFamily: 'Atkinson Hyperlegible, system-ui, sans-serif' }}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
