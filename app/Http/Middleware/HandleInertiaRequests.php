<?php

namespace App\Http\Middleware;

use App\Models\ExamSession;
use App\Models\InstitutionSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'appName' => config('app.name'),
            'institution' => fn () => InstitutionSetting::current()->only([
                'school_name', 'logo_url', 'academic_year', 'exam_event_name', 'passing_grade_default',
            ]),
            'auth' => [
                'user' => function () use ($request) {
                    $user = $request->user();

                    if (! $user) {
                        return null;
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role?->value,
                        'role_label' => $user->role?->label(),
                    ];
                },
            ],
            'examParticipant' => function () use ($request) {
                $id = $request->session()->get('exam_session_id');

                if (! $id) {
                    return null;
                }

                $session = ExamSession::with(['exam', 'participant'])->find($id);

                if (! $session) {
                    return null;
                }

                return [
                    'session_id' => $session->id,
                    'participant' => $session->participant?->only(['id', 'exam_number', 'full_name', 'class_name']),
                    'exam' => $session->exam?->only(['id', 'title', 'subject_name', 'duration_minutes']),
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
