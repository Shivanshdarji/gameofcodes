"use client";

import { useGame } from "@/components/providers/GameProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Database, Download, TrendingUp, TrendingDown, Minus, Sparkles, Info, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface AIInsights {
    assessment: string;
    strengths: string[];
    improvements: string[];
    recommendations: {
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    predictions: string[];
    motivation: string;
}

interface AnalyticsData {
    userId: string;
    username: string;
    joinedAt: string;
    daysActive: number;
    credits: number;
    highestLevel: number;
    syntaxSkill: number;
    logicSkill: number;
    efficiencySkill: number;
    totalAttempts: number;
    uniqueLevelsCompleted: number;
    avgCompletionTime: number;
    avgCodeLines: number;
    totalCodeLines: number;
    debuggingSkill: number;
    optimizationSkill: number;
    architectureSkill: number;
    consistencyScore: number;
    learningVelocity: number;
    recentPerformance: any[];
    improvingSkills: string[];
    decliningSkills: string[];
    stableSkills: string[];
}

export default function AnalysisPage() {
    const { user } = useGame();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (user && user.id.length > 20 && !user.id.match(/^\d+$/)) {
                try {
                    // Fetch history for charts
                    const { data } = await supabase
                        .from('level_history')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('completed_at', { ascending: true })
                        .limit(50);

                    if (data) setHistory(data);

                    // Fetch comprehensive analytics
                    await fetchAnalytics();
                } catch (e) {
                    console.error("Failed to fetch data:", e);
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const fetchAnalytics = async () => {
        if (!user) return;

        setLoadingInsights(true);
        try {
            // Get the current session token
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const data = await response.json();
            if (data.analytics) setAnalytics(data.analytics);
            if (data.insights) setInsights(data.insights);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoadingInsights(false);
        }
    };

    if (!user) return <div className="h-screen flex items-center justify-center text-white">AUTHENTICATION REQUIRED</div>;

    if (isLoading || !analytics) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050511]">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    // Process data for charts - ALL REAL DATA, NO MOCKS
    const performanceData = history.map((entry, idx) => ({
        name: `Lvl ${entry.level_id}`,
        time: entry.time_taken_seconds || 0,
        lines: entry.code_lines || 0,
        level: entry.level_id
    }));

    // REAL RADAR DATA - All calculated from database
    const radarData = [
        { subject: 'Syntax', value: analytics.syntaxSkill, fullMark: 100 },
        { subject: 'Logic', value: analytics.logicSkill, fullMark: 100 },
        { subject: 'Speed', value: analytics.efficiencySkill, fullMark: 100 },
        { subject: 'Debugging', value: analytics.debuggingSkill, fullMark: 100 },
        { subject: 'Optimization', value: analytics.optimizationSkill, fullMark: 100 },
        { subject: 'Architecture', value: analytics.architectureSkill, fullMark: 100 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'bg-green-500/10 border-green-500/20';
        if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    const metricExplanations = {
        syntax: {
            title: 'Syntax Skill',
            description: 'Measures your ability to write correct C syntax without errors',
            calculation: 'Weighted average updated after each level based on syntax errors detected',
            tips: ['Review C syntax rules', 'Practice writing code without IDE assistance', 'Study common syntax patterns']
        },
        logic: {
            title: 'Logic Skill',
            description: 'Measures your problem-solving and algorithmic thinking ability',
            calculation: 'Based on solution correctness and approach efficiency',
            tips: ['Practice algorithm design', 'Study data structures', 'Solve coding challenges']
        },
        efficiency: {
            title: 'Speed/Efficiency',
            description: 'Measures how quickly you solve problems',
            calculation: 'Based on completion time relative to level complexity',
            tips: ['Practice typing speed', 'Learn keyboard shortcuts', 'Improve problem recognition']
        },
        debugging: {
            title: 'Debugging Skill',
            description: 'Measures ability to identify and fix errors quickly',
            calculation: `Calculated as: 100 - (average retries per level × 15). Current avg retries: ${((100 - analytics.debuggingSkill) / 15).toFixed(1)}`,
            tips: ['Learn to read error messages', 'Use systematic debugging approaches', 'Practice error pattern recognition']
        },
        optimization: {
            title: 'Optimization Skill',
            description: 'Measures code efficiency and conciseness',
            calculation: 'Ratio of optimal solution length to your actual code length',
            tips: ['Study efficient algorithms', 'Learn to refactor code', 'Practice writing concise solutions']
        },
        architecture: {
            title: 'Architecture Skill',
            description: 'Measures understanding of complex system design',
            calculation: `Based on advanced level completion (50+). Completed: ${history.filter(h => h.level_id >= 50).length} advanced levels`,
            tips: ['Study software design patterns', 'Practice system design', 'Learn modular programming']
        },
        consistency: {
            title: 'Consistency Score',
            description: 'Measures reliability and steady performance',
            calculation: 'Statistical analysis of completion time variance',
            tips: ['Maintain regular practice schedule', 'Focus on steady improvement', 'Avoid rushing']
        },
        velocity: {
            title: 'Learning Velocity',
            description: 'Measures your rate of improvement over time',
            calculation: `${analytics.learningVelocity > 0 ? 'Improving' : 'Needs focus'} - comparing recent vs early performance`,
            tips: ['Track your progress', 'Set incremental goals', 'Review past solutions']
        }
    };

    return (
        <div className="min-h-screen bg-[#050511] text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                            DEEP ANALYSIS DASHBOARD
                        </h1>
                        <div className="text-sm text-white/40 font-mono">
                            CADET: {analytics.username} | ACTIVE: {analytics.daysActive} DAYS
                        </div>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        disabled={loadingInsights}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                        Refresh AI Insights
                    </button>
                </div>

                {/* Performance Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Missions Completed"
                        value={analytics.uniqueLevelsCompleted}
                        icon={<CheckCircle className="w-5 h-5" />}
                        color="cyan"
                    />
                    <StatCard
                        label="Total Attempts"
                        value={analytics.totalAttempts}
                        icon={<Database className="w-5 h-5" />}
                        color="purple"
                    />
                    <StatCard
                        label="Credits Earned"
                        value={analytics.credits}
                        icon={<Sparkles className="w-5 h-5" />}
                        color="yellow"
                    />
                    <StatCard
                        label="Code Lines Written"
                        value={analytics.totalCodeLines}
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="green"
                    />
                </div>

                {/* AI Insights Panel */}
                {insights && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-2 border-purple-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <h2 className="text-xl font-bold font-orbitron text-purple-400">AI-POWERED INSIGHTS</h2>
                            </div>

                            <p className="text-white/80 mb-6 leading-relaxed">{insights.assessment}</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-mono text-green-400 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> YOUR STRENGTHS
                                    </h3>
                                    <ul className="space-y-2">
                                        {insights.strengths.map((strength, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                                                <span className="text-green-400 mt-0.5">✓</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-mono text-yellow-400 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> AREAS TO IMPROVE
                                    </h3>
                                    <ul className="space-y-2">
                                        {insights.improvements.map((improvement, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                                                <span className="text-yellow-400 mt-0.5">→</span>
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
                                <h3 className="text-sm font-mono text-cyan-400 mb-3">PERSONALIZED RECOMMENDATIONS</h3>
                                <div className="space-y-3">
                                    {insights.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {rec.priority.toUpperCase()}
                                            </span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-white text-sm">{rec.title}</div>
                                                <div className="text-white/60 text-xs mt-1">{rec.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <p className="text-sm text-purple-200 italic">💬 {insights.motivation}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Performance Timeline */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 h-[400px]">
                        <h3 className="text-sm font-mono text-cyan-400 mb-6 flex items-center gap-2">
                            <ActivityIcon /> PERFORMANCE TIMELINE (REAL DATA)
                        </h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLines" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="time" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTime)" />
                                    <Area type="monotone" dataKey="lines" stroke="#a855f7" fillOpacity={1} fill="url(#colorLines)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Skill Vector Radar - ALL REAL DATA */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 h-[400px]">
                        <h3 className="text-sm font-mono text-purple-400 mb-6 flex items-center gap-2">
                            <Database className="w-4 h-4" /> SKILL VECTOR (100% REAL METRICS)
                        </h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#ffffff20" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Skills" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="Syntax"
                        score={analytics.syntaxSkill}
                        explanation={metricExplanations.syntax}
                        expanded={expandedMetric === 'syntax'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'syntax' ? null : 'syntax')}
                    />
                    <MetricCard
                        title="Logic"
                        score={analytics.logicSkill}
                        explanation={metricExplanations.logic}
                        expanded={expandedMetric === 'logic'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'logic' ? null : 'logic')}
                    />
                    <MetricCard
                        title="Speed"
                        score={analytics.efficiencySkill}
                        explanation={metricExplanations.efficiency}
                        expanded={expandedMetric === 'efficiency'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'efficiency' ? null : 'efficiency')}
                    />
                    <MetricCard
                        title="Debugging"
                        score={analytics.debuggingSkill}
                        explanation={metricExplanations.debugging}
                        expanded={expandedMetric === 'debugging'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'debugging' ? null : 'debugging')}
                    />
                    <MetricCard
                        title="Optimization"
                        score={analytics.optimizationSkill}
                        explanation={metricExplanations.optimization}
                        expanded={expandedMetric === 'optimization'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'optimization' ? null : 'optimization')}
                    />
                    <MetricCard
                        title="Architecture"
                        score={analytics.architectureSkill}
                        explanation={metricExplanations.architecture}
                        expanded={expandedMetric === 'architecture'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'architecture' ? null : 'architecture')}
                    />
                    <MetricCard
                        title="Consistency"
                        score={analytics.consistencyScore}
                        explanation={metricExplanations.consistency}
                        expanded={expandedMetric === 'consistency'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'consistency' ? null : 'consistency')}
                    />
                    <MetricCard
                        title="Learning Velocity"
                        score={Math.max(0, Math.min(100, 50 + analytics.learningVelocity))}
                        explanation={metricExplanations.velocity}
                        expanded={expandedMetric === 'velocity'}
                        onToggle={() => setExpandedMetric(expandedMetric === 'velocity' ? null : 'velocity')}
                        isVelocity
                        velocityValue={analytics.learningVelocity}
                    />
                </div>

                {/* Activity History Table */}
                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-sm font-mono text-white/60">COMPLETE ACTIVITY LOG</h3>
                        <button className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                            <Download className="w-4 h-4" /> EXPORT_CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-white/40 font-mono text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Time (s)</th>
                                    <th className="px-6 py-4">Code Lines</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.length > 0 ? history.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">Level {entry.level_id}</td>
                                        <td className="px-6 py-4 font-mono text-cyan-400">{entry.time_taken_seconds || 0}s</td>
                                        <td className="px-6 py-4 font-mono text-purple-400">{entry.code_lines || 0}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs border border-green-500/20">SUCCESS</span>
                                        </td>
                                        <td className="px-6 py-4 text-white/40 text-xs">{new Date(entry.completed_at).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-white/20 italic">No activity recorded yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'cyan' | 'purple' | 'yellow' | 'green';
}) {
    const colors = {
        cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
        green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 font-mono uppercase">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
        </div>
    );
}

function MetricCard({ title, score, explanation, expanded, onToggle, isVelocity, velocityValue }: any) {
    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'bg-green-500/10 border-green-500/20';
        if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20';
        return 'bg-red-500/10 border-red-500/20';
    };

    return (
        <motion.div
            layout
            className={`bg-black/40 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors ${expanded ? 'col-span-full' : ''
                }`}
            onClick={onToggle}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/60 font-mono uppercase">{title}</span>
                <Info className="w-4 h-4 text-white/40" />
            </div>

            <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
                {isVelocity && velocityValue !== undefined ? (
                    <span>{velocityValue > 0 ? '+' : ''}{velocityValue}%</span>
                ) : (
                    <span>{score}/100</span>
                )}
            </div>

            <div className={`inline-block px-2 py-1 rounded text-xs ${getScoreBg(score)}`}>
                {score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Needs Work'}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10"
                    >
                        <h4 className="text-sm font-bold text-white mb-2">{explanation.title}</h4>
                        <p className="text-xs text-white/60 mb-3">{explanation.description}</p>

                        <div className="bg-white/5 rounded p-3 mb-3">
                            <div className="text-xs text-cyan-400 font-mono mb-1">CALCULATION:</div>
                            <div className="text-xs text-white/70">{explanation.calculation}</div>
                        </div>

                        <div>
                            <div className="text-xs text-purple-400 font-mono mb-2">HOW TO IMPROVE:</div>
                            <ul className="space-y-1">
                                {explanation.tips.map((tip: string, idx: number) => (
                                    <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                                        <span className="text-purple-400">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ActivityIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-cyan-400">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    )
}
