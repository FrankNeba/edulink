from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Create or update the EduLink vice-principal superuser'

    def handle(self, *args, **options):
        email = 'edulinkcameroon@gmail.com'
        password = 'Edulink2026#'

        if User.objects.filter(email=email).exists():
            u = User.objects.get(email=email)
            u.set_password(password)
            u.is_superuser = True
            u.is_staff = True
            u.role = 'VICE_PRINCIPAL'
            u.save()
            self.stdout.write(self.style.SUCCESS(f'Updated existing user: {email}'))
        else:
            u = User(
                email=email,
                first_name='Vice',
                last_name='Principal',
                role='VICE_PRINCIPAL',
                is_superuser=True,
                is_staff=True,
            )
            u.set_password(password)
            u.save()
            self.stdout.write(self.style.SUCCESS(f'Created superuser: {email}'))
