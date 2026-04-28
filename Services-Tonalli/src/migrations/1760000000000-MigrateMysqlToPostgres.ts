import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateMysqlToPostgres1760000000000 implements MigrationInterface {
  name = 'MigrateMysqlToPostgres1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "quizzes"
      ALTER COLUMN "questionsPool" TYPE jsonb
      USING CASE
        WHEN "questionsPool" IS NULL OR "questionsPool" = '' THEN '[]'::jsonb
        ELSE "questionsPool"::jsonb
      END
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapter_modules"
      ALTER COLUMN "questionsPool" TYPE jsonb
      USING CASE
        WHEN "questionsPool" IS NULL OR "questionsPool" = '' THEN NULL
        ELSE "questionsPool"::jsonb
      END
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapter_questions"
      ALTER COLUMN "options" TYPE jsonb
      USING "options"::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "lessons"
      ALTER COLUMN "content" TYPE text
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapters"
      ALTER COLUMN "content" TYPE text
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapter_modules"
      ALTER COLUMN "content" TYPE text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapter_questions"
      ALTER COLUMN "options" TYPE json
      USING "options"::json
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "chapter_modules"
      ALTER COLUMN "questionsPool" TYPE text
      USING "questionsPool"::text
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "quizzes"
      ALTER COLUMN "questionsPool" TYPE text
      USING "questionsPool"::text
    `);
  }
}
