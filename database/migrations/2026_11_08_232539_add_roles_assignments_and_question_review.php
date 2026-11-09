<?php

use App\QuestionReviewStatus;
use App\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default(UserRole::Admin->value)->after('password');
            $table->boolean('is_active')->default(true)->after('role');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->foreignId('created_by')->nullable()->after('last_login_at')->constrained('users')->nullOnDelete();
        });

        Schema::create('exam_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['exam_id', 'user_id']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('total_questions')->constrained('users')->nullOnDelete();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->string('review_status', 20)->default(QuestionReviewStatus::Approved->value)->after('is_active');
            $table->text('review_note')->nullable()->after('review_status');
            $table->foreignId('reviewed_by')->nullable()->after('review_note')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->foreignId('created_by')->nullable()->after('reviewed_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn(['review_status', 'review_note', 'reviewed_by', 'reviewed_at', 'created_by']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });

        Schema::dropIfExists('exam_assignments');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['role', 'is_active', 'last_login_at', 'created_by']);
        });
    }
};
