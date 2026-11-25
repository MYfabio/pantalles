import { redirect } from "next/navigation";

// L'editor ja no és un apartat a part: s'entra per cada pantalla. Es conserva
// l'adreça antiga perquè qui la tingui desada no trobi un error.
export default function OldPanelEditor() {
  redirect("/dashboard/screens");
}
