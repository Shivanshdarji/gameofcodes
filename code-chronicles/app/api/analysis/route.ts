import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

console.log('[Analysis Route] Loading...');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Analysis Route] Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}) : null;

if (!openai) {
    console.warn('[Analysis Route] OpenAI API key not configured');
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

export async function POST(request: Request) {
    console.log('[Analysis Route] POST handler called');

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get the authorization token from headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        // Create an authenticated Supabase client if we have a token
        let authSupabase = supabase;
        if (token && supabaseUrl && supabaseKey) {
            authSupabase = createClient(supabaseUrl, supabaseKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });
            console.log('[Analysis Route] Using authenticated Supabase client');
        } else {
            console.log('[Analysis Route] Using anon Supabase client (no token provided)');
        }

        if (!authSupabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        // Fetch comprehensive user data
        const analyticsData = await fetchUserAnalytics(userId, authSupabase);

        if (!analyticsData) {
            return NextResponse.json({ error: 'No data found for user' }, { status: 404 });
        }

        // Generate AI insights
        const insights = await generateAIInsights(analyticsData);

        // Return analytics with AI insights
        return NextResponse.json({
            analytics: analyticsData,
            insights
        });

    } catch (error: any) {
        console.error('[Analysis Route] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate analysis', details: error.message },
            { status: 500 }
        );
    }
}

