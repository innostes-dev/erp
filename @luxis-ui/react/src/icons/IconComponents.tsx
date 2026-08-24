import {
    FiX,
    FiBell,
    FiChevronDown,
    FiChevronUp,
    FiChevronLeft,
    FiChevronRight,
    FiMenu,
    FiMinus,
    FiPlus,
    FiAlertCircle,
    FiAlertTriangle,
    FiCheckCircle,
    FiCornerUpLeft,
    FiCreditCard,
    FiDownload,
    FiEye,
    FiInfo,
    FiMapPin,
    FiMessageCircle,
    FiMinusCircle,
    FiPackage,
    FiPhone,
    FiRefreshCw,
    FiShare2,
    FiShoppingBag,
    FiStar,
    FiTruck,
    FiCheck,
    FiSearch,
    FiUser,
    FiHome,
    FiShoppingCart,
    FiHeart,
    FiSettings,
    FiHelpCircle,
    FiLogOut,
    FiTrendingUp,
    FiLayers,
    FiServer,
    FiCode,
    FiZap,
    FiBarChart2,
    FiMail,
    FiFileText,
    FiArrowUp,
    FiArrowDown,
    FiFilter,
    FiChevronsLeft,
    FiChevronsRight,
    FiCalendar,
    FiBriefcase,
    FiDollarSign,
    FiActivity,
    FiDisc
} from 'react-icons/fi';
import {
    FaRupeeSign,
    FaStar,
    FaStarHalfAlt,
    FaRegStar
} from 'react-icons/fa';

export const SpinnerIcon = (props: { size?: number }) => (
    <svg
        className="lxs-multiselect-icon-spinner"
        width={props.size || 16}
        height={props.size || 16}
        viewBox="0 0 16 16"
        fill="none"
    >
        <circle
            className="lxs-multiselect-icon-spinner-track"
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            className="lxs-multiselect-icon-spinner-path"
            fill="currentColor"
            d="M8 2C4.686 2 2 4.686 2 8h2c0-2.21 1.79-4 4-4V2z"
        />
    </svg>
);

export const CheckIcon = FiCheck;

export const CloseSmallIcon = (props: { size?: number }) => (
    <svg
        width={props.size || 16}
        height={props.size || 16}
        viewBox="0 0 16 16"
        fill="none"
        className="lxs-icon-close"
    >
        <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const CalendarIcon = FiCalendar;
export const ChevronDownIcon = FiChevronDown;
export const PlusIcon = FiPlus;
export const MinusIcon = FiMinus;
export const BellIcon = FiBell;
export const MenuIcon = FiMenu;
export const ChevronUpIcon = FiChevronUp;
export const ChevronLeftIcon = FiChevronLeft;
export const ChevronRightIcon = FiChevronRight;
export const CheckCircleIcon = FiCheckCircle;
export const ErrorIcon = FiAlertCircle;
export const WarningIcon = FiAlertTriangle;
export const InfoIcon = FiInfo;
export const NeutralIcon = FiMinusCircle;
export const DownloadIcon = FiDownload;
export const PackageIcon = FiPackage;
export const ShoppingBagIcon = FiShoppingBag;
export const ShareIcon = FiShare2;
export const EyeIcon = FiEye;
export const CreditCardIcon = FiCreditCard;
export const MessageIcon = FiMessageCircle;
export const MapPinIcon = FiMapPin;
export const PhoneIcon = FiPhone;
export const TruckIcon = FiTruck;
export const CloseIcon = FiX;
export const ReturnIcon = FiCornerUpLeft;
export const RefreshIcon = FiRefreshCw;
export const StarIcon = FiStar;
export const SearchIcon = FiSearch;
export const UserIcon = FiUser;
export const HomeIcon = FiHome;
export const ShoppingCartIcon = FiShoppingCart;
export const HeartIcon = FiHeart;
export const SettingsIcon = FiSettings;
export const HelpCircleIcon = FiHelpCircle;
export const LogOutIcon = FiLogOut;
export const TrendingUpIcon = FiTrendingUp;
export const LayersIcon = FiLayers;
export const ServerIcon = FiServer;
export const CodeIcon = FiCode;
export const ZapIcon = FiZap;
export const ChartBarIcon = FiBarChart2;
export const InboxIcon = FiMail;
export const DocumentIcon = FiFileText;
export const ArrowUpIcon = FiArrowUp;
export const ArrowDownIcon = FiArrowDown;
export const FilterIcon = FiFilter;
export const ChevronsLeftIcon = FiChevronsLeft;
export const ChevronsRightIcon = FiChevronsRight;
export const BuildingIcon = FiBriefcase;
export const DollarSignIcon = FiDollarSign;
export const ActivityIcon = FiActivity;

// New Icons
export const RupeeIcon = FaRupeeSign;
export const StarFullIcon = FaStar;
export const StarHalfIcon = FaStarHalfAlt;
export const StarEmptyIcon = FaRegStar;
export const BulletIcon = FiDisc;
export const DashIcon = FiMinus;
export const XIcon = FiX;


// Error Page Icons
export const NotFoundIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="60" cy="60" r="55" stroke={props.color || 'currentColor'} strokeWidth="3" opacity="0.2" />
        <path
            d="M40 50L50 40M50 40L60 50M60 50L50 40M50 40L40 30"
            stroke={props.color || 'currentColor'}
            strokeWidth="4"
            strokeLinecap="round"
        />
        <path
            d="M70 50L80 40M80 40L90 50M90 50L80 40M80 40L70 30"
            stroke={props.color || 'currentColor'}
            strokeWidth="4"
            strokeLinecap="round"
        />
        <path
            d="M35 70C35 70 40 85 60 85C80 85 85 70 85 70"
            stroke={props.color || 'currentColor'}
            strokeWidth="4"
            strokeLinecap="round"
        />
    </svg>
);

