<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExamController;
use App\Http\Controllers\Admin\ModuleController;
use App\Http\Controllers\Admin\ParticipantController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\ResultController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Exam\AuthController as ExamAuthController;
use App\Http\Controllers\Exam\ResultController as ExamResultController;
use App\Http\Controllers\Exam\WorkspaceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Landing'))->name('home');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AdminAuthController::class, 'create'])->name('login');
    Route::post('login', [AdminAuthController::class, 'store'])->name('login.store');
    Route::post('logout', [AdminAuthController::class, 'destroy'])->name('logout');

    Route::middleware('admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
        Route::match(['put', 'post'], 'settings', [SettingController::class, 'update'])->name('settings.update');

        Route::get('participants/template', [ParticipantController::class, 'template'])->name('participants.template');
        Route::post('participants/import', [ParticipantController::class, 'import'])->name('participants.import');
        Route::resource('participants', ParticipantController::class)->except(['create', 'show', 'edit']);

        Route::resource('exams', ExamController::class)->except(['create', 'show', 'edit']);

        Route::resource('modules', ModuleController::class);

        Route::get('questions/template', [QuestionController::class, 'template'])->name('questions.template');
        Route::post('questions/import', [QuestionController::class, 'import'])->name('questions.import');
        Route::get('questions', [QuestionController::class, 'index'])->name('questions.index');
        Route::get('questions/create', [QuestionController::class, 'create'])->name('questions.create');
        Route::post('questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::get('questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
        Route::match(['put', 'post'], 'questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');

        Route::get('results', [ResultController::class, 'index'])->name('results.index');
        Route::get('results/export', [ResultController::class, 'export'])->name('results.export');
        Route::get('results/print', [ResultController::class, 'print'])->name('results.print');
        Route::post('reset', [ResultController::class, 'reset'])->name('reset');
    });
});

Route::prefix('exam')->name('exam.')->group(function () {
    Route::get('login', [ExamAuthController::class, 'create'])->name('login');
    Route::post('login', [ExamAuthController::class, 'store'])->name('login.store');
    Route::post('logout', [ExamAuthController::class, 'destroy'])->name('logout');
    Route::get('result', [ExamResultController::class, 'show'])->name('result');

    Route::middleware('participant')->group(function () {
        Route::get('workspace', [WorkspaceController::class, 'index'])->name('workspace');
        Route::post('answer', [WorkspaceController::class, 'answer'])->name('answer');
        Route::post('violation', [WorkspaceController::class, 'violation'])->name('violation');
        Route::post('submit', [WorkspaceController::class, 'submit'])->name('submit');
    });
});
