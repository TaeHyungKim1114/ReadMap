import { InstagramCarousel } from "@/components/readmap/instagram-carousel"

export default function InstagramPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[540px]">
        <h1 className="text-xl font-semibold text-foreground mb-6 text-center">
          Instagram Carousel Preview
        </h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          1080x1080 Square Format
        </p>
        <InstagramCarousel />
      </div>
    </main>
  )
}
