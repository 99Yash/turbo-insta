import Image from "next/image";
import Link from "next/link";
import { Icons } from "~/components/icons";
import { siteConfig } from "~/config/site";

export default function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
      <Link
        href="/"
        className="absolute left-8 top-6 z-20 flex items-center text-lg font-bold tracking-tight text-foreground/80 transition-colors hover:text-foreground"
      >
        <Icons.logo className="mr-2 size-6" aria-hidden="true" />
        <span>{siteConfig.name}</span>
      </Link>
      <main className="absolute top-1/2 z-20 flex w-full -translate-y-1/2 items-center lg:static lg:left-0 lg:top-0 lg:flex lg:translate-x-0 lg:translate-y-0">
        {children}
      </main>
      <div className="relative aspect-video size-full">
        <Image
          src="/images/image.jpg"
          alt="Instagram 2024"
          fill
          className="absolute inset-0 object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-black/80 lg:to-black/40" />
      </div>
    </div>
  );
}
