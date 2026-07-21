import {
  ClipboardList,
  Contact,
  File,
  Folder,
  Image,
  Inbox,
  MessageSquareText,
  Newspaper,
  PanelBottom,
  PanelTop,
  Search,
  Shuffle,
  Tag,
  Users,
} from 'lucide-react'
import type React from 'react'

// Keyed by collection/global slug, used to inject an icon next to the
// matching nav link and dashboard card via stable `#nav-{slug}` /
// `#card-{slug}` ids that Payload's admin panel already renders.
export const entityIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  categories: Tag,
  customers: Contact,
  'form-submissions': Inbox,
  forms: ClipboardList,
  folders: Folder,
  footer: PanelBottom,
  header: PanelTop,
  media: Image,
  pages: File,
  posts: Newspaper,
  redirects: Shuffle,
  reviews: MessageSquareText,
  search: Search,
  users: Users,
}