async function fetchUserAnalytics(userId: string, supabaseClient: typeof supabase): Promise<AnalyticsData | null> {
    if (!supabaseClient) return null;

    try {
        console.log('[Analysis Route] Fetching analytics for user:', userId);

        // Fetch game stats
        const { data: gameStats, error: statsError } = await supabaseClient
            .from('game_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        console.log('[Analysis Route] Game stats query result:', { gameStats, error: statsError });

        if (statsError) {
            console.error('[Analysis Route] Stats error (non-fatal):', statsError.message);
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('username, updated_at, created_at')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[Analysis Route] Profile error (non-fatal):', profileError.message);
        }

        // Fetch level history
        const { data: history, error: historyError } = await supabaseClient
            .from('level_history')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: true });

        if (historyError) {
            console.error('[Analysis Route] History error:', historyError);
        }

        console.log('[Analysis Route] Data fetched - gameStats:', !!gameStats, 'profile:', !!profile, 'history:', history?.length || 0);

        // DEFAULT DATA IF MISSING
        // If data is missing, we shouldn't fail - we should return "New User" state
        const safeProfile = profile || {
            username: 'Cadet',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const safeGameStats = gameStats || {
            credits: 0,
            highest_level: 0,
            syntax_skill: 0,
            logic_skill: 0,
            efficiency_skill: 0
        };

        // Use history if available, otherwise use empty array
        const userHistory = history || [];

        // Calculate days active
        const joinedDate = new Date(safeProfile.created_at || new Date());
        const now = new Date();
        const daysActive = Math.max(1, Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)));

        // Basic aggregations
        const totalAttempts = userHistory.length;
        const uniqueLevelsCompleted = new Set(userHistory.map((h: any) => h.level_id)).size;
        const avgCompletionTime = userHistory.reduce((sum: number, h: any) => sum + (h.time_taken_seconds || 0), 0) / (totalAttempts || 1);
        const avgCodeLines = userHistory.reduce((sum: number, h: any) => sum + (h.code_lines || 0), 0) / (totalAttempts || 1);
        const totalCodeLines = userHistory.reduce((sum: number, h: any) => sum + (h.code_lines || 0), 0);

        // Calculate Debugging Skill
        const levelAttemptCounts: Record<number, number> = {};
        userHistory.forEach((h: any) => {
            levelAttemptCounts[h.level_id] = (levelAttemptCounts[h.level_id] || 0) + 1;
        });

        const avgRetriesPerLevel = uniqueLevelsCompleted > 0
            ? Object.values(levelAttemptCounts).reduce((sum: number, count: number) => sum + (count - 1), 0) / uniqueLevelsCompleted
            : 0;

        const debuggingSkill = Math.max(0, Math.min(100, 100 - (avgRetriesPerLevel * 15)));

        // Calculate Optimization Skill
        let optimizationSkill = 50; // Default
        if (userHistory.length > 0) {
            const optimizationScores = userHistory.map((h: any) => {
                if (!h.code_lines) return 50;
                const leveluserHistory = userHistory.filter((lh: any) => lh.level_id === h.level_id);
                const avgLinesForLevel = leveluserHistory.reduce((sum: number, lh: any) => sum + (lh.code_lines || 0), 0) / leveluserHistory.length;
                const optimalLines = avgLinesForLevel * 0.8;
                return Math.min(100, (optimalLines / h.code_lines) * 100);
            });
            optimizationSkill = optimizationScores.reduce((sum: number, s: number) => sum + s, 0) / optimizationScores.length;
        }

        // Calculate Architecture Skill
        const advancedLevelsCompleted = userHistory.filter((h: any) => h.level_id >= 50).length;
        const architectureSkill = Math.min(100, (advancedLevelsCompleted / 50) * 100);

        // Calculate Consistency Score
        let consistencyScore = 80; // Default for new users
        const times = userHistory.map((h: any) => h.time_taken_seconds || 0).filter((t: number) => t > 0);
        if (times.length > 1) {
            const meanTime = times.reduce((sum: number, t: number) => sum + t, 0) / times.length;
            const variance = times.reduce((sum: number, t: number) => sum + Math.pow(t - meanTime, 2), 0) / times.length;
            const stdDev = Math.sqrt(variance);
            consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / (meanTime || 1) * 50)));
        }

        // Calculate Learning Velocity
        let learningVelocity = 0;
        if (userHistory.length >= 2) {
            const recentuserHistory = userHistory.slice(-10);
            const earlyuserHistory = userHistory.slice(0, 10);
            const recentAvgTime = recentuserHistory.reduce((sum: number, h: any) => sum + (h.time_taken_seconds || 0), 0) / recentuserHistory.length || 1;
            const earlyAvgTime = earlyuserHistory.reduce((sum: number, h: any) => sum + (h.time_taken_seconds || 0), 0) / earlyuserHistory.length || 1;
            learningVelocity = ((earlyAvgTime - recentAvgTime) / earlyAvgTime) * 100;
        }

        // Determine skill trends
        const recentPerformance = userHistory.slice(-10);
        const improvingSkills: string[] = [];
        const decliningSkills: string[] = [];
        const stableSkills: string[] = [];

        if (safeGameStats.syntax_skill >= 70) improvingSkills.push('Syntax');
        else if (safeGameStats.syntax_skill < 50) decliningSkills.push('Syntax');
        else stableSkills.push('Syntax');

        if (safeGameStats.logic_skill >= 70) improvingSkills.push('Logic');
        else if (safeGameStats.logic_skill < 50) decliningSkills.push('Logic');
        else stableSkills.push('Logic');

        if (safeGameStats.efficiency_skill >= 70) improvingSkills.push('Speed');
        else if (safeGameStats.efficiency_skill < 50) decliningSkills.push('Speed');
        else stableSkills.push('Speed');

        console.log('[Analysis Route] Analytics calculated successfully');

        return {
            userId,
            username: safeProfile.username || 'Cadet',
            joinedAt: safeProfile.created_at || new Date().toISOString(),
            daysActive,
            credits: safeGameStats.credits || 0,
            highestLevel: safeGameStats.highest_level || 0,
            syntaxSkill: safeGameStats.syntax_skill || 0,
            logicSkill: safeGameStats.logic_skill || 0,
            efficiencySkill: safeGameStats.efficiency_skill || 0,
            totalAttempts,
            uniqueLevelsCompleted,
            avgCompletionTime: Math.round(avgCompletionTime),
            avgCodeLines: Math.round(avgCodeLines),
            totalCodeLines,
            debuggingSkill: Math.round(debuggingSkill),
            optimizationSkill: Math.round(optimizationSkill),
            architectureSkill: Math.round(architectureSkill),
            consistencyScore: Math.round(consistencyScore),
            learningVelocity: Math.round(learningVelocity),
            recentPerformance,
            improvingSkills,
            decliningSkills,
            stableSkills,
        };

    } catch (error) {
        console.error('[Analysis Route] Error fetching analytics:', error);
        return null;
    }
}

