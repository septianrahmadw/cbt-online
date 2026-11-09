<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ExamController;
use App\Http\Controllers\Admin\ModuleController;
use App\Http\Controllers\Admin\ParticipantCategoryController;
use App\Http\Controllers\Admin\ParticipantController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\ResultController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
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

    Route::middleware('staff')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('exams', [ExamController::class, 'index'])->name('exams.index');

        Route::middleware('role:admin')->group(function () {
            Route::get('exams/create', [ExamController::class, 'create'])->name('exams.create');
            Route::post('exams', [ExamController::class, 'store'])->name('exams.store');
            Route::get('exams/{exam}/edit', [ExamController::class, 'edit'])->name('exams.edit');
            Route::put('exams/{exam}', [ExamController::class, 'update'])->name('exams.update');
            Route::delete('exams/{exam}', [ExamController::class, 'destroy'])->name('exams.destroy');

            Route::resource('users', UserController::class)->except(['show', 'create', 'edit']);

            Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
            Route::match(['put', 'post'], 'settings', [SettingController::class, 'update'])->name('settings.update');

            Route::resource('participant-categories', ParticipantCategoryController::class)
                ->except(['show']);

            Route::get('participants/template', [ParticipantController::class, 'template'])->name('participants.template');
            Route::post('participants/import', [ParticipantController::class, 'import'])->name('participants.import');
            Route::resource('participants', ParticipantController::class)->except(['create', 'show', 'edit']);

            Route::resource('modules', ModuleController::class);

            Route::post('reset', [ResultController::class, 'reset'])->name('reset');

            Route::post('questions/{question}/review', [QuestionController::class, 'review'])->name('questions.review');
        });

        Route::middleware('role:admin,dosen')->group(function () {
            Route::get('questions/template', [QuestionController::class, 'template'])->name('questions.template');
            Route::post('questions/import', [QuestionController::class, 'import'])->name('questions.import');
            Route::get('questions', [QuestionController::class, 'index'])->name('questions.index');
            Route::get('questions/create', [QuestionController::class, 'create'])->name('questions.create');
            Route::post('questions', [QuestionController::class, 'store'])->name('questions.store');
            Route::get('questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
            Route::match(['put', 'post'], 'questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
            Route::delete('questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
            Route::post('questions/{question}/submit-review', [QuestionController::class, 'submitForReview'])->name('questions.submit-review');
        });

        Route::middleware('role:admin,dosen,pengawas')->group(function () {
            Route::get('results', [ResultController::class, 'index'])->name('results.index');
            Route::get('results/export', [ResultController::class, 'export'])->name('results.export');
            Route::get('results/print', [ResultController::class, 'print'])->name('results.print');
        });

        Route::middleware('role:admin,pengawas')->group(function () {
            Route::get('sessions', [SessionController::class, 'index'])->name('sessions.index');
            Route::post('sessions/stop-all', [SessionController::class, 'stopAll'])->name('sessions.stop-all');
            Route::post('sessions/{examSession}/stop', [SessionController::class, 'stop'])->name('sessions.stop');
        });
    });
});

Route::prefix('exam')->name('exam.')->group(function () {
    Route::get('login', [ExamAuthController::class, 'create'])->name('login');
    Route::post('login', [ExamAuthController::class, 'store'])->name('login.store');
    Route::post('check-number', [ExamAuthController::class, 'checkNumber'])
        ->middleware('throttle:30,1')
        ->name('check-number');
    Route::post('logout', [ExamAuthController::class, 'destroy'])->name('logout');
    Route::get('confirm', [ExamAuthController::class, 'confirm'])->name('confirm');
    Route::post('confirm/reset', [ExamAuthController::class, 'resetLookup'])->name('confirm.reset');
    Route::post('start', [ExamAuthController::class, 'start'])->name('start');
    Route::get('result', [ExamResultController::class, 'show'])->name('result');

    Route::middleware('participant')->group(function () {
        Route::get('workspace', [WorkspaceController::class, 'index'])->name('workspace');
        Route::post('answer', [WorkspaceController::class, 'answer'])->name('answer');
        Route::post('violation', [WorkspaceController::class, 'violation'])->name('violation');
        Route::post('submit', [WorkspaceController::class, 'submit'])->name('submit');
    });
});
