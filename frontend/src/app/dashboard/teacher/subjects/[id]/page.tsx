'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SubjectHubRoot() {
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        router.replace(`/dashboard/teacher/subjects/${id}/notes`);
    }, [id, router]);

    return null;
}
