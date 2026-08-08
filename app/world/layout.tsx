import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "67VERSE — Online World",
  description: "Explore the large 67VERSE coastal city, enter stores, and collect game items.",
};

export default function WorldLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
