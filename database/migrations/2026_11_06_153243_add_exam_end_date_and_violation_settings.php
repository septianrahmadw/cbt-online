<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_settings', function (Blueprint $table) {
            $table->boolean('violations_enabled')->default(true)->after('passing_grade_default');
            $table->unsignedTinyInteger('violation_limit')->default(3)->after('violations_enabled');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dateTime('exam_end_date')->nullable()->after('exam_date');
            $table->boolean('violations_enabled')->nullable()->after('is_active');
            $table->unsignedTinyInteger('violation_limit')->nullable()->after('violations_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['exam_end_date', 'violations_enabled', 'violation_limit']);
        });

        Schema::table('institution_settings', function (Blueprint $table) {
            $table->dropColumn(['violations_enabled', 'violation_limit']);
        });
    }
};
