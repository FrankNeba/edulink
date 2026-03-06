'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import QuizRepository from '@/components/dashboard/QuizRepository';

export default function SubjectAssessmentsPage() {
    const { id } = useParams();
    return <QuizRepository subjectId={id as string} />;
}
