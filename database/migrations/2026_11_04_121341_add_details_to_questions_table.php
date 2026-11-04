<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->longText('passage')->nullable()->after('question_number');
            $table->string('type')->default('single')->after('passage'); // single, multiple
            $table->string('difficulty')->nullable()->after('type'); // mudah, sedang, sulit
            $table->text('explanation')->nullable()->after('image_url');
            $table->boolean('is_active')->default(true)->after('explanation');
        });

        Schema::table('question_options', function (Blueprint $table) {
            $table->string('label', 10)->change();
        });
    }

    public function down(): void
    {
        Schema::table('question_options', function (Blueprint $table) {
            $table->enum('label', ['A', 'B', 'C', 'D', 'E'])->change();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['passage', 'type', 'difficulty', 'explanation', 'is_active']);
        });
    }
};
