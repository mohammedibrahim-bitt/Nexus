import {
  FileText,
  Globe,
  Home,
  Info,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react'
import type React from 'react'

export const navIconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-text': FileText,
  globe: Globe,
  home: Home,
  info: Info,
  mail: Mail,
  'message-square-text': MessageSquareText,
  phone: Phone,
  search: Search,
  'shield-check': ShieldCheck,
  star: Star,
}
