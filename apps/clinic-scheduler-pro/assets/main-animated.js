// Source for Clinic Scheduler Pro browser bundle. Run `npm run clinic:scheduler:build` after editing.
const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  createContext,
  useContext
} = React;
const {
  createPortal
} = ReactDOM;
const {
  toast,
  Toaster
} = window['react-hot-toast'];
const {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  getDay,
  addDays
} = window['date-fns'];
const {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} = window.Recharts;

// Copy the rest of the content from the current index.html but with CSS animations instead of framer-motion
// This is a template showing how to use CSS animations instead

// Icon Component (same as stable version)
const Icon = ({
  name,
  size = 24,
  className = ""
}) => {
  const iconRef = useRef(null);
  useEffect(() => {
    if (iconRef.current && window.lucide) {
      const icon = window.lucide.icons[name];
      if (icon) {
        iconRef.current.innerHTML = icon.toSvg({
          size,
          class: className
        });
      }
    }
  }, [name, size, className]);
  return /*#__PURE__*/React.createElement("span", {
    ref: iconRef,
    className: "inline-flex"
  });
};
const App = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const stats = [{
    label: 'Total Attendings',
    value: 24,
    icon: 'users',
    color: 'from-blue-400 to-blue-600'
  }, {
    label: 'Total Residents',
    value: 48,
    icon: 'user-check',
    color: 'from-green-400 to-green-600'
  }, {
    label: 'This Week',
    value: 156,
    icon: 'calendar',
    color: 'from-purple-400 to-purple-600'
  }, {
    label: 'Active Rules',
    value: 12,
    icon: 'shield-check',
    color: 'from-amber-400 to-amber-600'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen animated-gradient"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "bg-white/90 backdrop-blur-sm shadow-sm animate-fade-in"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between h-16 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg animate-scale-in"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-days",
    size: 24,
    className: "text-white"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-bold text-gray-900"
  }, "Clinic Scheduler Pro"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500"
  }, "Animated Edition"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDashboard(!showDashboard),
    className: "px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all hover:scale-105"
  }, "Toggle View"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-white rounded-full animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-white font-medium"
  }, "Live")))))), /*#__PURE__*/React.createElement("main", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
  }, !showDashboard ? /*#__PURE__*/React.createElement("div", {
    className: "animate-slide-up"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl font-bold text-center text-white drop-shadow-lg mb-4"
  }, "Welcome to Clinic Scheduler Pro"), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-white/90 mb-12"
  }, "Experience beautiful animations with CSS instead of complex libraries"), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-scale-in"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold mb-6"
  }, "Key Features"), /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, ['Auto-Scheduling', 'Real-time Sync', 'AI Rules Engine'].map((feature, i) => /*#__PURE__*/React.createElement("div", {
    key: feature,
    className: "bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl animate-slide-up hover:scale-105 transition-transform cursor-pointer",
    style: {
      animationDelay: `${i * 0.1}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center mb-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i === 0 ? 'sparkles' : i === 1 ? 'refresh-cw' : 'cpu',
    size: 24,
    className: "text-white"
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-900"
  }, feature), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mt-2 text-gray-600"
  }, i === 0 ? 'Intelligent automatic scheduling with ACGME compliance' : i === 1 ? 'Firebase-powered real-time collaboration' : 'Natural language rule interpretation')))))) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fade-in"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-bold text-white drop-shadow-lg"
  }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80"
  }, "Real-time overview with beautiful animations")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
  }, stats.map((stat, index) => /*#__PURE__*/React.createElement("div", {
    key: stat.label,
    className: "animate-slide-up",
    style: {
      animationDelay: `${index * 0.1}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, stat.label), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold text-gray-900 mt-1"
  }, stat.value)), /*#__PURE__*/React.createElement("div", {
    className: `p-3 rounded-lg bg-gradient-to-br ${stat.color}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: stat.icon,
    size: 24,
    className: "text-white"
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 animate-scale-in"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "Schedule Preview"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-6 gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-gray-600"
  }, "Time"), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => /*#__PURE__*/React.createElement("div", {
    key: day,
    className: "font-medium text-gray-600 text-center"
  }, day)), ['AM', 'PM'].map((time, ti) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: time
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-gray-600"
  }, time), [0, 1, 2, 3, 4].map(day => /*#__PURE__*/React.createElement("div", {
    key: `${time}-${day}`,
    className: "h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 animate-fade-in",
    style: {
      animationDelay: `${(ti * 5 + day) * 0.05}s`
    }
  }, Math.random() > 0.5 && /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs rounded p-1"
  }, "Resident ", Math.floor(Math.random() * 10 + 1)))))))))), /*#__PURE__*/React.createElement("footer", {
    className: "mt-12 pb-8 text-center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-white/70 text-sm"
  }, "Powered by CSS Animations \u2022 No complex dependencies \u2022 Smooth & Reliable")));
};
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));

//# sourceMappingURL=main-animated.js.map