<?php

namespace App\Providers;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\User;
use App\Policies\ExamPolicy;
use App\Policies\ExamSessionPolicy;
use App\Policies\QuestionPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(Question::class, QuestionPolicy::class);
        Gate::policy(ExamSession::class, ExamSessionPolicy::class);

        if (app()->isProduction()) {
            URL::forceScheme('https');
        }
    }
}
