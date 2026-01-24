import { Card } from "@/components/ui/Card";

interface MissionBriefProps {
    title: string;
    description: string;
    objectives: string[];
}

export default function MissionBrief({ title, description, objectives }: MissionBriefProps) {
    return (
        <Card className="h-full overflow-y-auto border-r border-surface-border rounded-none rounded-l-lg bg-surface/50">
            <h2 className="text-2xl font-orbitron text-primary mb-4">{title}</h2>
            <div className="prose prose-invert max-w-none">
                <p className="text-foreground/80 mb-6">{description}</p>

                <h3 className="text-xl font-orbitron text-secondary mb-2">Objectives</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                    {objectives.map((obj, index) => (
                        <li key={index}>{obj}</li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}
