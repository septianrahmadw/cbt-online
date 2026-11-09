export interface Institution {
    school_name: string;
    logo_url: string | null;
    academic_year: string | null;
    exam_event_name: string | null;
    passing_grade_default: number;
}

export type UserRole = 'admin' | 'dosen' | 'pengawas';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    role_label: string;
}

export interface SharedProps {
    appName: string;
    institution: Institution;
    auth: {
        user: AuthUser | null;
    };
    examParticipant: {
        session_id: number;
        participant: {
            id: number;
            exam_number: string;
            full_name: string;
            class_name: string | null;
        } | null;
        exam: {
            id: number;
            title: string;
            subject_name: string;
            duration_minutes: number;
        } | null;
    } | null;
    flash: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
}
