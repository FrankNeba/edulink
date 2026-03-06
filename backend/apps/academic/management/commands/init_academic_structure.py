from django.core.management.base import BaseCommand
from apps.academic.models import Domain, SubDomain, AcademicLevel, Department, BaseSubject

class Command(BaseCommand):
    help = 'Initialize Domain, SubDomain, AcademicLevel, Departments and GCE subjects'

    def handle(self, *args, **options):
        # 1. Domains
        general, _ = Domain.objects.get_or_create(name='General')
        vocational, _ = Domain.objects.get_or_create(name='Vocational')

        # 2. SubDomains
        arts, _ = SubDomain.objects.get_or_create(domain=general, name='Arts')
        science, _ = SubDomain.objects.get_or_create(domain=general, name='Science')
        technical, _ = SubDomain.objects.get_or_create(domain=vocational, name='Technical')
        commercial, _ = SubDomain.objects.get_or_create(domain=vocational, name='Commercial')

        # 3. Academic Levels
        junior_names = ['Form 1', 'Form 2', 'Form 3']
        senior_names = ['Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth']
        all_names = junior_names + senior_names

        # Vocational Section (F1 - U6)
        for name in all_names:
            AcademicLevel.objects.get_or_create(name=name, domain=vocational, sub_domain=technical)
            AcademicLevel.objects.get_or_create(name=name, domain=vocational, sub_domain=commercial)

        # General Section
        for name in junior_names:
            AcademicLevel.objects.get_or_create(name=name, domain=general, sub_domain=None)
        for name in senior_names:
            AcademicLevel.objects.get_or_create(name=name, domain=general, sub_domain=arts)
            AcademicLevel.objects.get_or_create(name=name, domain=general, sub_domain=science)

        # 4. Departments (Requested Sections)
        dept_gen, _ = Department.objects.get_or_create(name='General Subjects', code='GEN', type='CORE')
        dept_sci, _ = Department.objects.get_or_create(name='Science Subjects', code='SCI', type='CORE')
        dept_art, _ = Department.objects.get_or_create(name='Arts Subjects', code='ART', type='CORE')
        dept_voc, _ = Department.objects.get_or_create(name='Vocational Subjects', code='VOC', type='CORE')

        # 5. Cameroon GCE Curriculum Subjects
        gce_subjects = {
            dept_gen: [
                'English Language', 'French', 'Mathematics', 'Religious Studies', 
                'Geography', 'History', 'Philosophy', 'Logic', 'Citizenship Education'
            ],
            dept_sci: [
                'Biology', 'Chemistry', 'Physics', 'Additional Mathematics', 
                'Geology', 'ICT', 'Computer Science', 'Human Biology'
            ],
            dept_art: [
                'Literature in English', 'Economics', 'Commerce', 'Food and Nutrition', 
                'Home Economics', 'Special Bilingual Education'
            ],
            dept_voc: [
                'Accounting', 'Business Management', 'Engineering Drawing', 'Woodwork',
                'Metalwork', 'Building Construction', 'Electronics'
            ]
        }

        for dept, subjects in gce_subjects.items():
            for sub_name in subjects:
                BaseSubject.objects.get_or_create(name=sub_name, department=dept)

        self.stdout.write(self.style.SUCCESS('Successfully initialized complex academic structure and Cameroon GCE Catalog'))
