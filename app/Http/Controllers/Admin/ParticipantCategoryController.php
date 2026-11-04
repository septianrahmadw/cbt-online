<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ParticipantCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = ParticipantCategory::query()
            ->withCount('participants')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Admin/ParticipantCategories/Index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/ParticipantCategories/Form', [
            'category' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $category = ParticipantCategory::create($data);

        return redirect()
            ->route('admin.participant-categories.index')
            ->with('success', "Kategori {$category->name} berhasil ditambahkan.");
    }

    public function edit(ParticipantCategory $participantCategory): Response
    {
        return Inertia::render('Admin/ParticipantCategories/Form', [
            'category' => [
                'id' => $participantCategory->id,
                'name' => $participantCategory->name,
                'code' => $participantCategory->code,
                'description' => $participantCategory->description,
                'is_active' => $participantCategory->is_active,
            ],
        ]);
    }

    public function update(Request $request, ParticipantCategory $participantCategory): RedirectResponse
    {
        $data = $this->validated($request, $participantCategory);

        $participantCategory->update($data);

        return redirect()
            ->route('admin.participant-categories.index')
            ->with('success', "Kategori {$participantCategory->name} berhasil diperbarui.");
    }

    public function destroy(ParticipantCategory $participantCategory): RedirectResponse
    {
        $name = $participantCategory->name;
        $participantCategory->delete();

        return redirect()
            ->route('admin.participant-categories.index')
            ->with('success', "Kategori {$name} dihapus. Peserta terkait tidak ikut dihapus.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?ParticipantCategory $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('participant_categories', 'code')->ignore($category?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);
    }
}
