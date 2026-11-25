"use client";
import { useParams } from "next/navigation";
import ScreenEditor from "@/components/panel/ScreenEditor";

export default function EditScreenPage() {
  const params = useParams();
  const id = params.id as string;
  // La clau fa que en canviar de pantalla l'editor comenci de zero.
  return <ScreenEditor key={id} screenId={id} />;
}