async function generateAIInsights(analytics: AnalyticsData) {
    if (!openai) {
        console.warn('[Analysis Route] OpenAI not configured, returning fallback insights');
        return {
            assessment: 'AI insights are currently unavailable. Please configure OPENAI_API_KEY.',
            strengths: ['Continue practicing', 'Stay consistent', 'Keep learning'],
            improvements: ['Review fundamentals', 'Practice regularly', 'Challenge yourself'],
            recommendations: [{
                title: 'Keep Coding',
                description: 'Continue working through levels to improve your skills.',
                priority: 'medium' as const
            }],
            predictions: ['You will improve with practice'],
            motivation: 'Keep up the great work, Cadet!'
        };
    }

    try {
        const prompt = `You are an expert C programming mentor analyzing a student's performance. Generate personalized insights based on their analytics and motivate and appriciate them on their Strength and also tell their weak points and how to improve them.

Student: ${analytics.username}
Days Active: ${analytics.daysActive}
Highest Level: ${analytics.highestLevel}
Total Attempts: ${analytics.totalAttempts}
Levels Completed: ${analytics.uniqueLevelsCompleted}

Skills:
- Syntax: ${analytics.syntaxSkill}/100
- Logic: ${analytics.logicSkill}/100
- Efficiency: ${analytics.efficiencySkill}/100
- Debugging: ${analytics.debuggingSkill}/100
- Optimization: ${analytics.optimizationSkill}/100
- Architecture: ${analytics.architectureSkill}/100

Performance Metrics:
- Consistency Score: ${analytics.consistencyScore}/100
- Learning Velocity: ${analytics.learningVelocity}%
- Avg Completion Time: ${analytics.avgCompletionTime}s
- Avg Code Lines: ${analytics.avgCodeLines}

Skill Trends:
- Improving: ${analytics.improvingSkills.join(', ') || 'None'}
- Declining: ${analytics.decliningSkills.join(', ') || 'None'}
- Stable: ${analytics.stableSkills.join(', ') || 'None'}

Generate a JSON response with:
1. assessment: A 2-3 sentence overall assessment of their progress
2. strengths: Array of 3-5 specific strengths (short phrases)
3. improvements: Array of 3-5 specific areas to improve (short phrases)
4. recommendations: Array of 2-4 actionable recommendations, each with:
   - title: Short title
   - description: 1-2 sentence description
   - priority: 'high', 'medium', or 'low'
5. predictions: Array of 2-3 predictions about their future progress
6. motivation: A personalized, encouraging message (1-2 sentences)

Be specific, encouraging, and actionable. Reference their actual stats.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const insights = JSON.parse(completion.choices[0].message.content || '{}');
        console.log('[Analysis Route] AI insights generated successfully');
        return insights;

    } catch (error: any) {
        console.error('[Analysis Route] Error generating AI insights:', error);
        return {
            assessment: `Great progress, ${analytics.username}! You've completed ${analytics.uniqueLevelsCompleted} levels and are showing consistent improvement.`,
            strengths: [
                `Strong ${analytics.improvingSkills[0] || 'coding'} skills`,
                `${analytics.consistencyScore}% consistency score`,
                `Completed ${analytics.totalAttempts} challenges`
            ],
            improvements: [
                'Continue practicing daily',
                'Focus on code optimization',
                'Challenge yourself with harder levels'
            ],
            recommendations: [{
                title: 'Keep Building Momentum',
                description: `You're at level ${analytics.highestLevel}. Keep pushing forward!`,
                priority: 'high' as const
            }],
            predictions: [
                'You will reach the next skill milestone soon',
                'Your consistency will lead to mastery'
            ],
            motivation: `You're doing amazing, ${analytics.username}! Keep up the excellent work! 🚀`
        };
    }
}
