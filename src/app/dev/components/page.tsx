import { notFound } from "next/navigation";
import { Gallery } from "./gallery";

// Development only: lets design be reviewed without clicking through flows.
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
