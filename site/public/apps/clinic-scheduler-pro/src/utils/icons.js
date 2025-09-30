/**
 * Selective Lucide icon imports for tree-shaking optimization.
 * Only imports icons actually used in the application.
 */
import {
    AlertTriangle,
    BadgeCheck,
    BarChart,
    Bell,
    Bot,
    Calendar,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCopy,
    Cpu,
    Database,
    Download,
    FileText,
    Info,
    LayoutDashboard,
    LifeBuoy,
    ListChecks,
    LogOut,
    MapPin,
    MessageCircle,
    Pencil,
    Plus,
    RefreshCw,
    Repeat,
    Rocket,
    RotateCcw,
    Send,
    Settings,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Sparkles,
    StickyNote,
    ToggleLeft,
    ToggleRight,
    Trash,
    Trash2,
    Upload,
    User,
    UserCheck,
    UserPlus,
    Users,
    X
} from 'lucide-react';

/**
 * Icon map for dynamic icon lookup by name.
 * Keys match the kebab-case names used in the application.
 */
export const iconMap = {
    'alert-triangle': AlertTriangle,
    'badge-check': BadgeCheck,
    'bar-chart': BarChart,
    'bell': Bell,
    'bot': Bot,
    'calendar': Calendar,
    'calendar-days': CalendarDays,
    'check': Check,
    'chevron-down': ChevronDown,
    'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight,
    'clipboard-copy': ClipboardCopy,
    'cpu': Cpu,
    'database': Database,
    'download': Download,
    'file-text': FileText,
    'info': Info,
    'layout-dashboard': LayoutDashboard,
    'life-buoy': LifeBuoy,
    'list-checks': ListChecks,
    'log-out': LogOut,
    'map-pin': MapPin,
    'message-circle': MessageCircle,
    'pencil': Pencil,
    'plus': Plus,
    'refresh-cw': RefreshCw,
    'repeat': Repeat,
    'rocket': Rocket,
    'rotate-ccw': RotateCcw,
    'send': Send,
    'settings': Settings,
    'shield': Shield,
    'shield-alert': ShieldAlert,
    'shield-check': ShieldCheck,
    'shield-off': ShieldOff,
    'sparkles': Sparkles,
    'sticky-note': StickyNote,
    'toggle-left': ToggleLeft,
    'toggle-right': ToggleRight,
    'trash': Trash,
    'trash-2': Trash2,
    'upload': Upload,
    'user': User,
    'user-check': UserCheck,
    'user-plus': UserPlus,
    'users': Users,
    'x': X
};

/**
 * Get an icon component by name.
 * @param {string} name - Kebab-case icon name
 * @returns {React.ComponentType|null} - Icon component or null if not found
 */
export const getIcon = (name) => iconMap[name] || null;

export default iconMap;