export const ServerErrorIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="25" y="35" width="70" height="20" rx="2" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <rect x="25" y="60" width="70" height="20" rx="2" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <circle cx="35" cy="45" r="3" fill={props.color || 'currentColor'} />
        <circle cx="45" cy="45" r="3" fill={props.color || 'currentColor'} />
        <circle cx="35" cy="70" r="3" fill={props.color || 'currentColor'} />
        <circle cx="45" cy="70" r="3" fill={props.color || 'currentColor'} />
        <path
            d="M75 42L85 52M85 42L75 52"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <path
            d="M75 67L85 77M85 67L75 77"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const ForbiddenIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="60" cy="60" r="45" stroke={props.color || 'currentColor'} strokeWidth="4" />
        <path
            d="M25 60L95 60"
            stroke={props.color || 'currentColor'}
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(45 60 60)"
        />
    </svg>
);

export const SearchNotFoundIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="50" cy="50" r="30" stroke={props.color || 'currentColor'} strokeWidth="4" />
        <path
            d="M72 72L95 95"
            stroke={props.color || 'currentColor'}
            strokeWidth="4"
            strokeLinecap="round"
        />
        <path
            d="M40 45L60 45M50 35L50 55"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const MaintenanceIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M40 50L50 30L60 50L50 70L40 50Z"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M70 50L80 30L90 50L80 70L70 50Z"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <circle cx="60" cy="80" r="10" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <path
            d="M60 70V50"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const UnauthorizedIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="35" y="55" width="50" height="40" rx="3" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <path
            d="M45 55V45C45 37 50 30 60 30C70 30 75 37 75 45V55"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
        <circle cx="60" cy="75" r="5" fill={props.color || 'currentColor'} />
        <path
            d="M60 80V85"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const EmptyBoxIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M30 45L60 30L90 45V85L60 100L30 85V45Z"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M30 45L60 60L90 45"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M60 60V100"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const EmptySearchIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="50" cy="50" r="25" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <path
            d="M70 70L85 85"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
        <path
            d="M45 50H55"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
        <path
            d="M50 45V55"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export const EmptyDataIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect x="25" y="35" width="70" height="50" rx="3" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <path
            d="M25 50H95"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
        />
        <path
            d="M45 35V85"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
        />
        <circle cx="60" cy="67" r="3" fill={props.color || 'currentColor'} opacity="0.3" />
        <circle cx="75" cy="67" r="3" fill={props.color || 'currentColor'} opacity="0.3" />
        <circle cx="60" cy="77" r="3" fill={props.color || 'currentColor'} opacity="0.3" />
        <circle cx="75" cy="77" r="3" fill={props.color || 'currentColor'} opacity="0.3" />
    </svg>
);

export const EmptyNotificationIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M60 30C48 30 38 40 38 52V70L30 78H90L82 70V52C82 40 72 30 60 30Z"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M53 78V82C53 86 56 90 60 90C64 90 67 86 67 82V78"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M45 55H75"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
        <path
            d="M45 65H70"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
    </svg>
);

export const EmptyCartIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M30 30L40 35L50 75H90L95 45H42"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="55" cy="88" r="5" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <circle cx="85" cy="88" r="5" stroke={props.color || 'currentColor'} strokeWidth="3" />
        <path
            d="M65 55L75 55"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
        <path
            d="M70 50L70 60"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
    </svg>
);

export const EmptyFileIcon = (props: { size?: number; color?: string }) => (
    <svg
        width={props.size || 120}
        height={props.size || 120}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M35 25H70L85 40V95H35V25Z"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M70 25V40H85"
            stroke={props.color || 'currentColor'}
            strokeWidth="3"
            strokeLinejoin="round"
        />
        <path
            d="M45 55H75"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
        <path
            d="M45 65H70"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
        <path
            d="M45 75H65"
            stroke={props.color || 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
        />
    </svg>
);
