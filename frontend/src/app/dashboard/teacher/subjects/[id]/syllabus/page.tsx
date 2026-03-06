'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import NotesRepository from '@/components/dashboard/NotesRepository';

export default function SubjectSyllabusPage() {
    const { id } = useParams();
    return <NotesRepository subjectId={id as string} initialTab="syllabus" />;
}
