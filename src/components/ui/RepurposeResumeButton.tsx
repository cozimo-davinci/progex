import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { JobApplication } from '@/types/types';
import { useState } from 'react';

// interface JobApplication {
//     id: string;
//     tailoredResumeKey: string;
//     tailoredResumeContent: string;
//     missingKeywords?: string[];
// }

interface RepurposeResumeButtonProps {
    application: JobApplication;
    setApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
    saveContentDebounced: (key: string, content: string) => void;
}

const RepurposeResumeButton: React.FC<RepurposeResumeButtonProps> = ({ application, setApplications, saveContentDebounced }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const handleRepurpose = async () => {
        if (!application.missingKeywords || application.missingKeywords.length === 0) {
            toast.error('No missing keywords to repurpose');
            return;
        }

        try {
            const response = await fetch('/api/regenerate-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: application.id,
                    currentTailoredResumeContent: application.tailoredResumeContent,
                    missingKeywords: application.missingKeywords,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate resume');
            }

            const { newResumeContent } = await response.json();

            setApplications(prev =>
                prev.map(app =>
                    app.id === application.id ? { ...app, tailoredResumeContent: newResumeContent } : app
                )
            );

            saveContentDebounced(application.tailoredResumeKey, newResumeContent);
            toast.success('Resume repurposed successfully');
        } catch (error) {
            console.error('Error repurposing resume:', error);
            toast.error('Failed to repurpose resume');
        }
    };

    return (
        <Button
            onClick={handleRepurpose}
            className="text-white border-white border-2 rounded-md hover:scale-105 shadow-lg border-b-4 border-r-4 border-r-yellow-500 border-b-yellow-500"
        >
            {isProcessing ? 'Repurposing...' : 'Repurpose Resume'}
        </Button>
    );
};

export default RepurposeResumeButton;