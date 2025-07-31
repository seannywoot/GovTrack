import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "./lib/i18n";
import { useAccessibility } from "./lib/accessibility";
import { usePageTracking, useInteractionTracking } from "./lib/analytics";
import { title } from "process";

// Types
interface Budget {
  id: string;
  department: string;
  category: string;
  allocated: number;
  spent: number;
  region: string;
  lastUpdated: string;
}

interface Project {
  id: string;
  name: string;
  department: string;
  budget: number;
  spent: number;
  status: "On Track" | "Delayed" | "Completed" | "At Risk";
  progress: number; // 0-100
  startDate: string;
  endDate: string;
  region: string;
  description: string;
  updatedAt: string;
  risk: number; // 0-100
}

interface Expenditure {
  id: string;
  projectId?: string;
  department: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface IrregularityReport {
  id: string;
  type: string;
  subject: string;
  description: string;
  department?: string;
  projectId?: string;
  createdAt: string;
  status: "Submitted" | "Under Review" | "Resolved";
  severity: "Low" | "Medium" | "High";
  reference?: string;
}

// Utility Functions
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
};
const clamp = (v: number, min = 0, max = 100) =>
  Math.min(Math.max(v, min), max);

// Small Reusable Components
const Pill: React.FC<{
  children: React.ReactNode;
  color?: string;
  subtle?: boolean;
}> = ({ children, color = "indigo", subtle }) => {
  const base = subtle
    ? `bg-${color}-50 text-${color}-700 border border-${color}-200`
    : `bg-${color}-600 text-white`;
  // Fallback if dynamic classes not purged: map supported colors
  const colorMap = {
    indigo: subtle
      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
      : "bg-indigo-600 text-white",
    green: subtle
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-green-600 text-white",
    red: subtle
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-red-600 text-white",
    yellow: subtle
      ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
      : "bg-yellow-500 text-white",
    blue: subtle
      ? "bg-blue-50 text-blue-700 border border-blue-200"
      : "bg-blue-600 text-white",
    gray: subtle
      ? "bg-gray-100 text-gray-700 border border-gray-200"
      : "bg-gray-600 text-white",
  };
  const className = colorMap[color as keyof typeof colorMap] || base;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{
  value: number;
  color?: "indigo" | "green" | "red" | "yellow" | "blue";
  height?: "sm" | "md";
  showLabel?: boolean;
}> = ({ value, color = "indigo", height = "sm", showLabel }) => {
  const colorClass = {
    indigo: "bg-indigo-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-500",
    blue: "bg-blue-600",
  }[color];
  const h = height === "sm" ? "h-2" : "h-3";
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={`flex-1 bg-gray-200 rounded ${h} overflow-hidden`}
        aria-label="progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <div
          className={`${colorClass} h-full transition-all duration-500`}
          style={{ width: clamp(value) + "%" }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 w-10 text-right">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg border border-gray-200 flex flex-col max-h-full">
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">{children}</div>
        {actions && (
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

interface SortConfig<T> {
  key: keyof T | null;
  direction: "asc" | "desc";
}

const SortHeader: React.FC<{
  label: string;
  column: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}> = ({ label, active, direction, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`text-left flex items-center gap-1 font-medium text-sm ${
        active ? "text-indigo-600" : "text-gray-700"
      } hover:text-indigo-600`}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {active && (
        <span className="text-xs">{direction === "asc" ? "▲" : "▼"}</span>
      )}
    </button>
  );
};

const ToggleTheme: React.FC = () => {
  const [dark, setDark] = useState<boolean>(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium"
      aria-label="Toggle theme"
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
};

// Main Page
const GovTrackPage: React.FC = () => {
  // Accessibility and internationalization hooks
  useLanguage();
  useAccessibility();
  useInteractionTracking();

  // Page tracking
  usePageTracking("overview");

  // Enhanced state management

  const [tab, setTab] = useState<
    "overview" | "budgets" | "projects" | "spending" | "reports"
  >("overview");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBudgets, setSortBudgets] = useState<SortConfig<Budget>>({
    key: null,
    direction: "asc",
  });
  const [sortProjects, setSortProjects] = useState<SortConfig<Project>>({
    key: null,
    direction: "asc",
  });
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportConfirmation, setShowReportConfirmation] = useState(false);
  const [reportDraft, setReportDraft] = useState<Partial<IrregularityReport>>({
    severity: "Medium",
    type: "Spending Concern",
  });
  const [reports, setReports] = useState<IrregularityReport[]>([]);
  const [detailPanel, setDetailPanel] = useState<{
    type: "budget" | "project" | null;
    id?: string;
  }>({ type: null });

  // Sample Data Initialization
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const now = new Date();
    return [
      {
        id: "b1",
        department: "Health",
        category: "Public Services",
        allocated: 50000000,
        spent: 21500000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b2",
        department: "Education",
        category: "Public Services",
        allocated: 42000000,
        spent: 28900000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b3",
        department: "Transport",
        category: "Infrastructure",
        allocated: 65000000,
        spent: 41200000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b4",
        department: "Agriculture",
        category: "Economic",
        allocated: 18000000,
        spent: 9000000,
        region: "Rural",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b5",
        department: "Energy",
        category: "Infrastructure",
        allocated: 30000000,
        spent: 11000000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b6",
        department: "Tourism",
        category: "Economic",
        allocated: 8000000,
        spent: 3500000,
        region: "Coastal",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b7",
        department: "Defense",
        category: "Security",
        allocated: 90000000,
        spent: 61000000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
      {
        id: "b8",
        department: "Justice",
        category: "Security",
        allocated: 27000000,
        spent: 14000000,
        region: "National",
        lastUpdated: now.toISOString(),
      },
    ];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const now = new Date().toISOString();
    return [
      {
        id: "p1",
        name: "Rural Clinic Expansion",
        department: "Health",
        budget: 12000000,
        spent: 4600000,
        status: "On Track",
        progress: 39,
        startDate: "2024-01-15",
        endDate: "2025-07-30",
        region: "Rural",
        description:
          "Building and upgrading rural health clinics to expand access.",
        updatedAt: now,
        risk: 25,
      },
      {
        id: "p2",
        name: "Highway Modernization",
        department: "Transport",
        budget: 30000000,
        spent: 15800000,
        status: "Delayed",
        progress: 52,
        startDate: "2023-09-01",
        endDate: "2025-12-31",
        region: "National",
        description:
          "Modernizing key national highway corridors for safety and capacity.",
        updatedAt: now,
        risk: 55,
      },
      {
        id: "p3",
        name: "Digital Classrooms Initiative",
        department: "Education",
        budget: 15000000,
        spent: 7200000,
        status: "On Track",
        progress: 47,
        startDate: "2024-02-01",
        endDate: "2025-06-15",
        region: "National",
        description:
          "Deploying digital tools and connectivity in public schools.",
        updatedAt: now,
        risk: 30,
      },
      {
        id: "p4",
        name: "Green Energy Pilot",
        department: "Energy",
        budget: 10000000,
        spent: 4800000,
        status: "On Track",
        progress: 49,
        startDate: "2024-03-01",
        endDate: "2025-03-01",
        region: "National",
        description: "Pilot renewable microgrid systems for remote areas.",
        updatedAt: now,
        risk: 35,
      },
      {
        id: "p5",
        name: "Agri Supply Chain Upgrade",
        department: "Agriculture",
        budget: 8000000,
        spent: 2700000,
        status: "At Risk",
        progress: 28,
        startDate: "2024-04-01",
        endDate: "2025-10-01",
        region: "Rural",
        description: "Improving cold storage and logistics for produce.",
        updatedAt: now,
        risk: 68,
      },
      {
        id: "p6",
        name: "Judicial Case System",
        department: "Justice",
        budget: 6000000,
        spent: 2400000,
        status: "On Track",
        progress: 36,
        startDate: "2024-01-10",
        endDate: "2025-01-10",
        region: "National",
        description: "Implementing digital case management for courts.",
        updatedAt: now,
        risk: 40,
      },
      {
        id: "p7",
        name: "Border Security Upgrade",
        department: "Defense",
        budget: 22000000,
        spent: 9600000,
        status: "Delayed",
        progress: 44,
        startDate: "2023-12-01",
        endDate: "2025-08-01",
        region: "National",
        description:
          "Deploying modern surveillance and control infrastructure.",
        updatedAt: now,
        risk: 58,
      },
      {
        id: "p8",
        name: "Eco Tourism Campaign",
        department: "Tourism",
        budget: 5000000,
        spent: 1700000,
        status: "On Track",
        progress: 34,
        startDate: "2024-05-01",
        endDate: "2025-05-01",
        region: "Coastal",
        description: "Promoting sustainable tourism development.",
        updatedAt: now,
        risk: 32,
      },
      {
        id: "p9",
        name: "School Nutrition Upgrade",
        department: "Education",
        budget: 9000000,
        spent: 3000000,
        status: "On Track",
        progress: 33,
        startDate: "2024-03-15",
        endDate: "2025-09-15",
        region: "National",
        description: "Enhancing nutritional standards for school meals.",
        updatedAt: now,
        risk: 29,
      },
    ];
  });

  const [expenditures] = useState<Expenditure[]>(() => {
    const sample: Expenditure[] = [];
    const cats = [
      "Procurement",
      "Labor",
      "Logistics",
      "Training",
      "Consulting",
    ];
    projects.forEach((p) => {
      for (let i = 0; i < 3; i++) {
        sample.push({
          id: p.id + "-tx" + i,
          projectId: p.id,
          department: p.department,
          description: `${cats[i]} expense`,
          amount: Math.round(Math.random() * 200000) + 20000,
          date: new Date(Date.now() - Math.random() * 1e9).toISOString(),
          category: cats[i],
        });
      }
    });
    return sample;
  });

  // Real-time simulation updates
  useEffect(() => {
    const id = setInterval(() => {
      setProjects((prev) =>
        prev.map((p) => {
          if (Math.random() < 0.2 && p.progress < 100) {
            const inc = Math.random() * 4;
            const extraSpend = Math.round(
              p.budget * (inc / 100) * (0.8 + Math.random() * 0.4)
            );
            return {
              ...p,
              progress: clamp(p.progress + inc),
              spent: Math.min(p.budget, p.spent + extraSpend),
              status: p.progress + inc >= 100 ? "Completed" : p.status,
              updatedAt: new Date().toISOString(),
              risk:
                p.status === "Delayed" || p.status === "At Risk"
                  ? Math.min(90, p.risk + Math.random() * 3)
                  : Math.max(10, p.risk + (Math.random() * 4 - 2)),
            };
          }
          return p;
        })
      );
      setBudgets((prev) =>
        prev.map((b) => {
          if (Math.random() < 0.15) {
            const delta = Math.round(b.allocated * 0.0005 * Math.random() * 50);
            const newSpent = Math.min(b.allocated * 1.15, b.spent + delta);
            return {
              ...b,
              spent: newSpent,
              lastUpdated: new Date().toISOString(),
            };
          }
          return b;
        })
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const departments = useMemo(
    () => [
      "All",
      ...Array.from(new Set(budgets.map((b) => b.department))).sort(),
    ],
    [budgets]
  );
  const regions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          budgets.map((b) => b.region).concat(projects.map((p) => p.region))
        )
      ).sort(),
    ],
    [budgets, projects]
  );
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(budgets.map((b) => b.category))).sort(),
    ],
    [budgets]
  );
  const projectStatuses = [
    "All",
    "On Track",
    "Delayed",
    "At Risk",
    "Completed",
  ];

  // Filtering Functions
  const filteredBudgets = useMemo(() => {
    let data = [...budgets];
    if (search)
      data = data.filter(
        (b) =>
          b.department.toLowerCase().includes(search.toLowerCase()) ||
          b.category.toLowerCase().includes(search.toLowerCase())
      );
    if (filterDept !== "All")
      data = data.filter((b) => b.department === filterDept);
    if (filterRegion !== "All")
      data = data.filter((b) => b.region === filterRegion);
    if (filterCategory !== "All")
      data = data.filter((b) => b.category === filterCategory);
    if (sortBudgets.key) {
      data.sort((a, b) => {
        const k = sortBudgets.key as keyof Budget;
        const av = a[k];
        const bv = b[k];
        if (typeof av === "number" && typeof bv === "number")
          return sortBudgets.direction === "asc" ? av - bv : bv - av;
        return (
          String(av).localeCompare(String(bv)) *
          (sortBudgets.direction === "asc" ? 1 : -1)
        );
      });
    }
    return data;
  }, [budgets, search, filterDept, filterRegion, filterCategory, sortBudgets]);

  const filteredProjects = useMemo(() => {
    let data = [...projects];
    if (search)
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.department.toLowerCase().includes(search.toLowerCase())
      );
    if (filterDept !== "All")
      data = data.filter((p) => p.department === filterDept);
    if (filterRegion !== "All")
      data = data.filter((p) => p.region === filterRegion);
    if (filterStatus !== "All")
      data = data.filter((p) => p.status === filterStatus);
    if (sortProjects.key) {
      data.sort((a, b) => {
        const k = sortProjects.key as keyof Project;
        const av = a[k];
        const bv = b[k];
        if (typeof av === "number" && typeof bv === "number")
          return sortProjects.direction === "asc" ? av - bv : bv - av;
        return (
          String(av).localeCompare(String(bv)) *
          (sortProjects.direction === "asc" ? 1 : -1)
        );
      });
    }
    return data;
  }, [projects, search, filterDept, filterRegion, filterStatus, sortProjects]);

  const filteredExpenditures = useMemo(() => {
    let data = [...expenditures];
    if (search)
      data = data.filter(
        (e) =>
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.department.toLowerCase().includes(search.toLowerCase())
      );
    if (filterDept !== "All")
      data = data.filter((e) => e.department === filterDept);
    if (filterRegion !== "All") {
      const regionProjects = new Set(
        projects.filter((p) => p.region === filterRegion).map((p) => p.id)
      );
      data = data.filter(
        (e) => !e.projectId || regionProjects.has(e.projectId)
      );
    }
    if (filterCategory !== "All")
      data = data.filter((e) => e.category === filterCategory);
    return data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    expenditures,
    search,
    filterDept,
    filterRegion,
    filterCategory,
    projects,
  ]);

  // Overview Metrics
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallUtilization = (totalSpent / totalAllocated) * 100;
  const projectStatusCounts = projects.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {}
  );
  const transparencyIndex = (() => {
    // Simple heuristic: (1 - average abs deviation of utilization from 60%) * (report resolution ratio).
    const utilizations = budgets.map((b) => (b.spent / b.allocated) * 100);
    const avgDeviation =
      utilizations.reduce((s, u) => s + Math.abs(u - 60), 0) /
      utilizations.length;
    const norm = Math.max(0, 100 - avgDeviation) / 100; // 0..1
    const resolved = reports.filter((r) => r.status === "Resolved").length;
    const resolutionRatio = reports.length ? resolved / reports.length : 0.5;
    return Math.round((0.6 * norm + 0.4 * resolutionRatio) * 100);
  })();

  const addOrRemoveCompare = (id: string) => {
    setCompareSet((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleWatch = (id: string) => {
    setWatchlist((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSortBudgets = (key: keyof Budget) => {
    setSortBudgets((prev) => {
      if (prev.key === key)
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      return { key, direction: "asc" };
    });
  };
  const handleSortProjects = (key: keyof Project) => {
    setSortProjects((prev) => {
      if (prev.key === key)
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      return { key, direction: "asc" };
    });
  };

  const openReportModal = (defaults?: Partial<IrregularityReport>) => {
    setReportDraft({
      severity: "Medium",
      type: "Spending Concern",
      ...defaults,
    });
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!reportDraft.subject || !reportDraft.description) return;
    setShowReportConfirmation(true);
  };

  const confirmSubmitReport = () => {
    const newReport: IrregularityReport = {
      id: "r" + Date.now(),
      type: reportDraft.type || "Spending Concern",
      subject: reportDraft.subject,
      description: reportDraft.description,
      department: reportDraft.department,
      projectId: reportDraft.projectId,
      severity: (reportDraft.severity as any) || "Medium",
      status: "Submitted",
      reference: reportDraft.reference,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    setShowReportModal(false);
    setShowReportConfirmation(false);
    setReportDraft({
      severity: "Medium",
      type: "Spending Concern",
    });
  };

  const cancelSubmitReport = () => {
    setShowReportConfirmation(false);
  };

  const exportData = (type: "budgets" | "projects") => {
    const data = type === "budgets" ? filteredBudgets : filteredProjects;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const detailEntity =
    detailPanel.type === "budget"
      ? budgets.find((b) => b.id === detailPanel.id)
      : detailPanel.type === "project"
      ? projects.find((p) => p.id === detailPanel.id)
      : undefined;

  // Derived sets for compare panel
  const compareItems = Array.from(compareSet)
    .map(
      (id) =>
        budgets.find((b) => "b" + b.id.slice(1) === id || b.id === id) ||
        projects.find((p) => p.id === id)
    )
    .filter(Boolean) as (Budget | Project)[];

  // Accessibility id helpers
  const tabButtonClass = (value: typeof tab) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      tab === value
        ? "bg-indigo-600 text-white shadow"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  const statusColor = (status: Project["status"]) => {
    switch (status) {
      case "On Track":
        return "green";
      case "Delayed":
        return "yellow";
      case "At Risk":
        return "red";
      case "Completed":
        return "indigo";
      default:
        return "gray";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
                GT
              </div>
              <h1 className="text-xl font-semibold text-gray-900">GovTrack</h1>
            </div>
            <nav className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setTab("overview")}
                className={tabButtonClass("overview")}
              >
                Overview
              </button>
              <button
                onClick={() => setTab("budgets")}
                className={tabButtonClass("budgets")}
              >
                Budgets
              </button>
              <button
                onClick={() => setTab("projects")}
                className={tabButtonClass("projects")}
              >
                Projects
              </button>
              <button
                onClick={() => setTab("spending")}
                className={tabButtonClass("spending")}
              >
                Spending
              </button>
              <button
                onClick={() => setTab("reports")}
                className={tabButtonClass("reports")}
              >
                Reports
              </button>
            </nav>
          </div>
          <div className="flex flex-1 md:flex-none items-center gap-3">
            <div className="flex-1 md:flex-none md:w-72 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => openReportModal()}
              className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              Report Issue
            </button>
            <ToggleTheme />
          </div>
        </div>
        {/* Mobile Tabs */}
        <div className="lg:hidden px-4 pb-4 flex flex-wrap gap-2">
          {(
            ["overview", "budgets", "projects", "spending", "reports"] as const
          ).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tabButtonClass(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">
              Department
            </label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Region</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          {(tab === "projects" || tab === "overview") && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {projectStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          {(tab === "budgets" || tab === "spending" || tab === "overview") && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setFilterDept("All");
                setFilterRegion("All");
                setFilterStatus("All");
                setFilterCategory("All");
                setSearch("");
              }}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Reset
            </button>
            <button
              onClick={() => openReportModal()}
              className="md:hidden text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {tab === "overview" && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Metrics
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
                    <div className="text-xs font-medium text-gray-500">
                      Total Allocated
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(totalAllocated)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Across {budgets.length} budgets
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
                    <div className="text-xs font-medium text-gray-500">
                      Total Spent
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(totalSpent)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Utilization {overallUtilization.toFixed(1)}%
                    </div>
                    <ProgressBar
                      value={overallUtilization}
                      color={
                        overallUtilization > 90
                          ? "red"
                          : overallUtilization > 70
                          ? "green"
                          : "indigo"
                      }
                    />
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
                    <div className="text-xs font-medium text-gray-500">
                      Projects Active
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {projects.length}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(projectStatusCounts).map(
                        ([status, count]) => (
                          <Pill
                            key={status}
                            color={statusColor(status as Project["status"])}
                            subtle
                          >
                            {status}: {count}
                          </Pill>
                        )
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2">
                    <div className="text-xs font-medium text-gray-500">
                      Transparency Index
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {transparencyIndex}
                    </div>
                    <div className="text-xs text-gray-500">
                      Score out of 100
                    </div>
                    <ProgressBar
                      value={transparencyIndex}
                      color={
                        transparencyIndex > 70
                          ? "green"
                          : transparencyIndex > 50
                          ? "indigo"
                          : "yellow"
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Budget Snapshot
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData("budgets")}
                      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                    >
                      Export
                    </button>
                  </div>
                </div>
                <div className="overflow-auto border border-gray-200 rounded-lg bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="p-3 text-left">Dept</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">Allocated</th>
                        <th className="p-3 text-left">Spent</th>
                        <th className="p-3 text-left">Utilization</th>
                        <th className="p-3 text-left">Updated</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBudgets.slice(0, 6).map((b) => {
                        const util = (b.spent / b.allocated) * 100;
                        return (
                          <tr
                            key={b.id}
                            className="border-t border-gray-200 hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                              <button
                                onClick={() => toggleWatch("budget-" + b.id)}
                                className={`text-xs ${
                                  watchlist.has("budget-" + b.id)
                                    ? "text-yellow-500"
                                    : "text-gray-400 hover:text-yellow-500"
                                }`}
                              >
                                ★
                              </button>
                              {b.department}
                            </td>
                            <td className="p-3 text-gray-600">{b.category}</td>
                            <td className="p-3 text-gray-800">
                              {formatCurrency(b.allocated)}
                            </td>
                            <td
                              className={`p-3 ${
                                b.spent > b.allocated
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-800"
                              }`}
                            >
                              {formatCurrency(b.spent)}
                            </td>
                            <td className="p-3 w-40">
                              <div className="flex items-center gap-2">
                                <ProgressBar
                                  value={util}
                                  color={
                                    util > 100
                                      ? "red"
                                      : util > 80
                                      ? "green"
                                      : "indigo"
                                  }
                                />
                                <span
                                  className={`text-xs ${
                                    util > 100
                                      ? "text-red-600 font-medium"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {util.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {relativeTime(b.lastUpdated)}
                            </td>
                            <td className="p-3 flex gap-2">
                              <button
                                onClick={() =>
                                  setDetailPanel({ type: "budget", id: b.id })
                                }
                                className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                View
                              </button>
                              <button
                                onClick={() =>
                                  openReportModal({
                                    department: b.department,
                                    subject: "Budget Concern: " + b.department,
                                  })
                                }
                                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                              >
                                Flag
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredBudgets.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-6 text-center text-sm text-gray-500"
                          >
                            No budgets match current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Project Snapshot
                  </h2>
                  <button
                    onClick={() => exportData("projects")}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                  >
                    Export
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.slice(0, 6).map((p) => {
                    const spendPercent = (p.spent / p.budget) * 100;
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleWatch("project-" + p.id)}
                              className={`text-xs ${
                                watchlist.has("project-" + p.id)
                                  ? "text-yellow-500"
                                  : "text-gray-300 hover:text-yellow-500"
                              }`}
                            >
                              ★
                            </button>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                              {p.name}
                            </h3>
                          </div>
                          <Pill color={statusColor(p.status)} subtle>
                            {p.status}
                          </Pill>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {p.description}
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span>{Math.round(p.progress)}%</span>
                          </div>
                          <ProgressBar
                            value={p.progress}
                            color={
                              p.status === "At Risk"
                                ? "red"
                                : p.status === "Delayed"
                                ? "yellow"
                                : "indigo"
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Spent</span>
                            <span>{spendPercent.toFixed(1)}%</span>
                          </div>
                          <ProgressBar
                            value={spendPercent}
                            color={
                              spendPercent > 100
                                ? "red"
                                : spendPercent > 80
                                ? "green"
                                : "blue"
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span>{p.department}</span>
                          <span className="text-gray-300">|</span>
                          <span>{p.region}</span>
                          <span className="text-gray-300">|</span>
                          <span>Risk: {p.risk}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setDetailPanel({ type: "project", id: p.id })
                            }
                            className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => addOrRemoveCompare(p.id)}
                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                          >
                            {compareSet.has(p.id) ? "Remove" : "Compare"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <div className="col-span-full text-sm text-gray-500">
                      No projects match current filters.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Transparency Charter
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                  GovTrack empowers citizens with real-time visibility into
                  allocations, expenditures, and project progress. Data here is
                  updated periodically and may be subject to verification.
                  Community reports help investigators prioritize oversight,
                  enabling earlier detection of irregularities and strengthening
                  public trust.
                </div>
              </section>
            </div>
          )}

          {tab === "budgets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Budgets</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportData("budgets")}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => openReportModal()}
                    className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Report
                  </button>
                </div>
              </div>
              <div className="overflow-auto border border-gray-200 rounded-lg bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr className="border-b border-gray-200">
                      <th className="p-3">
                        <SortHeader
                          label="Department"
                          column="department"
                          active={sortBudgets.key === "department"}
                          direction={sortBudgets.direction}
                          onClick={() => handleSortBudgets("department")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Category"
                          column="category"
                          active={sortBudgets.key === "category"}
                          direction={sortBudgets.direction}
                          onClick={() => handleSortBudgets("category")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Allocated"
                          column="allocated"
                          active={sortBudgets.key === "allocated"}
                          direction={sortBudgets.direction}
                          onClick={() => handleSortBudgets("allocated")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Spent"
                          column="spent"
                          active={sortBudgets.key === "spent"}
                          direction={sortBudgets.direction}
                          onClick={() => handleSortBudgets("spent")}
                        />
                      </th>
                      <th className="p-3">Utilization</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">Updated</th>
                      <th className="p-3">Compare</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((b) => {
                      const util = (b.spent / b.allocated) * 100;
                      return (
                        <tr
                          key={b.id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-gray-800 flex items-center gap-2">
                            <button
                              onClick={() => toggleWatch("budget-" + b.id)}
                              className={`text-xs ${
                                watchlist.has("budget-" + b.id)
                                  ? "text-yellow-500"
                                  : "text-gray-300 hover:text-yellow-500"
                              }`}
                            >
                              ★
                            </button>
                            {b.department}
                          </td>
                          <td className="p-3 text-gray-600">{b.category}</td>
                          <td className="p-3 text-gray-800">
                            {formatCurrency(b.allocated)}
                          </td>
                          <td
                            className={`p-3 ${
                              b.spent > b.allocated
                                ? "text-red-600 font-semibold"
                                : "text-gray-800"
                            }`}
                          >
                            {formatCurrency(b.spent)}
                          </td>
                          <td className="p-3 w-48">
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                value={util}
                                color={
                                  util > 100
                                    ? "red"
                                    : util > 80
                                    ? "green"
                                    : "indigo"
                                }
                              />
                              <span
                                className={`text-xs ${
                                  util > 100
                                    ? "text-red-600 font-medium"
                                    : "text-gray-600"
                                }`}
                              >
                                {util.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {b.region}
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {relativeTime(b.lastUpdated)}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={compareSet.has(b.id)}
                              onChange={() => addOrRemoveCompare(b.id)}
                            />
                          </td>
                          <td className="p-3 flex gap-2">
                            <button
                              onClick={() =>
                                setDetailPanel({ type: "budget", id: b.id })
                              }
                              className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                openReportModal({
                                  department: b.department,
                                  subject: "Budget Concern: " + b.department,
                                })
                              }
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              Flag
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBudgets.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-6 text-center text-sm text-gray-500"
                        >
                          No budgets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Projects
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportData("projects")}
                    className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => openReportModal()}
                    className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Report
                  </button>
                </div>
              </div>
              <div className="overflow-auto border border-gray-200 rounded-lg bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr className="border-b border-gray-200">
                      <th className="p-3">
                        <SortHeader
                          label="Project"
                          column="name"
                          active={sortProjects.key === "name"}
                          direction={sortProjects.direction}
                          onClick={() => handleSortProjects("name")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Department"
                          column="department"
                          active={sortProjects.key === "department"}
                          direction={sortProjects.direction}
                          onClick={() => handleSortProjects("department")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Budget"
                          column="budget"
                          active={sortProjects.key === "budget"}
                          direction={sortProjects.direction}
                          onClick={() => handleSortProjects("budget")}
                        />
                      </th>
                      <th className="p-3">
                        <SortHeader
                          label="Spent"
                          column="spent"
                          active={sortProjects.key === "spent"}
                          direction={sortProjects.direction}
                          onClick={() => handleSortProjects("spent")}
                        />
                      </th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Risk</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">Updated</th>
                      <th className="p-3">Compare</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => {
                      const progress = p.progress;
                      const spendPercent = (p.spent / p.budget) * 100;
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium text-gray-800 max-w-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleWatch("project-" + p.id)}
                                className={`text-xs ${
                                  watchlist.has("project-" + p.id)
                                    ? "text-yellow-500"
                                    : "text-gray-300 hover:text-yellow-500"
                                }`}
                              >
                                ★
                              </button>
                              <span className="line-clamp-2">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {p.department}
                          </td>
                          <td className="p-3 text-gray-800 whitespace-nowrap">
                            {formatCurrency(p.budget)}
                          </td>
                          <td
                            className={`p-3 ${
                              p.spent > p.budget
                                ? "text-red-600 font-semibold"
                                : "text-gray-800"
                            }`}
                          >
                            {formatCurrency(p.spent)}
                          </td>
                          <td className="p-3 w-40">
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                value={progress}
                                color={
                                  p.status === "At Risk"
                                    ? "red"
                                    : p.status === "Delayed"
                                    ? "yellow"
                                    : "indigo"
                                }
                              />{" "}
                              <span className="text-xs text-gray-600">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <span>Spend</span>
                              <ProgressBar
                                value={spendPercent}
                                color={
                                  spendPercent > 100
                                    ? "red"
                                    : spendPercent > 80
                                    ? "green"
                                    : "blue"
                                }
                              />{" "}
                              <span>{spendPercent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Pill color={statusColor(p.status)} subtle>
                              {p.status}
                            </Pill>
                          </td>
                          <td className="p-3 text-gray-600">{p.risk}</td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {p.region}
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {relativeTime(p.updatedAt)}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={compareSet.has(p.id)}
                              onChange={() => addOrRemoveCompare(p.id)}
                            />
                          </td>
                          <td className="p-3 flex gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                setDetailPanel({ type: "project", id: p.id })
                              }
                              className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() =>
                                openReportModal({
                                  projectId: p.id,
                                  department: p.department,
                                  subject: "Project Concern: " + p.name,
                                })
                              }
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              Flag
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="p-6 text-center text-sm text-gray-500"
                        >
                          No projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "spending" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Expenditures
                </h2>
                <div className="text-xs text-gray-500">
                  Showing {filteredExpenditures.length} transactions
                </div>
              </div>
              <div className="overflow-auto border border-gray-200 rounded-lg bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr className="border-b border-gray-200">
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Project</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenditures.map((e) => {
                      const project = projects.find(
                        (p) => p.id === e.projectId
                      );
                      return (
                        <tr
                          key={e.id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 text-gray-800">{e.description}</td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {e.department}
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {project ? project.name : "—"}
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {e.category}
                          </td>
                          <td className="p-3 text-gray-800 whitespace-nowrap">
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {formatDate(e.date)}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() =>
                                openReportModal({
                                  department: e.department,
                                  projectId: e.projectId,
                                  subject:
                                    "Transaction Review: " + e.description,
                                })
                              }
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              Flag
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredExpenditures.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-sm text-gray-500"
                        >
                          No expenditures found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Irregularity Reports
                </h2>
                <button
                  onClick={() => openReportModal()}
                  className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  New Report
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Pill color="red" subtle>
                    Submitted:{" "}
                    {reports.filter((r) => r.status === "Submitted").length}
                  </Pill>
                  <Pill color="yellow" subtle>
                    Under Review:{" "}
                    {reports.filter((r) => r.status === "Under Review").length}
                  </Pill>
                  <Pill color="green" subtle>
                    Resolved:{" "}
                    {reports.filter((r) => r.status === "Resolved").length}
                  </Pill>
                </div>
                <div className="overflow-auto border border-gray-200 rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr className="border-b border-gray-200">
                        <th className="p-3 text-left">Subject</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Dept/Project</th>
                        <th className="p-3 text-left">Severity</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Created</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => {
                        const project = r.projectId
                          ? projects.find((p) => p.id === r.projectId)
                          : undefined;
                        return (
                          <tr
                            key={r.id}
                            className="border-t border-gray-200 hover:bg-gray-50"
                          >
                            <td className="p-3 max-w-xs">
                              <div
                                className="font-medium text-gray-800 line-clamp-2"
                                title={r.subject}
                              >
                                {r.subject}
                              </div>
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {r.type}
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {r.department || project?.department || "—"}
                              {project && (
                                <span className="text-gray-400">
                                  {" "}
                                  / {project.name}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {r.severity}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <Pill
                                color={
                                  r.status === "Resolved"
                                    ? "green"
                                    : r.status === "Under Review"
                                    ? "yellow"
                                    : "red"
                                }
                                subtle
                              >
                                {r.status}
                              </Pill>
                            </td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {relativeTime(r.createdAt)}
                            </td>
                            <td className="p-3 flex gap-2 flex-wrap">
                              {/* Status management removed - user-only system */}
                            </td>
                          </tr>
                        );
                      })}
                      {reports.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-6 text-center text-sm text-gray-500"
                          >
                            No reports submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500">
                  Reports are community submissions; sensitive details are
                  screened before publication.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Compare Panel */}
      {compareSet.size > 0 && (
        <div className="fixed bottom-4 right-4 z-30 w-full max-w-xl bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">
              Comparison ({compareSet.size})
            </h3>
            <button
              onClick={() => setCompareSet(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Budget</th>
                  <th className="p-2 text-left">Spent</th>
                  <th className="p-2 text-left">% Util</th>
                  <th className="p-2 text-left">Progress</th>
                </tr>
              </thead>
              <tbody>
                {compareItems.map((item) => {
                  const isBudget =
                    (item as Budget).allocated !== undefined &&
                    (item as any).allocated === (item as Budget).allocated;
                  const budgetVal = isBudget
                    ? (item as Budget).allocated
                    : (item as Project).budget;
                  const spentVal = isBudget
                    ? (item as Budget).spent
                    : (item as Project).spent;
                  const util = (spentVal / budgetVal) * 100;
                  return (
                    <tr
                      key={(item as any).id}
                      className="border-t border-gray-200"
                    >
                      <td className="p-2 font-medium text-gray-800 max-w-[8rem] truncate">
                        {(item as unknown).name || (item as Budget).department}
                      </td>
                      <td className="p-2 text-gray-600">
                        {isBudget ? "Budget" : "Project"}
                      </td>
                      <td className="p-2 text-gray-600">
                        {formatCurrency(budgetVal)}
                      </td>
                      <td
                        className={`p-2 ${
                          spentVal > budgetVal
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {formatCurrency(spentVal)}
                      </td>
                      <td
                        className={`p-2 ${
                          util > 100
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }`}
                      >
                        {util.toFixed(1)}%
                      </td>
                      <td className="p-2">
                        {isBudget ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span>{(item as Project).progress.toFixed(0)}%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {compareItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-gray-500">
                      None selected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCompareSet(new Set())}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Detail Side Panel */}
      {detailPanel.type && detailEntity && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                {detailPanel.type === "budget"
                  ? "Budget Details"
                  : "Project Details"}
              </h3>
              <button
                onClick={() => setDetailPanel({ type: null })}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto space-y-4 text-sm">
              {detailPanel.type === "budget" &&
                (() => {
                  const b = detailEntity as Budget;
                  const util = (b.spent / b.allocated) * 100;
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {b.department}
                        </h4>
                        <div className="text-xs text-gray-500">
                          Category: {b.category}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded p-3 flex flex-col gap-1 border border-gray-200">
                          <span className="text-xs text-gray-500">
                            Allocated
                          </span>
                          <span className="font-medium text-gray-800">
                            {formatCurrency(b.allocated)}
                          </span>
                        </div>
                        <div
                          className={`bg-gray-50 rounded p-3 flex flex-col gap-1 border border-gray-200 ${
                            b.spent > b.allocated ? "ring-1 ring-red-400" : ""
                          }`}
                        >
                          <span className="text-xs text-gray-500">Spent</span>
                          <span
                            className={`font-medium ${
                              b.spent > b.allocated
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {formatCurrency(b.spent)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded p-3 flex flex-col gap-1 border border-gray-200 col-span-2">
                          <span className="text-xs text-gray-500">
                            Utilization
                          </span>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={util}
                              color={
                                util > 100
                                  ? "red"
                                  : util > 80
                                  ? "green"
                                  : "indigo"
                              }
                            />
                            <span
                              className={`text-xs ${
                                util > 100
                                  ? "text-red-600 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {util.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Region</div>
                        <div className="font-medium text-gray-800">
                          {b.region}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          Last Updated
                        </div>
                        <div className="font-medium text-gray-800">
                          {relativeTime(b.lastUpdated)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            openReportModal({
                              department: b.department,
                              subject: "Budget Concern: " + b.department,
                            })
                          }
                          className="text-xs px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Report Issue
                        </button>
                        <button
                          onClick={() => addOrRemoveCompare(b.id)}
                          className="text-xs px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
                        >
                          {compareSet.has(b.id)
                            ? "Remove Compare"
                            : "Add Compare"}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Note: Budget details are periodically verified;
                        anomalies might be provisional.
                      </div>
                    </div>
                  );
                })()}
              {detailPanel.type === "project" &&
                (() => {
                  const p = detailEntity as Project;
                  const spendPercent = (p.spent / p.budget) * 100;
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">
                          {p.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Pill color={statusColor(p.status)} subtle>
                            {p.status}
                          </Pill>
                          <Pill
                            color={
                              p.risk > 60
                                ? "red"
                                : p.risk > 40
                                ? "yellow"
                                : "green"
                            }
                            subtle
                          >
                            Risk {p.risk}
                          </Pill>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {p.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="text-xs text-gray-500">Budget</div>
                          <div className="font-medium text-gray-800">
                            {formatCurrency(p.budget)}
                          </div>
                        </div>
                        <div
                          className={`bg-gray-50 border border-gray-200 rounded p-3 ${
                            p.spent > p.budget ? "ring-1 ring-red-400" : ""
                          }`}
                        >
                          <div className="text-xs text-gray-500">Spent</div>
                          <div
                            className={`font-medium ${
                              p.spent > p.budget
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {formatCurrency(p.spent)}
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 col-span-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(p.progress)}%</span>
                          </div>
                          <ProgressBar
                            value={p.progress}
                            color={
                              p.status === "At Risk"
                                ? "red"
                                : p.status === "Delayed"
                                ? "yellow"
                                : "indigo"
                            }
                            height="md"
                          />
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 col-span-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Spending</span>
                            <span>{spendPercent.toFixed(1)}%</span>
                          </div>
                          <ProgressBar
                            value={spendPercent}
                            color={
                              spendPercent > 100
                                ? "red"
                                : spendPercent > 80
                                ? "green"
                                : "blue"
                            }
                            height="md"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            Department
                          </div>
                          <div className="font-medium text-gray-800">
                            {p.department}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Region</div>
                          <div className="font-medium text-gray-800">
                            {p.region}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Start</div>
                          <div className="font-medium text-gray-800">
                            {formatDate(p.startDate)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">End</div>
                          <div className="font-medium text-gray-800">
                            {formatDate(p.endDate)}
                          </div>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <div className="text-xs text-gray-500">Updated</div>
                          <div className="font-medium text-gray-800">
                            {relativeTime(p.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            openReportModal({
                              projectId: p.id,
                              department: p.department,
                              subject: "Project Concern: " + p.name,
                            })
                          }
                          className="text-xs px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Report Issue
                        </button>
                        <button
                          onClick={() => addOrRemoveCompare(p.id)}
                          className="text-xs px-3 py-2 rounded border border-gray-300 hover:bg-gray-100"
                        >
                          {compareSet.has(p.id)
                            ? "Remove Compare"
                            : "Add Compare"}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Project metrics simulate near real-time updates every
                        few seconds.
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Modal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Submit Irregularity Report"
        actions={
          <>
            <button
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={submitReport}
              disabled={!reportDraft.subject || !reportDraft.description}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitReport();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Type</label>
              <select
                value={reportDraft.type || ""}
                onChange={(e) =>
                  setReportDraft((r) => ({ ...r, type: e.target.value }))
                }
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Spending Concern</option>
                <option>Fraud Suspicion</option>
                <option>Delay Justification</option>
                <option>Misallocation</option>
                <option>Quality Issue</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Severity
              </label>
              <select
                value={reportDraft.severity || "Medium"}
                onChange={(e) =>
                  setReportDraft((r) => ({
                    ...r,
                    severity: e.target.value as "Low" | "Medium" | "High",
                  }))
                }
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Department
              </label>
              <select
                value={reportDraft.department || ""}
                onChange={(e) =>
                  setReportDraft((r) => ({
                    ...r,
                    department: e.target.value || undefined,
                  }))
                }
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">(Optional)</option>
                {departments
                  .filter((d) => d !== "All")
                  .map((d) => (
                    <option key={d}>{d}</option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Project
              </label>
              <select
                value={reportDraft.projectId || ""}
                onChange={(e) =>
                  setReportDraft((r) => ({
                    ...r,
                    projectId: e.target.value || undefined,
                  }))
                }
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">(Optional)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Subject<span className="text-red-500">*</span>
            </label>
            <input
              value={reportDraft.subject || ""}
              onChange={(e) =>
                setReportDraft((r) => ({ ...r, subject: e.target.value }))
              }
              placeholder="Brief headline"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Description<span className="text-red-500">*</span>
            </label>
            <textarea
              value={reportDraft.description || ""}
              onChange={(e) =>
                setReportDraft((r) => ({ ...r, description: e.target.value }))
              }
              rows={4}
              placeholder="Describe the issue, relevant amounts, dates, and rationale."
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Reference / Evidence (optional)
            </label>
            <input
              value={reportDraft.reference || ""}
              onChange={(e) =>
                setReportDraft((r) => ({ ...r, reference: e.target.value }))
              }
              placeholder="Link or ref code"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600">
              Supporting Files (placeholder)
            </label>
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
              <div className="text-xs text-gray-500">
                Drag & drop or browse to attach (not implemented)
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Submission will be reviewed. False or malicious reports may be
            ignored.
          </div>
        </form>
      </Modal>

      {/* Report Confirmation Modal */}
      <Modal
        open={showReportConfirmation}
        onClose={cancelSubmitReport}
        title="Confirm Report Submission"
        actions={
          <>
            <button
              onClick={cancelSubmitReport}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={confirmSubmitReport}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Yes, Submit Report
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">
                  Important Notice
                </h4>
                <p className="text-sm text-yellow-700">
                  You are about to submit a transparency report. Please ensure
                  all information is accurate and complete before proceeding.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-sm text-gray-900">
                {reportDraft.type}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                Subject:
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {reportDraft.subject}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                Severity:
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {reportDraft.severity}
              </span>
            </div>
            {reportDraft.department && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Department:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {reportDraft.department}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-700">
                Description:
              </span>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-900 max-h-20 overflow-y-auto">
                {reportDraft.description}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Note:</strong> Once submitted, this report will be recorded
            in the system. All reports are treated seriously and reviewed for
            transparency concerns.
          </div>
        </div>
      </Modal>

      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>
            GovTrack Demo Interface — Data simulated for illustrative purposes.
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-gray-700"
            >
              Back to top
            </button>
            <span>v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GovTrackPage;
