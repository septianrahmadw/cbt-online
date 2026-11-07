<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InstitutionSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => InstitutionSetting::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'school_name' => ['required', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'exam_event_name' => ['nullable', 'string', 'max:255'],
            'passing_grade_default' => ['required', 'integer', 'min:0', 'max:100'],
            'violations_enabled' => ['boolean'],
            'violation_limit' => ['required', 'integer', 'min:1', 'max:10'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        $settings = InstitutionSetting::current();

        if ($request->hasFile('logo')) {
            $data['logo_url'] = '/storage/'.$request->file('logo')->store('institution', 'public');
        }

        unset($data['logo']);

        $data['violations_enabled'] = (bool) ($data['violations_enabled'] ?? false);

        $settings->update($data);

        return back()->with('success', 'Pengaturan lembaga berhasil disimpan.');
    }
}
