import { redirect } from 'next/navigation';

// Root page — middleware handles locale routing, this is a safety fallback
export default function RootPage() {
  redirect('/en');
}
