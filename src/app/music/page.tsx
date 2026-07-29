import { redirect } from "next/navigation";

export default function MusicPage() {
  redirect("/works?category=music");
}
