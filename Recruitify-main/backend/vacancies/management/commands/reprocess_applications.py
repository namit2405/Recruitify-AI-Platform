from django.core.management.base import BaseCommand
from vacancies.models import Application
from vacancies.ml_scoring import score_application_and_store_resume


class Command(BaseCommand):
    help = 'Re-process applications that have not been scored by ML'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Re-process all applications, even those already scored',
        )

    def handle(self, *args, **options):
        if options['all']:
            applications = Application.objects.all()
            self.stdout.write(f'Re-processing ALL {applications.count()} applications...')
        else:
            applications = Application.objects.filter(final_score=0.0)
            self.stdout.write(f'Re-processing {applications.count()} applications without ML scores...')

        success_count = 0
        error_count = 0

        for app in applications:
            try:
                if not app.candidate.resume:
                    self.stdout.write(self.style.WARNING(
                        f'  ⚠ App {app.id}: No resume for {app.candidate.name}'
                    ))
                    continue

                self.stdout.write(f'  Processing App {app.id}: {app.candidate.name} -> {app.vacancy.title}')
                
                final_score, category = score_application_and_store_resume(
                    candidate=app.candidate,
                    vacancy=app.vacancy,
                    application=app,
                )
                
                app.final_score = final_score
                app.category = category
                app.save(update_fields=['final_score', 'category'])
                
                self.stdout.write(self.style.SUCCESS(
                    f'    ✓ Score: {final_score:.2f}, Category: {category}'
                ))
                success_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'    ✗ Error: {str(e)}'
                ))
                error_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nCompleted: {success_count} successful, {error_count} errors'
        ))
