import { createFileRoute } from "@tanstack/react-router";
import { AnewgamApp } from "@/components/anewgam/app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <AnewgamApp />;
}
