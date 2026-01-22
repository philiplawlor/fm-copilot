// Icon exports to fix import issues
import {
  // Lucide Icons
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Clock,
  Calendar,
  Wrench,
  Plus,
  PlusCircle,
  Search,
  Filter,
  Play,
  Pause,
  Zap,
  Upload,
  Download,
  MessageSquare,
  Paperclip,
  X,
  Settings,
  Home,
  BarChart,
  TrendingUp,
  Package,
  Truck,
  FileText,
  Users,
  Building,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Trash2,
  Copy,
  MoreVertical,
  ClipboardList
} from 'lucide-react'

// Icon aliases for compatibility
export const MagnifyingGlassIcon = Search
export const FunnelIcon = Filter
export const ClipboardDocumentListIcon = ClipboardList
export const ExclamationTriangleIcon = AlertTriangle
export const CalendarIcon = Calendar

// Try to import Tools with fallback
let ToolsIcon;
try {
  const { Tools } = require('lucide-react');
  ToolsIcon = Tools;
} catch (e) {
  console.warn('Tools icon not available, using Wrench as fallback');
  const { Wrench } = require('lucide-react');
  ToolsIcon = Wrench;
}

export { ToolsIcon as Tools };

// Icon aliases for compatibility
export const MagnifyingGlassIcon = Search
export const FunnelIcon = Filter
export const ClipboardDocumentListIcon = ClipboardList
export const ExclamationTriangleIcon = AlertTriangle
export const CalendarIcon = Calendar