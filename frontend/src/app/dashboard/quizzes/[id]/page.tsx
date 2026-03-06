'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    AlertTriangle, CheckSquare, Clock,
    Maximize, ChevronRight, ChevronLeft
} from 'lucide-react';

export default function TakeQuizPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const startQuiz = async () => {
            try {
                const res = await api.get(`quizzes/${id}/take/`);
                setQuiz(res.data);
                setTimeLeft(res.data.duration * 60);
                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to start quiz');
                setLoading(false);
            }
        };
        startQuiz();
    }, [id]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = !!document.fullscreenElement;
            setIsFullscreen(active);
        };

        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted && isFullscreen) {
                submitQuiz(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSubmitted, isFullscreen]);

    useEffect(() => {
        if (timeLeft > 0 && isFullscreen && !isSubmitted) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && quiz && !isSubmitted && isFullscreen) {
            submitQuiz(true);
        }
    }, [timeLeft, isFullscreen, isSubmitted, quiz]);

    const enterFullscreen = () => {
        containerRef.current?.requestFullscreen();
    };

    const handleOptionChange = (questionId: number, choiceId: number) => {
        setAnswers({ ...answers, [questionId]: choiceId });
    };

    const submitQuiz = async (auto = false) => {
        if (isSubmitted) return;
        setIsSubmitted(true);

        try {
            const formattedAnswers = Object.entries(answers).map(([qId, cId]) => ({
                question_id: parseInt(qId),
                choice_id: cId
            }));

            const res = await api.post(`quizzes/${id}/submit/`, {
                answers: formattedAnswers,
                auto_submitted: auto
            });

            if (document.fullscreenElement) {
                document.exitFullscreen();
            }

            alert(`Quiz Submitted! Final Score: ${res.data.score}`);
            router.push('/dashboard/quizzes');
        } catch (err) {
            console.error('Submission failed', err);
            setIsSubmitted(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading quiz...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    if (!isFullscreen && !isSubmitted) {
        return (
            <div className="max-w-xl mx-auto mt-20 text-center space-y-6">
                <div className="p-12 border-2 border-primary/20 bg-primary/5 rounded-3xl">
                    <Maximize className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-2">{quiz.title}</h1>
                    <p className="text-slate-500 font-medium mb-8">
                        This quiz must be taken in fullscreen mode. Switching tabs or exiting fullscreen will automatically submit your answers.
                    </p>
                    <button onClick={enterFullscreen} className="bg-primary hover:bg-primary/90 text-white w-full py-4 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                        Enter Fullscreen & Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentIndex];
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-white dark:bg-slate-950 z-50 overflow-auto">
            <div className="max-w-4xl mx-auto p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-12 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{quiz.title}</h2>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Item {currentIndex + 1} of {quiz.questions.length}</p>
                    </div>
                    <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-lg ${timeLeft < 60 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white'}`}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex-1">
                    <div className="space-y-8">
                        <h3 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
                            {currentQuestion.text}
                        </h3>

                        {currentQuestion.image && (
                            <div className="max-w-lg">
                                <img src={currentQuestion.image} alt="Question" className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.choices.map((choice: any) => (
                                <button
                                    key={choice.id}
                                    onClick={() => handleOptionChange(currentQuestion.id, choice.id)}
                                    className={`p-6 text-left border-2 rounded-2xl transition-all flex items-center gap-4 ${answers[currentQuestion.id] === choice.id
                                        ? 'border-primary bg-primary/5 shadow-inner'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[currentQuestion.id] === choice.id ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {answers[currentQuestion.id] === choice.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{choice.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={currentIndex === quiz.questions.length - 1}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {currentIndex === quiz.questions.length - 1 ? (
                        <button onClick={() => submitQuiz(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-3 text-lg font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                            Finalize Submission
                        </button>
                    ) : (
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Progress Velocity: {Math.round(((currentIndex + 1) / quiz.questions.length) * 100)}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
