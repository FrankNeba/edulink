from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.accounts.views import UserViewSet
from apps.academic.views import DepartmentViewSet, SubjectViewSet, BaseSubjectViewSet, DomainViewSet, SubDomainViewSet, AcademicLevelViewSet
from apps.content.views import NoteViewSet, AnnouncementViewSet, SyllabusViewSet, AssignmentViewSet
from apps.quizzes.views import QuizViewSet, QuizAttemptViewSet, QuestionViewSet, ChoiceViewSet
from apps.notifications.views import NotificationViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'domains', DomainViewSet)
router.register(r'sub-domains', SubDomainViewSet)
router.register(r'academic-levels', AcademicLevelViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'base-subjects', BaseSubjectViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'syllabi', SyllabusViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'choices', ChoiceViewSet, basename='choice')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health/', health_check, name='health_check'),
]
